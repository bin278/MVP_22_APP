import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'
import { add, update, query } from '@/lib/database'
import OpenAI from 'openai'
import { recordRecommendationUsage } from '@/lib/subscription/usage-tracker'

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
      })
    case 'zhipu':
      console.log('🔑 使用智谱 AI API')
      return new OpenAI({
        apiKey: process.env.GLM_API_KEY,
        baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/',
      })
    default:
      console.log('🔑 使用 OpenAI API')
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
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

    // 检查是否包含 markdown 代码块
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/
    const match = aiContent.match(codeBlockRegex)
    if (match) {
      jsonContent = match[1].trim()
      console.log('📦 Extracted JSON from code block')
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

      // 匹配所有文件路径模式
      const filePatterns = [
        /\"(src\/App\.tsx)\"\s*:\s*\"/gs,
        /\"(src\/index\.css)\"\s*:\s*\"/gs,
        /\"(src\/components\/[^"]+\.tsx)\"\s*:\s*\"/gs,
        /\"(src\/hooks\/[^"]+\.ts)\"\s*:\s*\"/gs,
        /\"(src\/utils\/[^"]+\.ts)\"\s*:\s*\"/gs,
        /\"(src\/types\/[^"]+\.ts)\"\s*:\s*\"/gs,
        /\"(src\/context\/[^"]+\.tsx)\"\s*:\s*\"/gs,
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

- \`src/App.tsx\` - Main application component
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

    // 验证 App.tsx 的换行符是否正确
    const appContent = parsed.files['src/App.tsx'] || ''
    const hasNewlines = appContent.includes('\n')
    const hasDoubleEscape = appContent.includes('\\n')
    console.log(`📝 App.tsx validation:`, {
      length: appContent.length,
      hasNewlines,
      hasDoubleEscape,
      preview: appContent.substring(0, 100)
    })

    if (!parsed.files['README.md']) {
      console.warn('⚠️ README.md is missing from generated files!')
    }

    return parsed
  } catch (error) {
    console.warn('⚠️ Failed to parse AI response as JSON, using fallback:', error)
    console.warn('Error details:', error.message)

    // 最后的回退：尝试提取原始代码
    let appCode = aiContent

    // 移除 markdown 代码块标记
    appCode = appCode.replace(/```(?:tsx?|javascript|json)?\s*[\s\S]*?```/g, '')

    // 如果包含 "files" 或 "projectName"，可能是 JSON 响应
    if (appCode.includes('"files"') || appCode.includes('"projectName"')) {
      // 尝试提取 App.tsx 的内容
      const codeMatch = appCode.match(/function\s+App\s*\(|const\s+App\s*=\s*\(/)
      if (codeMatch) {
        const start = appCode.indexOf(codeMatch[0])
        appCode = appCode.substring(start)
        // 清理尾部内容
        const exportMatch = appCode.match(/export\s+default\s+App/)
        if (exportMatch) {
          appCode = appCode.substring(0, appCode.indexOf(exportMatch[0]) + exportMatch[0].length)
        }
        console.log('📦 Extracted App.tsx code from response')
      }
    }

    // 返回基本结构，包含 README.md
    return {
      files: {
        'src/App.tsx': appCode.trim(),
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

The main application is in \`src/App.tsx\`.

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

// 异步代码生成
async function generateCodeAsync(
  prompt: string,
  model: string,
  onProgress: (progress: number) => void
): Promise<any> {
  const client = getAIClient(model)

  onProgress(10)

  try {
    console.log('🤖 开始调用 AI API, model:', model)
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are an expert React developer. Generate a complete, production-ready React application as JSON.

REQUIRED FILES:
- src/App.tsx (main component)
- src/index.css (styles with Tailwind CSS)
- package.json (with all dependencies)
- README.md (project documentation)

OPTIONAL FILES (create as needed for complex projects):
- src/components/*.tsx (reusable components)
- src/hooks/*.ts (custom hooks)
- src/utils/*.ts (utility functions)
- src/types/*.ts (TypeScript types)
- src/context/*.tsx (React Context)

CODE QUALITY RULES:
- Use TypeScript with proper types
- Use React hooks: useState, useEffect, useCallback, useMemo, useContext
- Use Tailwind CSS for styling
- Write clean, maintainable, well-structured code
- Add comments for complex logic
- Handle loading and error states
- Make components responsive

COMPLEXITY GUIDELINES:
- Simple requests: Single component in App.tsx
- Medium requests: Multiple components in src/components/
- Complex requests: Full project structure with hooks, utils, context

README.md should include:
# Project Title
Description of the project.

## Features
- Feature 1
- Feature 2

## Installation
\`\`\`bash
npm install
npm run dev
\`\`\`

## Usage
How to use the application.

Return valid JSON:
{"files":{"src/App.tsx":"...","src/index.css":"...","package.json":"...","README.md":"..."},"projectName":"my-app"}`
        },
        {
          role: 'user',
          content: prompt.trim()
        }
      ],
      max_tokens: Math.min(parseInt(process.env.DEEPSEEK_MAX_TOKENS!), 8192),
      temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE!),
    })

    onProgress(80)

    const generatedContent = completion.choices[0]?.message?.content || ''

    // Log finish reason to check if response was truncated
    const finishReason = completion.choices[0]?.finish_reason
    console.log('📍 Finish reason:', finishReason)
    if (finishReason === 'length') {
      console.warn('⚠️ Response was truncated due to max_tokens limit!')
    }

    console.log('✅ AI response length:', generatedContent.length)

    const project = createProjectFromAIResponse(generatedContent)

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
    const { prompt, model, conversationId, existingContent, isModification, originalCode } = await request.json()
    console.log('📝 请求参数:', { prompt: prompt.substring(0, 50) + '...', model, conversationId, isModification })

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
    }

    // 存储到队列(用于本地开发)
    taskQueue.set(taskId, task)
    console.log(`✅ 任务已存储到全局队列: ${taskId}, 队列大小: ${taskQueue.size}`)

    // 同时保存到数据库(用于 Vercel)
    await saveTaskToDB(task)

    console.log(`✅ 任务创建完成，准备启动异步处理: ${taskId}`)

    // 异步执行任务（不等待，避免阻塞API响应）
    // 使用 Promise.fire-and-forget 模式
    ;(async () => {
      try {
        console.log(`🚀 [ASYNC] 异步任务已启动: ${taskId}`)
        await processAsyncTask(task, existingContent, isModification)
        console.log(`✅ [ASYNC] 异步任务完成: ${taskId}`)
      } catch (error) {
        console.error(`❌ [ASYNC] 异步任务处理失败 [${taskId}]:`, error)
      }
    })()

    console.log(`📤 [API] 立即返回响应，不等待异步任务: ${taskId}`)

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

        // 广播进度更新
        broadcastTaskUpdate(task.taskId, {
          type: 'progress_update',
          progress: task.progress,
          message: `生成进度: ${Math.round(task.progress)}%`
        })
      }
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
