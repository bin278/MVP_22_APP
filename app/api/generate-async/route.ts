import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { requireAuth } from '@/lib/auth/auth'
import { add, update, query, getUserAdapter } from '@/lib/database'
import OpenAI from 'openai'
import { recordRecommendationUsage } from '@/lib/subscription/usage-tracker'
import { CODE_GENERATION_SYSTEM_PROMPT, CODE_GENERATION_SYSTEM_PROMPT_FREE } from '@/lib/ai-prompts'

// Vercel Serverless Function 超时配置 (秒)
export const maxDuration = 60

// 导入SSE广播函数
function broadcastTaskUpdate(taskId: string, data: any) {
  // 动态导入SSE模块
  import('./[taskId]/stream/route').then(({ broadcastTaskUpdate: broadcast }) => {
    broadcast(taskId, data)
  }).catch(error => {
    console.error('Failed to import broadcast function:', error)
  })
}

// 任务状态枚举
enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 任务接口
interface GenerationTask {
  _id?: string  // CloudBase 文档 ID
  id?: string   // Supabase 行 ID
  taskId: string
  userId: string
  conversationId?: string
  prompt: string
  model: string
  status: TaskStatus
  progress: number
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
}

// 全局任务队列（仅用于本地开发,Vercel 使用数据库）
// 使用全局变量避免热重载时的重置
if (!(global as any).taskQueue) {
  (global as any).taskQueue = new Map<string, GenerationTask>()
}
export const taskQueue = (global as any).taskQueue as Map<string, GenerationTask>

// 数据库任务存储辅助函数
async function saveTaskToDB(task: GenerationTask) {
  try {
    const result = await add('generation_tasks', task)
    console.log(`✅ 任务已保存到数据库: ${task.taskId}`, result)
    return result
  } catch (error) {
    console.error('❌ 保存任务到数据库失败:', error)
    throw error // 抛出错误，让调用者知道保存失败
  }
}

async function getTaskFromDB(taskId: string): Promise<GenerationTask | null> {
  try {
    const result = await query('generation_tasks', { where: { taskId } })
    if (result && result.data && result.data.length > 0) {
      return result.data[0] as GenerationTask
    }
    return null
  } catch (error) {
    console.error('从数据库获取任务失败:', error)
    return null
  }
}

async function updateTaskInDB(taskId: string, updates: Partial<GenerationTask>) {
  try {
    console.log(`📝 [DB] 准备更新任务: ${taskId}, 更新内容:`, Object.keys(updates))

    // 需要先通过 taskId 查询获取文档 ID
    const result = await query('generation_tasks', { where: { taskId } })

    if (!result || !result.data || result.data.length === 0) {
      console.error(`❌ [DB] 未找到任务: ${taskId}`)
      return
    }

    const taskRecord = result.data[0] as any

    // CloudBase 使用 _id，Supabase 使用 id
    const recordId = taskRecord._id || taskRecord.id

    console.log(`📋 [DB] 找到任务记录，ID: ${recordId}`)

    // 使用文档 ID 更新记录
    await update('generation_tasks', recordId, updates)
    console.log(`✅ [DB] 任务已在数据库中更新: ${taskId}`)
  } catch (error) {
    console.error('❌ [DB] 更新数据库中的任务失败:', error)
    console.error('错误详情:', {
      message: (error as any).message,
      code: (error as any).code,
      hint: (error as any).hint,
      details: (error as any).details
    })
  }
}

// AI客户端初始化
function getAIClient(model: string) {
  // 导入模型配置
  const { AVAILABLE_MODELS } = require('@/lib/subscription-tiers')
  const modelConfig = AVAILABLE_MODELS[model]

  if (!modelConfig) {
    throw new Error(`Unsupported model: ${model}`)
  }

  let apiKey: string | undefined
  let baseURL: string | undefined

  // 设置超时时间为 180 秒（3分钟），支持复杂项目生成
  const timeout = 180000

  switch (modelConfig.provider) {
    case 'dashscope':
      console.log('🔑 使用阿里云百炼 API:', {
        baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        hasKey: !!process.env.DASHSCOPE_API_KEY,
        keyPrefix: process.env.DASHSCOPE_API_KEY?.substring(0, 10)
      })
      return new OpenAI({
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        timeout,
      })
    case 'deepseek':
      console.log('🔑 使用 DeepSeek API:', {
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        hasKey: !!process.env.DEEPSEEK_API_KEY,
        keyPrefix: process.env.DEEPSEEK_API_KEY?.substring(0, 10)
      })
      return new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        timeout,
      })
    case 'zhipu':
      console.log('🔑 使用智谱 AI API')
      return new OpenAI({
        apiKey: process.env.GLM_API_KEY,
        baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/',
        timeout,
      })
    default:
      console.log('🔑 使用 OpenAI API')
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout,
      })
  }
}

// 格式化代码
function formatCodeString(code: string): string {
  const lineCount = (code.match(/\n/g) || []).length
  if (lineCount > 5) {
    return code
  }

  // 简单的代码格式化
  let formatted = code
    .replace(/;/g, ';\n')
    .replace(/{/g, '{\n')
    .replace(/}/g, '\n}')
    .replace(/\n\s*\n\s*\n/g, '\n\n')

  return formatted
}

// 创建项目结构（从 AI 返回的 JSON 解析）
function createProjectFromAIResponse(aiContent: string): any {
  try {
    // 尝试从 AI 响应中提取 JSON
    let jsonContent = aiContent.trim()

    // 检查是否包含 markdown 代码块 - 优先匹配 json 代码块
    const jsonBlockRegex = /```json\s*([\s\S]*?)```/
    const jsonMatch = aiContent.match(jsonBlockRegex)
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim()
      console.log('📦 Extracted JSON from json code block')
    } else {
      // 如果没有 json 代码块，尝试匹配任意代码块但验证内容是否像 JSON
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g
      let match
      while ((match = codeBlockRegex.exec(aiContent)) !== null) {
        const content = match[1].trim()
        // 检查内容是否以 { 开头，表示可能是 JSON
        if (content.startsWith('{')) {
          jsonContent = content
          console.log('📦 Extracted JSON from code block')
          break
        }
      }
    }

    // 如果没有找到代码块中的 JSON，尝试直接从内容中查找 JSON
    if (!jsonContent.startsWith('{')) {
      const jsonStart = aiContent.indexOf('{')
      if (jsonStart !== -1) {
        jsonContent = aiContent.substring(jsonStart)
        console.log('📦 Extracted JSON from raw content')
      }
    }

    // 查找 JSON 边界
    const jsonStart = jsonContent.indexOf('{')
    let jsonEnd = jsonContent.lastIndexOf('}')

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1)
    }

    // 检测是否被截断
    const openBraces = (jsonContent.match(/\{/g) || []).length
    const closeBraces = (jsonContent.match(/\}/g) || []).length
    const quotes = (jsonContent.match(/"/g) || []).length

    console.log(`📊 JSON analysis: ${openBraces} open braces, ${closeBraces} close braces, ${quotes} quotes`)

    // 如果 JSON 明显被截断（括号或引号不平衡），使用更安全的修复方法
    if (closeBraces < openBraces || quotes % 2 !== 0) {
      console.warn('⚠️ Response appears truncated, using safe extraction method')

      // 动态提取所有文件
      const files: Record<string, string> = {}

      // 打印 JSON 内容的前 500 字符用于调试
      console.log('📄 JSON content preview:', jsonContent.substring(0, 500))

      // 先尝试直接匹配 App 文件（支持双引号和反引号）
      const appPatterns = [
        /"src\/App\.jsx"\s*:\s*"((?:[^"\\]|\\[\s\S])*?)"/s,
        /"src\/App\.tsx"\s*:\s*"((?:[^"\\]|\\[\s\S])*?)"/s,
        /"src\/App\.jsx"\s*:\s*`([\s\S]*?)`/s,  // 反引号格式
        /"src\/App\.tsx"\s*:\s*`([\s\S]*?)`/s,  // 反引号格式
        /"App\.jsx"\s*:\s*"((?:[^"\\]|\\[\s\S])*?)"/s,
        /"App\.tsx"\s*:\s*"((?:[^"\\]|\\[\s\S])*?)"/s,
        /"App\.jsx"\s*:\s*`([\s\S]*?)`/s,  // 反引号格式
        /"App\.tsx"\s*:\s*`([\s\S]*?)`/s,  // 反引号格式
        // 如果上面的匹配失败，尝试匹配到文件末尾（处理截断情况）
        /"src\/App\.jsx"\s*:\s*["`]([\s\S]*)/s,
        /"src\/App\.tsx"\s*:\s*["`]([\s\S]*)/s,
      ]

      for (const pattern of appPatterns) {
        const match = jsonContent.match(pattern)
        if (match && match[1]) {
          let content = match[1]
          // 转换 JSON 转义字符为实际字符
          // 注意：必须先处理 \\\\ 再处理其他转义
          content = content
            .replace(/\\\\/g, '\x00BACKSLASH\x00')  // 临时替换
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '  ')
            .replace(/\\"/g, '"')
            .replace(/\x00BACKSLASH\x00/g, '\\')  // 恢复反斜杠
          if (content.trim() && content.length > 50) {
            files['src/App.jsx'] = content.trim()
            console.log('✅ Extracted src/App.jsx via direct match, length:', content.length)
            break
          }
        }
      }

      // 如果还是没有找到 App 文件，尝试更宽松的匹配
      if (!files['src/App.jsx']) {
        console.log('⚠️ App file not found with standard patterns, trying loose match...')
        // 查找任何包含 "function App" 或 "const App" 的内容
        const looseMatch = jsonContent.match(/"[^"]*App[^"]*"\s*:\s*"((?:[^"\\]|\\[\s\S])*?)"/s)
        if (looseMatch && looseMatch[1]) {
          let content = looseMatch[1]
          content = content.replace(/\\n/g, '\n').replace(/\\t/g, '  ').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          if (content.includes('function') || content.includes('const') || content.includes('import')) {
            files['src/App.jsx'] = content.trim()
            console.log('✅ Extracted App via loose match, length:', content.length)
          }
        }
      }

      // 提取 index.css（支持截断，多种路径格式，支持反引号）
      const cssPatterns = [
        /"src\/index\.css"\s*:\s*"((?:[^"\\]|\\[\s\S])*?)"/s,
        /"src\/index\.css"\s*:\s*`([\s\S]*?)`/s,
        /"index\.css"\s*:\s*"((?:[^"\\]|\\[\s\S])*?)"/s,
        /"index\.css"\s*:\s*`([\s\S]*?)`/s,
        /"src\/index\.css"\s*:\s*["`]([\s\S]*)/s,
        /"index\.css"\s*:\s*["`]([\s\S]*)/s,
      ]
      for (const pattern of cssPatterns) {
        const match = jsonContent.match(pattern)
        if (match && match[1]) {
          let content = match[1]
          content = content.replace(/",\s*"[^"]*"\s*:\s*[\s\S]*$/, '')
          content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          if (content.trim()) {
            files['src/index.css'] = content.trim()
            console.log('✅ Extracted src/index.css, length:', content.length)
            break
          }
        }
      }

      // 匹配其他文件路径模式
      const filePatterns = [
        /\"(src\/components\/[^"]+\.(?:tsx|jsx))\"\s*:\s*\"/gs,
        /\"(src\/hooks\/[^"]+\.(?:ts|js))\"\s*:\s*\"/gs,
        /\"(src\/utils\/[^"]+\.(?:ts|js))\"\s*:\s*\"/gs,
        /\"(src\/types\/[^"]+\.(?:ts|js))\"\s*:\s*\"/gs,
        /\"(src\/context\/[^"]+\.(?:tsx|jsx))\"\s*:\s*\"/gs,
        /\"(README\.md)\"\s*:\s*\"/gs,
      ]

      // 提取每个匹配的文件
      for (const pattern of filePatterns) {
        let match
        while ((match = pattern.exec(jsonContent)) !== null) {
          const filePath = match[1]
          const startIndex = match.index + match[0].length
          let content = ''

          let i = startIndex
          while (i < jsonContent.length) {
            const char = jsonContent[i]
            if (char === '\\' && i + 1 < jsonContent.length && jsonContent[i + 1] === '"') {
              content += '\\"'
              i += 2
              continue
            }
            if (char === '"') {
              let escapeCount = 0
              for (let j = i - 1; j >= startIndex && jsonContent[j] === '\\'; j--) {
                escapeCount++
              }
              if (escapeCount % 2 === 0) break
            }
            content += char
            i++
          }

          content = content.replace(/\\n/g, '\n').replace(/\\t/g, '  ').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          if (content.trim()) {
            files[filePath] = content.trim()
            console.log(`✅ Extracted ${filePath}, length:`, content.length)
          }
        }
      }

      // 提取 package.json - 使用括号匹配
      const pkgStartMatch = jsonContent.match(/"package\.json"\s*:\s*"/s)
      if (pkgStartMatch) {
        const startIndex = pkgStartMatch.index + pkgStartMatch[0].length
        let braceCount = 0
        let pkgContent = ''

        let i = startIndex
        while (i < jsonContent.length) {
          const char = jsonContent[i]

          if (char === '\\' && i + 1 < jsonContent.length && jsonContent[i + 1] === '"') {
            pkgContent += '\\"'
            i += 2
            continue
          }

          if (char === '"') {
            let escapeCount = 0
            for (let j = i - 1; j >= startIndex && jsonContent[j] === '\\'; j--) {
              escapeCount++
            }
            if (escapeCount % 2 === 0) {
              // 字符串结束
              break
            }
          }

          if (char === '{') braceCount++
          if (char === '}') braceCount--

          pkgContent += char
          i++

          // 如果括号平衡，可能到了内容末尾
          if (braceCount === 0 && pkgContent.length > 10) {
            // 再检查下一个字符是否是字符串结束引号
            if (i < jsonContent.length && jsonContent[i] === '"') {
              // 检查是否转义
              let escapeCount = 0
              for (let j = i - 1; j >= startIndex && jsonContent[j] === '\\'; j--) {
                escapeCount++
              }
              if (escapeCount % 2 === 0) {
                break
              }
            }
          }
        }

        try {
          const pkgJson = JSON.parse(pkgContent.replace(/\\"/g, '"'))
          files['package.json'] = JSON.stringify(pkgJson, null, 2)
          console.log('✅ Extracted package.json')
        } catch (e) {
          console.warn('⚠️ Failed to parse package.json, using default:', e)
          files['package.json'] = JSON.stringify({
            "name": "generated-app",
            "version": "0.1.0",
            "dependencies": {
              "react": "^18.2.0",
              "react-dom": "^18.2.0"
            }
          }, null, 2)
        }
      } else {
        console.warn('⚠️ Could not find package.json in JSON')
      }

      // 添加 README.md
      files['README.md'] = `# Generated React Project

This project was generated by AI based on your requirements.

## 📦 Installation

\`\`\`bash
npm install
\`\`\`

## 🚀 Usage

\`\`\`bash
npm run dev
\`\`\`

The application will open at http://localhost:3000

## 📁 Project Structure

- \`src/App.jsx\` - Main application component
- \`src/index.css\` - Global styles
- \`package.json\` - Project dependencies

## 🎨 Features

- React 18 with hooks
- Modern UI with Tailwind CSS
- Responsive design
- Clean, maintainable code

## 📝 Customization

Edit \`src/App.tsx\` to modify the application logic and UI.
`
      console.log('✅ Added README.md')

      const fileNames = Object.keys(files)
      console.log(`📁 Extracted ${fileNames.length} files:`, fileNames.join(', '))

      return {
        files,
        projectName: 'generated-app'
      }
    }

    // 如果看起来完整，尝试直接解析
    const parsed = JSON.parse(jsonContent)

    // 记录生成的文件
    const fileNames = Object.keys(parsed.files || {})
    console.log(`📁 Generated ${fileNames.length} files:`, fileNames.join(', '))

    // 验证 App 文件的换行符是否正确
    const appContent = parsed.files['src/App.jsx'] || parsed.files['src/App.tsx'] || ''
    const hasNewlines = appContent.includes('\n')
    const hasDoubleEscape = appContent.includes('\\n')
    console.log(`📝 App validation:`, {
      length: appContent.length,
      hasNewlines,
      hasDoubleEscape,
      preview: appContent.substring(0, 100)
    })

    if (!parsed.files['README.md']) {
      console.warn('⚠️ README.md is missing from generated files!')
    }

    // 如果 AI 没有生成 index.html,自动创建一个默认的
    if (!parsed.files['index.html']) {
      console.warn('⚠️ index.html is missing, creating default one')
      const entryFile = parsed.files['src/main.jsx'] ? '/src/main.jsx' : '/src/index.js'
      parsed.files['index.html'] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Generated React App" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="${entryFile}"></script>
  </body>
</html>`
      console.log(`✅ 自动创建 index.html,入口文件: ${entryFile}`)
    } else {
      // 修复 index.html 文件,确保包含正确的入口脚本引用
      let indexHtml = parsed.files['index.html']

      // 移除 %PUBLIC_URL% 语法
      indexHtml = indexHtml.replace(/%PUBLIC_URL%\//g, '/')

      // 检查是否已经包含入口脚本引用
      if (!indexHtml.includes('<script') || !indexHtml.includes('/src/index.js') && !indexHtml.includes('/src/main.jsx')) {
        // 在 </body> 之前添加入口脚本引用
        const entryFile = parsed.files['src/main.jsx'] ? '/src/main.jsx' : '/src/index.js'
        indexHtml = indexHtml.replace(
          '</body>',
          `    <script type="module" src="${entryFile}"></script>\n  </body>`
        )
        console.log(`✅ 自动添加入口脚本引用: ${entryFile}`)
      }

      parsed.files['index.html'] = indexHtml
    }

    return parsed
  } catch (error) {
    console.warn('⚠️ Failed to parse AI response as JSON, using fallback:', error)
    console.warn('Error details:', error.message)

    // 最后的回退：尝试提取原始代码
    let appCode = aiContent

    // 移除 markdown 代码块标记
    appCode = appCode.replace(/```(?:tsx?|javascript|json|jsx)?\s*([\s\S]*?)```/g, '$1')

    // 检查是否包含有效的 React 代码
    const hasValidCode = appCode.includes('import React') ||
                        appCode.includes('function App') ||
                        appCode.includes('const App') ||
                        appCode.includes('export default')

    // 如果不是有效代码，生成一个默认组件
    if (!hasValidCode) {
      console.warn('⚠️ AI response does not contain valid React code, using default component')
      appCode = `import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          代码生成失败
        </h1>
        <p className="text-gray-600 mb-4">
          AI 未能生成有效的代码，请重试或简化您的需求。
        </p>
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          点击测试: {count}
        </button>
      </div>
    </div>
  );
}

export default App;`
    } else {
      // 如果包含 "files" 或 "projectName"，可能是 JSON 响应
      if (appCode.includes('"files"') || appCode.includes('"projectName"')) {
        // 尝试提取 App 的内容
        const codeMatch = appCode.match(/function\s+App\s*\(|const\s+App\s*=\s*\(/)
        if (codeMatch) {
          const start = appCode.indexOf(codeMatch[0])
          appCode = appCode.substring(start)
          // 清理尾部内容
          const exportMatch = appCode.match(/export\s+default\s+App/)
          if (exportMatch) {
            appCode = appCode.substring(0, appCode.indexOf(exportMatch[0]) + exportMatch[0].length)
          }
          console.log('📦 Extracted App code from response')
        }
      }
    }

    // 返回基本结构，包含 README.md
    return {
      files: {
        'src/App.jsx': appCode.trim(),
        'src/index.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.5;
}`,
        'README.md': `# Generated Project

This project was generated by AI.

## Installation

\`\`\`bash
npm install
npm run dev
\`\`\`

## Usage

The main application is in \`src/App.jsx\`.

## Features

- React-based UI
- Modern responsive design
- Clean code structure
`,
        'package.json': JSON.stringify({
          "name": "generated-app",
          "version": "0.1.0",
          "scripts": {
            "dev": "vite",
            "build": "vite build",
            "preview": "vite preview"
          },
          "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          },
          "devDependencies": {
            "@vitejs/plugin-react": "^4.0.0",
            "vite": "^4.3.0"
          }
        }, null, 2)
      },
      projectName: 'generated-app'
    }
  }
}

// 验证生成的代码
function validateGeneratedCode(files: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查必需的文件
  const hasAppFile = Object.keys(files).some(path =>
    path === 'src/App.jsx' || path === 'src/App.tsx' || path === 'App.jsx' || path === 'App.tsx'
  )
  if (!hasAppFile) {
    errors.push('Missing required file: src/App.jsx or src/App.tsx')
  }

  // 使用 Babel 编译验证 JSX/TSX 文件（优先级最高）
  for (const [filePath, code] of Object.entries(files)) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) continue

    try {
      const babel = require('@babel/standalone')
      babel.transform(code, {
        presets: ['react', 'typescript'],
        filename: filePath,
      })
    } catch (err: any) {
      // 简化错误信息，让 AI 更容易理解
      let errorMsg = err.message
      if (errorMsg.includes('Unexpected token')) {
        errorMsg = `Syntax error: ${errorMsg}. Check JSX syntax, missing tags, or incorrect nesting.`
      } else if (errorMsg.includes('Expected')) {
        errorMsg = `Missing element: ${errorMsg}. Ensure all JSX elements are properly closed.`
      }
      errors.push(`${filePath}: ${errorMsg}`)
    }
  }

  // 如果 Babel 验证失败，立即返回，不进行后续验证
  if (errors.length > 0) {
    return { valid: false, errors }
  }

  // 收集所有文件中定义的 hooks 和组件
  const definedHooks = new Set<string>()
  const definedComponents = new Set<string>()

  for (const [filePath, code] of Object.entries(files)) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js') && !filePath.endsWith('.ts')) continue

    // 收集定义的 hooks
    const hookDefPattern = /(?:function\s+(use[A-Z][a-zA-Z0-9]*)|const\s+(use[A-Z][a-zA-Z0-9]*)\s*=)/g
    let match
    while ((match = hookDefPattern.exec(code)) !== null) {
      const hookName = match[1] || match[2]
      if (hookName) definedHooks.add(hookName)
    }

    // 收集定义的组件
    const compDefPattern = /(?:function\s+([A-Z][a-zA-Z0-9]*)|const\s+([A-Z][a-zA-Z0-9]*)\s*=)/g
    while ((match = compDefPattern.exec(code)) !== null) {
      const compName = match[1] || match[2]
      if (compName && !compName.startsWith('use')) definedComponents.add(compName)
    }
  }

  // 检查每个文件
  for (const [filePath, code] of Object.entries(files)) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js') && !filePath.endsWith('.ts')) continue

    // 检查基本语法错误
    // 1. 检查 return 后面不能直接跟声明语句
    if (/return\s+(const|let|var|function|class)\s/.test(code)) {
      errors.push(`${filePath}: Invalid return statement followed by declaration`)
    }

    // 1.5. 检查不完整的三元表达式
    const ternaryPattern = /\?\s*[^:]+\s*(?:\)|;|,|\})/g
    const ternaryMatches = code.match(ternaryPattern)
    if (ternaryMatches) {
      for (const match of ternaryMatches) {
        if (!match.includes(':')) {
          errors.push(`${filePath}: Incomplete ternary expression - missing ':' part`)
          break
        }
      }
    }

    // 2. 检查 JSX 标签匹配（检查所有标签，包括HTML标签）
    const jsxOpenMatches = [...code.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*?(?:>|\/?>)/g)]
    const jsxCloseMatches = [...code.matchAll(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g)]

    const openTags: string[] = []
    for (const match of jsxOpenMatches) {
      if (!match[0].endsWith('/>')) { // 不是自闭合标签
        openTags.push(match[1])
      }
    }

    const closeTags = jsxCloseMatches.map(m => m[1])

    if (openTags.length !== closeTags.length) {
      errors.push(`${filePath}: Unmatched JSX tags (${openTags.length} open, ${closeTags.length} close)`)
    } else {
      // 检查标签名是否匹配
      for (let i = 0; i < Math.min(openTags.length, closeTags.length); i++) {
        if (openTags[openTags.length - 1 - i] !== closeTags[i]) {
          errors.push(`${filePath}: JSX tag mismatch - expected </${openTags[openTags.length - 1 - i]}> but found </${closeTags[i]}>`)
          break
        }
      }
    }

    // 3. 检查相邻 JSX 元素（return 后有多个顶层元素）
    const returnJsxPattern = /return\s*\(\s*\n?\s*(<[A-Z])/g
    let returnMatch
    while ((returnMatch = returnJsxPattern.exec(code)) !== null) {
      const afterReturn = code.slice(returnMatch.index + returnMatch[0].length - 2)
      const lines = afterReturn.split('\n').slice(0, 20)
      let elementCount = 0
      let depth = 0

      for (const line of lines) {
        const openMatches = line.match(/<[A-Z][a-zA-Z0-9]*[^>]*?>/g) || []
        const closeMatches = line.match(/<\/[A-Z][a-zA-Z0-9]*>/g) || []
        const selfCloseMatches = line.match(/<[A-Z][a-zA-Z0-9]*[^>]*?\/>/g) || []

        depth += openMatches.length - selfCloseMatches.length - closeMatches.length

        if (depth === 0 && (openMatches.length > 0 || selfCloseMatches.length > 0)) {
          elementCount++
        }

        if (line.includes(')') && depth === 0) break
      }

      if (elementCount > 1) {
        errors.push(`${filePath}: Adjacent JSX elements must be wrapped in an enclosing tag or fragment`)
        break
      }
    }

    // 4. 检查函数结构（return 是否在函数内）
    const returnStatements = [...code.matchAll(/\breturn\s*[\(\{<]/g)]
    for (const returnMatch of returnStatements) {
      const beforeReturn = code.slice(0, returnMatch.index)
      const functionMatches = beforeReturn.match(/\b(?:function|const|let|var)\s+\w+/g) || []
      const openBraces = (beforeReturn.match(/\{/g) || []).length
      const closeBraces = (beforeReturn.match(/\}/g) || []).length

      if (functionMatches.length === 0 || openBraces <= closeBraces) {
        errors.push(`${filePath}: 'return' outside of function`)
        break
      }
    }

    // 3. 检查括号匹配
    const openParens = (code.match(/\(/g) || []).length
    const closeParens = (code.match(/\)/g) || []).length
    if (Math.abs(openParens - closeParens) > 5) {
      errors.push(`${filePath}: Unmatched parentheses (${openParens} open, ${closeParens} close)`)
    }

    // 4. 检查是否有 javascript: 前缀（常见错误）
    if (code.includes('javascript:')) {
      errors.push(`${filePath}: Contains invalid 'javascript:' prefix`)
    }

    // 检查 React 导入
    if (/\bReact\.\w+/.test(code) && !/import\s+React/.test(code)) {
      errors.push(`${filePath}: Uses React but missing 'import React' statement`)
    }

    // 检查常见的未定义变量
    const commonVars = ['left', 'right', 'top', 'bottom', 'width', 'height', 'x', 'y', 'value', 'data']
    for (const varName of commonVars) {
      const usageRegex = new RegExp(`\\b${varName}\\b(?!\\s*[=:])`, 'g')
      const declarationRegex = new RegExp(`(?:const|let|var)\\s+${varName}\\b`, 'g')

      const usages = code.match(usageRegex) || []
      const declarations = code.match(declarationRegex) || []

      if (usages.length > 0 && declarations.length === 0) {
        errors.push(`${filePath}: Variable '${varName}' is used but not declared`)
      }
    }

    // 检查未定义的自定义 hooks
    const customHookUsage = code.match(/\buse[A-Z]\w+/g)
    if (customHookUsage) {
      const allowedHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer']
      const forbiddenHooks = customHookUsage.filter(hook => !allowedHooks.includes(hook))
      if (forbiddenHooks.length > 0) {
        errors.push(`${filePath}: Uses forbidden custom hooks: ${forbiddenHooks.join(', ')}. Only use React built-in hooks: ${allowedHooks.join(', ')}`)
      }
    }

    // 检查是否生成了自定义 hook 文件
    if (filePath.includes('/hooks/') || filePath.includes('\\hooks\\')) {
      errors.push(`${filePath}: Custom hook files are forbidden. Implement functionality directly with useState and useEffect in components`)
    }
    const customHooks = code.match(/\b(use[A-Z][a-zA-Z0-9]*)\s*\(/g) || []
    const hookNames = [...new Set(customHooks.map(hook => hook.replace(/\s*\($/, '')))]
    const builtinHooks = ['useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 'useMemo', 'useRef', 'useImperativeHandle', 'useLayoutEffect', 'useDebugValue', 'useId', 'useTransition', 'useDeferredValue', 'useSyncExternalStore', 'useInsertionEffect']

    for (const hookName of hookNames) {
      if (!builtinHooks.includes(hookName) && !definedHooks.has(hookName)) {
        errors.push(`${filePath}: Undefined custom hook: ${hookName}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

// 文件排序函数：按优先级排序文件
function sortFilesByPriority(files: string[]): string[] {
  const priority: Record<string, number> = {
    'package.json': 1,
    '.css': 2,
    'App.jsx': 3,
    'App.tsx': 3,
    'components/': 4,
    'hooks/': 5,
    'utils/': 6,
    'README.md': 99
  }

  return files.sort((a, b) => {
    const getPriority = (file: string) => {
      for (const [key, value] of Object.entries(priority)) {
        if (file.includes(key)) return value
      }
      return 50
    }
    return getPriority(a) - getPriority(b)
  })
}

// 单文件生成函数
async function generateSingleFile(
  fileName: string,
  userPrompt: string,
  context: Record<string, string>,
  model: string,
  client: any,
  modelConfig: any,
  previousErrors?: string[]
): Promise<string> {
  const { CODE_GENERATION_SYSTEM_PROMPT } = require('@/lib/ai-prompts')

  let systemPrompt = ''
  let filePrompt = `Generate ONLY the file: ${fileName}

User requirement: ${userPrompt}

${Object.keys(context).length > 0 ? `
Already generated files:
${Object.keys(context).map(f => `- ${f}`).join('\n')}

Use these files as context but do NOT regenerate them.
` : ''}

${previousErrors && previousErrors.length > 0 ? `
IMPORTANT: Previous attempt had these errors - FIX THEM:
${previousErrors.map((err, i) => `${i + 1}. ${err}`).join('\n')}
` : ''}

Return ONLY the file content, no JSON wrapper, no explanations.`

  if (fileName === 'package.json') {
    systemPrompt = 'Generate a valid package.json with React 18, Vite, and necessary dependencies.'
  } else if (fileName.endsWith('.css')) {
    systemPrompt = 'Generate CSS styles. Use modern CSS with good defaults.'
  } else if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) {
    systemPrompt = CODE_GENERATION_SYSTEM_PROMPT
  }

  const completion = await client.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: filePrompt }
    ],
    max_tokens: Math.min(modelConfig?.maxTokens || 8192, 8192),
    temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE!),
  })

  let content = completion.choices[0]?.message?.content || ''
  content = content.replace(/^```(?:json|jsx|tsx|css)?\n?/gm, '').replace(/\n?```$/gm, '').trim()

  return content
}

// 异步代码生成（分步生成）
async function generateCodeAsync(
  prompt: string,
  model: string,
  onProgress: (progress: number) => void,
  userTier: string = 'free',
  retryCount: number = 0,
  previousErrors: string[] = [],
  previousCode?: any
): Promise<any> {
  const maxRetries = 2
  const client = getAIClient(model)

  // 获取模型配置和统一提示词
  const { AVAILABLE_MODELS } = require('@/lib/subscription-tiers')
  const { CODE_GENERATION_SYSTEM_PROMPT, CODE_GENERATION_SYSTEM_PROMPT_FREE } = require('@/lib/ai-prompts')
  const modelConfig = AVAILABLE_MODELS[model]

  // 根据用户层级选择提示词
  const systemPrompt = userTier === 'free' ? CODE_GENERATION_SYSTEM_PROMPT_FREE : CODE_GENERATION_SYSTEM_PROMPT

  onProgress(10)

  try {
    console.log('🤖 开始调用 AI API (分步生成), model:', model)

    // 如果是重试且有之前的代码，使用修复模式
    if (retryCount > 0 && previousErrors.length > 0 && previousCode) {
      console.log('🔧 使用修复模式重试')
      const systemPrompt = `You are a code fixing assistant. Fix the errors in the provided code.

ERRORS TO FIX:
${previousErrors.map((err, i) => `${i + 1}. ${err}`).join('\n')}

INSTRUCTIONS:
- Fix ONLY the errors listed above
- Keep all other code unchanged
- Return the complete fixed JSON with all files
- Use the same JSON format as the original code

Return JSON format:
{"files":{"src/App.jsx":"...","src/index.css":"...","package.json":"...","README.md":"..."},"projectName":"my-app"}`

      const userPrompt = `Fix these errors in the code:

ERRORS:
${previousErrors.join('\n')}

ORIGINAL CODE:
${JSON.stringify(previousCode, null, 2)}

Return the COMPLETE fixed code in JSON format.`

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: modelConfig?.maxTokens || 16384,
        temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE!),
      })

      onProgress(80)
      const generatedContent = completion.choices[0]?.message?.content || ''
      const project = createProjectFromAIResponse(generatedContent)

      // 添加 README.md（如果不存在）- 在文件限制检查之前添加
      if (!project.files['README.md']) {
        project.files['README.md'] = `# ${project.projectName || 'Generated Project'}

This project was generated by AI.

## Installation

\`\`\`bash
npm install
npm run dev
\`\`\`
`
      }

      // 免费用户文件数限制
      const { getMaxFiles } = require('@/lib/subscription-tiers')
      const maxFiles = getMaxFiles(userTier)
      if (maxFiles !== -1) {
        const fileNames = Object.keys(project.files)
        if (fileNames.length > maxFiles) {
          console.log(`⚠️ 免费用户限制: 最多 ${maxFiles} 个文件，截断多余文件`)
          const limitedFiles: Record<string, string> = {}
          fileNames.slice(0, maxFiles).forEach(name => {
            limitedFiles[name] = project.files[name]
          })
          project.files = limitedFiles
        }
      }

      // 验证并自动修复
      const validation = validateGeneratedCode(project.files)
      if (!validation.valid) {
        const { autoFixCode } = require('@/lib/code-auto-fix')
        const autoFix = autoFixCode(project.files, validation.errors)
        if (autoFix.fixedErrors.length > 0) {
          console.log(`🔧 [Auto-Fix] Fixed ${autoFix.fixedErrors.length} errors`)
          project.files = autoFix.fixedFiles
        }
      }

      onProgress(100)
      return project
    }

    // 第一步：获取文件列表（5%）
    onProgress(5)
    console.log('📋 [Step 1/2] 获取项目文件列表...')

    const structurePrompt = `Based on this requirement: ${prompt}

List ALL files needed for this project.
Return ONLY a JSON array: ["package.json", "src/App.jsx", ...]`

    const structureCompletion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a project structure planner.' },
        { role: 'user', content: structurePrompt }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    })

    const fileListStr = structureCompletion.choices[0]?.message?.content || '[]'
    let fileList = JSON.parse(fileListStr.replace(/```json\n?/g, '').replace(/\n?```/g, ''))

    // 确保必需文件存在
    const hasAppFile = fileList.some((f: string) => f.includes('App.jsx') || f.includes('App.tsx'))
    if (!hasAppFile) {
      fileList.push('src/App.jsx')
    }
    if (!fileList.includes('package.json')) {
      fileList.push('package.json')
    }
    if (!fileList.includes('README.md')) {
      fileList.push('README.md')
    }

    const sortedFiles = sortFilesByPriority(fileList)

    // 免费用户文件数限制
    const { getMaxFiles } = require('@/lib/subscription-tiers')
    const maxFiles = getMaxFiles(userTier)
    if (maxFiles !== -1 && sortedFiles.length > maxFiles) {
      console.log(`⚠️ 免费用户限制: 最多生成 ${maxFiles} 个文件，当前请求 ${sortedFiles.length} 个`)
      sortedFiles.splice(maxFiles) // 只保留前 maxFiles 个文件
    }

    console.log(`📋 需要生成 ${sortedFiles.length} 个文件:`, sortedFiles)

    // 第二步：逐个生成文件（5% → 95%）
    const project = {
      files: {} as Record<string, string>,
      projectName: 'generated-app'
    }

    for (let i = 0; i < sortedFiles.length; i++) {
      const fileName = sortedFiles[i]
      const progress = 5 + ((i + 1) / sortedFiles.length) * 90

      console.log(`📦 [${i+1}/${sortedFiles.length}] 生成: ${fileName}`)

      let fileRetryCount = 0
      const maxFileRetries = 5
      let fileErrors: string[] = []

      while (fileRetryCount <= maxFileRetries) {
        try {
          // 生成文件（重试时传递错误信息）
          const fileContent = await generateSingleFile(
            fileName,
            prompt,
            project.files,
            model,
            client,
            modelConfig,
            fileRetryCount > 0 ? fileErrors : undefined
          )

          // 验证文件（包括依赖检查）
          const tempFiles = { ...project.files, [fileName]: fileContent }
          const validation = validateGeneratedCode(tempFiles)

          // 检查当前文件的错误和依赖文件的错误
          fileErrors = validation.errors.filter(err => {
            if (err.startsWith(fileName)) return true
            // 检查当前文件是否依赖有错误的文件
            const errorFile = err.split(':')[0]
            return fileContent.includes(`from './${errorFile.replace('src/', '')}`) ||
                   fileContent.includes(`from './${errorFile}`)
          })

          if (fileErrors.length > 0) {
            console.warn(`⚠️ ${fileName} 有 ${fileErrors.length} 个错误:`, fileErrors)

            // 自动修复
            const { autoFixCode } = require('@/lib/code-auto-fix')
            const autoFix = autoFixCode({ [fileName]: fileContent }, fileErrors)

            if (autoFix.fixedErrors.length > 0) {
              console.log(`🔧 自动修复了 ${autoFix.fixedErrors.length} 个错误`)
              project.files[fileName] = autoFix.fixedFiles[fileName]
              break
            }

            // AI 重试
            if (autoFix.remainingErrors.length > 0 && fileRetryCount < maxFileRetries) {
              console.warn(`🔄 AI 重试 ${fileName} (${fileRetryCount + 1}/${maxFileRetries})`)
              fileRetryCount++
              continue
            }

            // 重试次数用完，仍有错误
            console.error(`❌ ${fileName} 重试次数用完，仍有 ${autoFix.remainingErrors.length} 个错误`)
          }

          project.files[fileName] = fileContent
          console.log(`✅ ${fileName} 完成`)
          break

        } catch (error) {
          console.error(`❌ ${fileName} 失败:`, error)
          if (fileRetryCount < maxFileRetries) {
            fileRetryCount++
            continue
          }
          throw error
        }
      }

      onProgress(progress)
    }

    onProgress(100)
    return project

  } catch (error: any) {
    console.error('AI生成失败:', error)
    console.error('错误详情:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type
    })
    throw new Error(error.message || 'AI服务调用失败')
  }
}

// 开始异步生成任务
export async function POST(request: NextRequest) {
  console.log('📥 收到异步生成请求')
  try {
    // 认证
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user
    const userTier = (user.subscription_plan === 'pro' || user.subscription_plan === 'enterprise') ? user.subscription_plan : 'free'
    const { prompt, model, conversationId, existingContent, isModification, originalCode } = await request.json()
    console.log('📝 请求参数:', { prompt: prompt.substring(0, 50) + '...', model, conversationId, isModification, userTier })

    // 生成唯一任务ID
    const taskId = `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建任务
    const task: GenerationTask = {
      taskId,
      userId: user.id,
      conversationId,
      prompt: prompt.trim(),
      model: model || 'deepseek-chat',
      status: TaskStatus.PENDING,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any

    // 存储到队列(用于本地开发)
    taskQueue.set(taskId, task)
    console.log(`✅ 任务已存储到全局队列: ${taskId}, 队列大小: ${taskQueue.size}`)

    // 同时保存到数据库(用于 Vercel)
    await saveTaskToDB(task)

    console.log(`✅ 任务创建完成，准备启动异步处理: ${taskId}`)

    // 异步执行任务（不等待，立即返回响应）
    const taskPromise = (async () => {
      try {
        console.log(`🚀 [ASYNC] 异步任务已启动: ${taskId}`)
        await processAsyncTask(task, existingContent, isModification)
        console.log(`✅ [ASYNC] 异步任务完成: ${taskId}`)
      } catch (error) {
        console.error(`❌ [ASYNC] 异步任务处理失败 [${taskId}]:`, error)
      }
    })()

    // 使用 waitUntil 确保任务在响应返回后继续执行
    waitUntil(taskPromise)

    console.log(`📤 [API] 立即返回响应，任务在后台执行: ${taskId}`)

    // 立即返回响应，不等待异步任务完成
    return NextResponse.json({
      success: true,
      taskId,
      status: 'accepted',
      message: '异步任务已提交处理'
    })

  } catch (error: any) {
    console.error('创建异步任务失败:', error)
    return NextResponse.json(
      { error: '创建任务失败' },
      { status: 500 }
    )
  }
}

// 检查任务是否被取消
async function checkIfTaskCancelled(taskId: string): Promise<boolean> {
  try {
    const result = await query('generation_tasks', { where: { taskId } })
    const task = result && result.data && result.data.length > 0 ? result.data[0] as any : null
    return task?.status === TaskStatus.CANCELLED
  } catch (error) {
    console.error('检查任务状态失败:', error)
    return false
  }
}

// 处理异步任务
async function processAsyncTask(task: GenerationTask, existingContent?: string, isModification: boolean = false) {
  try {
    // 获取用户信息以确定订阅层级
    const userAdapter = await getUserAdapter()
    const userResult = await userAdapter.getUserById(task.userId)
    const user = userResult?.data

    // 从 user_subscriptions 表获取活跃订阅信息
    const subscriptionResult = await userAdapter.getActiveSubscription(task.userId)
    const activeSubscription = subscriptionResult?.data

    // 优先使用 user_subscriptions 表的 plan_type，如果没有则使用 users 表的 subscription_plan
    const userTier = activeSubscription?.plan_type || user?.subscription_plan || 'free'

    console.log(`🔍 用户信息调试:`, {
      userId: user?.id,
      users_table_subscription_plan: user?.subscription_plan,
      user_subscriptions_table_plan_type: activeSubscription?.plan_type,
      subscription_status: activeSubscription?.status,
      final_userTier: userTier
    })
    console.log(`📊 用户层级: ${userTier}, maxFiles: ${userTier === 'free' ? 5 : '无限制'}`)

    // 更新状态为运行中
    task.status = TaskStatus.RUNNING
    task.startedAt = new Date().toISOString()
    task.progress = 10
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)

    // 同步到数据库
    await updateTaskInDB(task.taskId, {
      status: task.status,
      startedAt: task.startedAt,
      progress: task.progress,
      updatedAt: task.updatedAt
    })

    // 广播开始处理状态
    broadcastTaskUpdate(task.taskId, {
      type: 'status_update',
      status: TaskStatus.RUNNING,
      progress: 10,
      message: '开始处理任务...'
    })

    // 检查任务是否被取消
    if (await checkIfTaskCancelled(task.taskId)) {
      console.log(`🛑 任务 ${task.taskId} 已被取消，停止处理`)
      taskQueue.delete(task.taskId)
      return
    }

    // 如果有现有内容，从断点继续生成
    const fullPrompt = existingContent
      ? `Continue generating from this existing code:\n\n${existingContent}\n\nAdditional requirements: ${task.prompt}`
      : task.prompt

    console.log(`🎯 处理任务类型: ${isModification ? '修改' : '生成'}, 现有内容长度: ${existingContent?.length || 0}`)

    // 生成代码
    const result = await generateCodeAsync(
      fullPrompt,
      task.model,
      async (progress) => {
        // 在进度更新时检查是否被取消
        if (await checkIfTaskCancelled(task.taskId)) {
          console.log(`🛑 任务 ${task.taskId} 在生成过程中被取消`)
          throw new Error('TASK_CANCELLED')
        }

        task.progress = 10 + (progress * 0.8) // 10-90%
        task.updatedAt = new Date().toISOString()
        taskQueue.set(task.taskId, task)

        // 同步进度到数据库
        await updateTaskInDB(task.taskId, {
          progress: task.progress,
          updatedAt: task.updatedAt
        })

        // 广播进度更新
        broadcastTaskUpdate(task.taskId, {
          type: 'progress_update',
          progress: task.progress,
          message: `生成进度: ${Math.round(task.progress)}%`
        })
      },
      userTier
    )

    // 创建结果项目，包含修改标记
    const projectResult = result
    // 如果是修改任务，添加标记
    if (isModification) {
      (projectResult as any).isModification = true
    }

    // 如果有conversationId，保存生成的代码到数据库
    if (task.conversationId) {
      try {
        console.log('💾 [异步任务] 保存生成的代码到数据库, conversationId:', task.conversationId)

        // 保存生成的文件
        const filePromises = Object.entries(projectResult.files).map(async ([filePath, fileContent]) => {
          const fileData = {
            conversation_id: task.conversationId,
            user_id: task.userId,  // 添加 user_id 确保能读取到文件
            file_path: filePath,
            file_content: fileContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          return await add('conversation_files', fileData)
        })

        await Promise.all(filePromises)
        console.log(`📁 [异步任务] 所有文件已保存到数据库`)

        // 将 conversationId 包含在结果中
        projectResult.conversationId = task.conversationId
      } catch (saveError: any) {
        console.error('❌ [异步任务] 保存到数据库失败:', saveError)
        // 不阻止任务完成，但记录错误
      }
    }

    // 完成任务
    task.status = TaskStatus.COMPLETED
    task.progress = 100
    task.result = projectResult
    task.completedAt = new Date().toISOString()
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)

    // 同步到数据库
    await updateTaskInDB(task.taskId, {
      status: task.status,
      progress: task.progress,
      result: task.result,
      completedAt: task.completedAt,
      updatedAt: task.updatedAt
    })

    // 记录代码生成使用（包括修改代码）
    try {
      // 计算生成的内容长度
      let generatedLength = 0
      if (projectResult.files) {
        Object.values(projectResult.files).forEach((fileContent: any) => {
          generatedLength += String(fileContent).length
        })
      }

      await recordRecommendationUsage(task.userId, {
        model: task.model,
        prompt_length: task.prompt.length,
        generated_length: generatedLength,
        type: isModification ? 'code_modification' : 'code_generation'
      })
      console.log('✅ [异步任务] 代码生成使用已记录')
    } catch (usageError) {
      console.error('❌ [异步任务] 记录使用失败:', usageError)
      // 不影响任务完成，继续返回结果
    }

    // 广播完成状态
    broadcastTaskUpdate(task.taskId, {
      type: 'completed',
      result: result,
      message: '代码生成完成！'
    })

    console.log(`✅ 异步任务 ${task.taskId} 完成`)

  } catch (error: any) {
    // 检查是否是用户取消
    if (error.message === 'TASK_CANCELLED') {
      console.log(`🛑 异步任务 ${task.taskId} 已被用户取消`)

      // 从内存队列中删除
      taskQueue.delete(task.taskId)

      // 不更新数据库（已经通过 DELETE API 更新为 cancelled）
      // 不广播取消状态（DELETE API 已处理）
      return
    }

    console.error(`❌ 异步任务 ${task.taskId} 失败:`, error)

    // 任务失败
    task.status = TaskStatus.FAILED
    task.error = error.message || '生成失败'
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)

    // 同步到数据库
    await updateTaskInDB(task.taskId, {
      status: task.status,
      error: task.error,
      updatedAt: task.updatedAt
    })

    // 广播失败状态
    broadcastTaskUpdate(task.taskId, {
      type: 'failed',
      error: task.error,
      message: '代码生成失败'
    })
  }
}
