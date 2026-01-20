import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { requireAuth } from '@/lib/auth/auth'
import { add, getDatabaseProvider } from '@/lib/database'

// Vercel Serverless Function 超时配置 (秒)
// 免费版最大 10 秒，Pro 版最大 60 秒
export const maxDuration = 60

function validateGeneratedCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查1: return 语句后不能跟声明
  if (/return\s*\(\s*\n\s*(const|let|var|function)\s+\w+/.test(code)) {
    errors.push('Invalid return statement followed by declarations')
  }

  // 检查2: 常见未定义变量
  const commonVars = ['right', 'left', 'top', 'bottom', 'width', 'height']
  for (const varName of commonVars) {
    const regex = new RegExp(`\\b${varName}\\b`, 'g')
    const matches = code.match(regex)
    if (matches && matches.length > 0) {
      const declarePattern = new RegExp(`(const|let|var)\\s+${varName}\\s*=`, 'g')
      const declarations = code.match(declarePattern)
      if (!declarations || declarations.length < matches.length) {
        errors.push(`Potentially undefined variable: ${varName}`)
      }
    }
  }

  // 检查3: 未定义的组件
  const jsxComponents = code.match(/<([A-Z][a-zA-Z0-9]*)/g) || []
  const componentNames = [...new Set(jsxComponents.map(tag => tag.slice(1)))]
  for (const compName of componentNames) {
    const definePattern = new RegExp(`(function\\s+${compName}\\b|const\\s+${compName}\\s*=|class\\s+${compName}\\b)`)
    if (!definePattern.test(code)) {
      errors.push(`Undefined component: ${compName}`)
    }
  }

  // 检查4: 自定义 hooks
  const customHooks = ['useChartData', 'useWebSocket', 'useData', 'useFetch', 'useApi']
  for (const hook of customHooks) {
    if (code.includes(hook)) {
      errors.push(`Custom hook not allowed: ${hook}`)
    }
  }

  // 检查5: 不完整的三元表达式
  if (/\?\s*[^:]+\s*[,})\]]/.test(code)) {
    errors.push('Incomplete ternary expression missing : value')
  }

  return { valid: errors.length === 0, errors }
}

function formatCodeString(code: string): string {
  // Quick check: if code already has good formatting, return as-is
  const lineCount = (code.match(/\n/g) || []).length
  if (lineCount > 5) {
    return code
  }

  // For minified code, do basic formatting
  if (code.length > 100 && lineCount < 3) {
    console.log('Formatting minified code')

    // Simple and fast formatting - just add newlines at key points
    let formatted = code
      // Add newlines after semicolons (simple version)
      .replace(/;/g, ';\n')
      // Add newlines around braces
      .replace(/{/g, '{\n')
      .replace(/}/g, '\n}')
      // Clean up excessive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Basic indentation
      .split('\n')
      .map((line, index, arr) => {
        const trimmed = line.trim()
        if (!trimmed) return ''

        // Simple indentation based on brace counting
        let indent = 0
        for (let i = 0; i < index; i++) {
          const prevLine = arr[i].trim()
          if (prevLine.endsWith('{')) indent++
          if (prevLine.startsWith('}')) indent--
        }

        return '  '.repeat(Math.max(0, indent)) + trimmed
      })
      .join('\n')

    return formatted
  }

  return code
}

// 验证生成的 JSON 结构
function validateGeneratedJson(jsonContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    const parsed = JSON.parse(jsonContent)

    // 检查必需的字段
    if (!parsed.files || typeof parsed.files !== 'object') {
      errors.push('Missing or invalid "files" field')
    }

    if (!parsed.projectName || typeof parsed.projectName !== 'string') {
      errors.push('Missing or invalid "projectName" field')
    }

    // 检查是否有 App.tsx 或 App.jsx
    if (parsed.files && !parsed.files['src/App.tsx'] && !parsed.files['App.tsx'] && !parsed.files['src/App.jsx'] && !parsed.files['App.jsx']) {
      errors.push('Missing App.tsx/App.jsx file')
    }

    // 检查是否有 README.md
    if (parsed.files && !parsed.files['README.md']) {
      errors.push('Missing README.md file')
    }

    // 检查 App 代码质量
    const appCode = parsed.files['src/App.tsx'] || parsed.files['App.tsx'] || parsed.files['src/App.jsx'] || parsed.files['App.jsx'] || ''
    if (appCode) {
      // 使用代码验证函数
      const codeValidation = validateGeneratedCode(appCode)
      if (!codeValidation.valid) {
        errors.push(...codeValidation.errors.map(e => `App code: ${e}`))
      }

      // 检查是否有基本的 React 结构
      if (!appCode.includes('export default') && !appCode.includes('export default App')) {
        errors.push('App.tsx missing "export default" statement')
      }

      // 检查是否有 function 或 const 组件定义
      if (!/function\s+\w+|const\s+\w+\s*=/.test(appCode)) {
        errors.push('App.tsx missing component definition')
      }
    }

  } catch (parseError: any) {
    errors.push(`Invalid JSON: ${parseError.message}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

async function generateCodeWithRetry(prompt: string, model: string = 'qwen-plus', maxRetries: number = 2) {
  // 导入模型配置和提示词
  const { AVAILABLE_MODELS } = await import('@/lib/subscription-tiers')
  const { CODE_GENERATION_SYSTEM_PROMPT } = await import('@/lib/ai-prompts')
  const modelConfig = AVAILABLE_MODELS[model]

  if (!modelConfig) {
    throw new Error(`Unsupported model: ${model}`)
  }

  // 根据 provider 选择 API 配置
  let apiKey: string | undefined
  let baseUrl: string | undefined

  switch (modelConfig.provider) {
    case 'dashscope':
      apiKey = process.env.DASHSCOPE_API_KEY
      baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
      break
    case 'deepseek':
      apiKey = process.env.DEEPSEEK_API_KEY
      baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
      break
    case 'zhipu':
      apiKey = process.env.GLM_API_KEY
      baseUrl = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/'
      break
    default:
      throw new Error(`Unsupported provider: ${modelConfig.provider}`)
  }

  if (!apiKey || apiKey.includes('your-') || apiKey.includes('your_')) {
    throw new Error(`${modelConfig.provider} API key is not configured. Please set the API key in your environment variables.`)
  }

  // Initialize OpenAI client with provider configuration
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to generate code`)

      // 使用统一的系统提示词
      let systemPrompt = CODE_GENERATION_SYSTEM_PROMPT + `

Return JSON format:
{"files":{"src/App.jsx":"...","src/index.css":"...","package.json":"...","README.md":"..."},"projectName":"my-app"}`

      // 如果是重试，添加错误提示
      if (attempt > 1) {
        systemPrompt += `

⚠️ PREVIOUS RESPONSE ERROR. Fix:
1. Valid JSON with "files" and "projectName"
2. App.jsx: proper function, hooks before return
3. Include export default App
4. README.md is required`
      }

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt.trim()
          }
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: 0.7,
      })

      const generatedContent = completion.choices[0]?.message?.content

      if (!generatedContent) {
        throw new Error('Empty response from AI service')
      }

      // 验证生成的 JSON
      const validation = validateGeneratedJson(generatedContent)

      if (!validation.valid && attempt < maxRetries) {
        console.warn(`⚠️ Generated JSON has errors, retrying (${attempt + 1}/${maxRetries}):`, validation.errors)
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }

      if (!validation.valid) {
        console.error('❌ Generated JSON still has errors after retries:', validation.errors)
        // 继续返回，让前端处理错误
      }

      console.log('✅ AI response length:', generatedContent.length)

      // Log finish reason to check if response was truncated
      const finishReason = completion.choices[0]?.finish_reason
      console.log('📍 Finish reason:', finishReason)
      if (finishReason === 'length') {
        console.warn('⚠️ Response was truncated due to max_tokens limit!')
      }

      // Log a preview of the response
      console.log('🔍 Response preview (first 500 chars):', generatedContent.substring(0, 500).replace(/\n/g, '\\n'))

      return generatedContent

    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message)

      if (attempt === maxRetries) {
        throw error
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  throw new Error('Failed to generate code after all retries')
}

export async function POST(request: Request) {
  const startTime = performance.now()
  console.log('🚀 Starting code generation request')

  try {
    // 认证用户
    const authResult = await requireAuth(request as NextRequest)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user

    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log('📝 Prompt received, calling AI...')
    const aiStartTime = performance.now()
    const generatedContent = await generateCodeWithRetry(prompt.trim())
    const aiEndTime = performance.now()
    console.log(`🤖 AI generation completed in ${(aiEndTime - aiStartTime).toFixed(2)}ms`)

    if (!generatedContent) {
      throw new Error('No content generated from AI')
    }

    // Process the AI response
    console.log('🔧 Starting response processing...')
    const processStartTime = performance.now()

    let parsedResponse

    try {
      // Try to extract JSON from markdown code blocks first
      let jsonContent = generatedContent.trim()

      // Check if response contains markdown code blocks
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/
      const match = generatedContent.match(codeBlockRegex)
      if (match) {
        jsonContent = match[1].trim()
        console.log('Extracted JSON from code block')
      }

      // Clean up any extra text before or after JSON
      // Look for JSON object boundaries
      const jsonStart = jsonContent.indexOf('{')
      let jsonEnd = jsonContent.lastIndexOf('}')

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1)
        console.log('Cleaned JSON content')
      } else if (jsonStart !== -1) {
        // JSON is incomplete, extract content safely instead of blindly fixing
        jsonContent = jsonContent.substring(jsonStart)
        console.warn('⚠️ Response appears truncated, using safe extraction')

        // Use safe extraction similar to async API
        try {
          // Try to parse what we have first
          parsedResponse = JSON.parse(jsonContent)
          console.log('✅ Managed to parse partial JSON')
        } catch (parseError) {
          // If that fails, extract files manually using regex
          console.log('📦 Extracting files using regex patterns...')

          const files: Record<string, string> = {}

          // Extract App.jsx or App.tsx
          const appMatch = jsonContent.match(/"src\/App\.(?:jsx|tsx)"\s*:\s*"((?:[^"\\]|\\[\s\S])*?)"/s)
          if (appMatch) {
            let appCode = appMatch[1]
            appCode = appCode.replace(/\\n/g, '\n').replace(/\\t/g, '  ').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            files['src/App.jsx'] = appCode.trim()
            console.log('✅ Extracted src/App.jsx')
          } else {
            console.warn('⚠️ Failed to extract App.jsx with regex')
          }

          // Extract index.css
          const cssMatch = jsonContent.match(/"src\/index\.css"\s*:\s*"((?:[^"\\]|\\.)*)/s)
          if (cssMatch) {
            let cssCode = cssMatch[1]
            cssCode = cssCode.replace(/\\n/g, '\n').replace(/\\"/g, '"')
            files['src/index.css'] = cssCode.trim()
            console.log('✅ Extracted src/index.css')
          }

          // Extract README.md
          const readmeMatch = jsonContent.match(/"README\.md"\s*:\s*"((?:[^"\\]|\\.)*)/s)
          if (readmeMatch) {
            let readmeCode = readmeMatch[1]
            readmeCode = readmeCode.replace(/\\n/g, '\n').replace(/\\"/g, '"')
            files['README.md'] = readmeCode.trim()
            console.log('✅ Extracted README.md')
          }

          // Extract package.json
          const pkgMatch = jsonContent.match(/"package\.json"\s*:\s*(\{(?:[^"\\]|\\.)*?\})/s)
          if (pkgMatch) {
            try {
              const pkgJson = JSON.parse(pkgMatch[1].replace(/\\"/g, '"'))
              files['package.json'] = JSON.stringify(pkgJson, null, 2)
              console.log('✅ Extracted package.json')
            } catch (e) {
              files['package.json'] = JSON.stringify({
                "name": "generated-app",
                "version": "0.1.0",
                "dependencies": {
                  "react": "^18.2.0",
                  "react-dom": "^18.2.0"
                }
              }, null, 2)
            }
          }

          // Create a valid response
          parsedResponse = {
            files,
            projectName: 'generated-app'
          }

          // Skip the JSON.parse loop below
          const fileNames = Object.keys(files)
          console.log(`📁 Extracted ${fileNames.length} files:`, fileNames.join(', '))
        }
      }

      // Only try JSON.parse if we haven't already parsed it via safe extraction
      if (!parsedResponse) {
        // Try to parse the response as JSON with multiple attempts
        console.log('📄 Attempting JSON parse...')
        const jsonParseStartTime = performance.now()
        let parseAttempt = 1
        const maxParseAttempts = 3

        while (parseAttempt <= maxParseAttempts) {
          try {
          console.log(`JSON parse attempt ${parseAttempt}/${maxParseAttempts}`)
          parsedResponse = JSON.parse(jsonContent)
          const jsonParseEndTime = performance.now()
          console.log(`✅ JSON parsed successfully in ${(jsonParseEndTime - jsonParseStartTime).toFixed(2)}ms`)

          // Log generated files
          const fileNames = Object.keys(parsedResponse.files || {})
          console.log(`📁 Generated ${fileNames.length} files:`, fileNames.join(', '))
          if (fileNames.length > 0) {
            console.log('📋 File details:', fileNames.map(name => ({
              name,
              size: parsedResponse.files[name].length,
              preview: parsedResponse.files[name].substring(0, 100).replace(/\n/g, '\\n')
            })))
          }

          // Check if README.md is missing
          if (!parsedResponse.files['README.md']) {
            console.warn('⚠️ README.md is missing from generated files!')
          }

          break
        } catch (parseError: any) {
          console.log(`JSON parse attempt ${parseAttempt} failed:`, parseError.message)

          if (parseAttempt === maxParseAttempts) {
            throw parseError
          }

          // Try to fix common JSON issues
          if (parseError.message.includes('Unterminated string')) {
            // Try to find and fix unterminated strings
            const lines = jsonContent.split('\n')
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim()
              if (line.startsWith('"') && !line.endsWith('"') && !line.endsWith(',')) {
                // This line has an unterminated string, try to close it
                lines[i] = line + '"'
                console.log(`Fixed unterminated string on line ${i + 1}`)
                break
              }
            }
            jsonContent = lines.join('\n')
          } else if (parseError.message.includes('Unexpected token')) {
            // Try to remove trailing content that might be causing issues
            const lastValidBrace = jsonContent.lastIndexOf('}')
            if (lastValidBrace !== -1) {
              jsonContent = jsonContent.substring(0, lastValidBrace + 1)
              console.log('Trimmed JSON to last valid closing brace')
            }
          }

          parseAttempt++
        }
      }
      } // End of if (!parsedResponse)

      // Ensure code formatting is preserved
      const appKey = parsedResponse.files['src/App.jsx'] ? 'src/App.jsx' :
                     parsedResponse.files['src/App.tsx'] ? 'src/App.tsx' : null
      if (parsedResponse.files && appKey) {
        const originalCode = parsedResponse.files[appKey]
        console.log('Normal parse - Original code preview (first 200 chars):', originalCode.substring(0, 200).replace(/\n/g, '\\n'))
        console.log('Normal parse - Original code contains newlines:', originalCode.includes('\n'))
        console.log('Normal parse - Original code length:', originalCode.length)

        const formatStartTime = performance.now()
        const formattedCode = formatCodeString(originalCode)
        const formatEndTime = performance.now()

        console.log('Normal parse - Formatted code preview (first 200 chars):', formattedCode.substring(0, 200).replace(/\n/g, '\\n'))
        console.log('Normal parse - Formatted code contains newlines:', formattedCode.includes('\n'))
        console.log('Normal parse - Formatted code length:', formattedCode.length)
        console.log(`🎨 Code formatting completed in ${(formatEndTime - formatStartTime).toFixed(2)}ms`)

        parsedResponse.files[appKey] = formattedCode
      }

    } catch (jsonError: any) {
      // If JSON parsing fails, try to extract partial data
      console.warn('JSON parse failed, attempting partial extraction:', jsonError.message)

      // Try to extract at least the App.tsx code
      console.log('Starting App.tsx extraction from content')

      let extractedCode = generatedContent

      // Try to find React component code in various formats
      const codePatterns = [
        /```(?:jsx?|typescript|js|react)?\s*([\s\S]*?)```/, // Markdown code blocks
        /(?:function|const)\s+App[\s\S]*?(?=```|$)/, // Function declarations
      ]

      console.log('Searching for code patterns in response...')

      for (const [index, pattern] of codePatterns.entries()) {
        const match = generatedContent?.match(pattern)
        if (match && match[1] && match[1].length > 100) {
          const candidateCode = match[1].trim()
          console.log(`Pattern ${index} matched, code length: ${candidateCode.length}`)
          console.log(`Pattern ${index} preview: ${candidateCode.substring(0, 200)}`)

          // Check if this looks like React component code
          const hasReactImports = /import.*react/i.test(candidateCode)
          const hasComponentDeclaration = /(?:function|const)\s+\w+/.test(candidateCode)
          const hasJsx = /<[^>]+>/.test(candidateCode)

          console.log(`Pattern ${index} validation: React imports: ${hasReactImports}, Component: ${hasComponentDeclaration}, JSX: ${hasJsx}`)

          if (hasReactImports || hasComponentDeclaration || hasJsx) {
            extractedCode = candidateCode
            console.log(`Selected pattern ${index} as it appears to be React code`)
            break
          } else {
            console.log(`Pattern ${index} does not appear to be React code, continuing search`)
          }
        }
      }

      // If no code block found, try to clean up the raw response
      if (extractedCode === generatedContent && generatedContent) {
        // Remove markdown formatting and explanations
        extractedCode = generatedContent
          .replace(/^#+\s*.*$/gm, '') // Remove headers
          .replace(/^\*\*.*?\*\*$/gm, '') // Remove bold text
          .replace(/^[-*_]{3,}$/gm, '') // Remove separators
          .replace(/^>\s*.*$/gm, '') // Remove blockquotes
          .trim()

        // Try to find the actual code part
        const lines = extractedCode.split('\n')
        const codeStart = lines.findIndex(line =>
          line.includes('import') ||
          line.includes('function') ||
          line.includes('const') ||
          line.includes('export')
        )

        if (codeStart !== -1) {
          extractedCode = lines.slice(codeStart).join('\n').trim() || extractedCode
        }
      }

      // Apply formatting to extracted code
      console.log('Before formatting - code preview (first 200 chars):', extractedCode.substring(0, 200))
      console.log('Before formatting - code length:', extractedCode.length)
      extractedCode = formatCodeString(extractedCode)
      console.log('After formatting - code preview (first 200 chars):', extractedCode.substring(0, 200))
      console.log('After formatting - code length:', extractedCode.length)

      // Ensure we have at least a basic component
      if (!extractedCode || extractedCode.length < 50) {
        console.warn('Code extraction failed, using minimal fallback component')
        extractedCode = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generated App</h1>
        <p className="text-gray-600 mb-4">
          The AI generated some content, but the code structure was incomplete.
          This is a fallback component to ensure the app runs.
        </p>
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> The original generation may have been truncated.
            Try simplifying your request or try again.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;`
      }

      parsedResponse = {
        files: {
          'src/App.jsx': extractedCode,
          'src/index.css': `body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

code {
  font-family: 'Monaco', 'Menlo', monospace;
}`,
          'package.json': JSON.stringify({
            "name": "generated-app",
            "version": "0.1.0",
            "dependencies": {
              "react": "^18.2.0",
              "react-dom": "^18.2.0",
              "react-scripts": "5.0.1"
            }
          }, null, 2)
        },
        projectName: 'fallback-app'
      }
    }

    // Validate the parsed response
    const appFile = parsedResponse.files['src/App.jsx'] || parsedResponse.files['src/App.tsx']
    if (!parsedResponse.files || !appFile) {
      throw new Error('Invalid response structure: missing files or App.jsx')
    }

    // Check for incomplete code
    const appCode = appFile
    const isObviouslyIncomplete = /\.\.\.(?:\s*$|\s*\/\/)/.test(appCode) ||
                                 /more code\s*$/i.test(appCode) ||
                                 /rest of\s*$/i.test(appCode)

    if (isObviouslyIncomplete) {
      console.warn('AI generated obviously incomplete code')
      throw new Error('Generated code appears incomplete')
    }

    // Check for basic React component structure (more flexible)
    const hasComponentDeclaration = /(?:function \w+|const \w+\s*=|export.*function \w+)/.test(appCode)
    const hasReturnStatement = /return\s*\(/.test(appCode)
    const hasClosingBrace = /}\s*$/.test(appCode.trim())

    // Also check for arrow function components
    const hasArrowFunction = /(?:const|let|var)\s+\w+\s*=\s*\(/.test(appCode)
    const hasJsxReturn = /return\s*\(?\s*<[^>]+>/.test(appCode)

    // Be more lenient - accept any component-like structure
    const isValidComponent = (hasComponentDeclaration && hasReturnStatement) ||
                           (hasArrowFunction && hasJsxReturn) ||
                           (hasReturnStatement && hasClosingBrace)

    console.log('Code validation results:')
    console.log('- Has component declaration:', hasComponentDeclaration)
    console.log('- Has return statement:', hasReturnStatement)
    console.log('- Has closing brace:', hasClosingBrace)
    console.log('- Has arrow function:', hasArrowFunction)
    console.log('- Has JSX return:', hasJsxReturn)
    console.log('- Is valid component:', isValidComponent)
    console.log('Code preview (first 300 chars):', appCode.substring(0, 300))
    console.log('Code preview (last 300 chars):', appCode.substring(Math.max(0, appCode.length - 300)))

    if (!isValidComponent) {
      console.warn('Generated code missing basic component structure')
      console.warn('This might be acceptable for simple code, continuing...')
      // Don't throw error, just warn and continue
    }

    const processEndTime = performance.now()
    console.log(`🔧 Total processing time: ${(processEndTime - processStartTime).toFixed(2)}ms`)

    const totalTime = performance.now()
    console.log(`✅ Total request time: ${(totalTime - startTime).toFixed(2)}ms`)

    // 保存生成的项目到数据库(根据环境变量选择)
    try {
      const provider = getDatabaseProvider()
      console.log(`💾 Saving generated project to ${provider}...`)

      // 创建对话记录
      const conversationData = {
        user_id: user.id,
        title: `Generated Project: ${parsedResponse.projectName || 'Unnamed Project'}`,
        type: 'generation',
        prompt: prompt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      let conversationResult
      // 根据数据库提供商动态选择
      conversationResult = await add('conversations', conversationData)

      const conversationId = conversationResult.id
      console.log('📝 Conversation created with ID:', conversationId)

      // 保存生成的文件
      const filePromises = Object.entries(parsedResponse.files).map(async ([filePath, fileContent]) => {
        const fileData = {
          conversation_id: conversationId,
          user_id: user.id,  // 添加 user_id 确保能读取到文件
          file_path: filePath,
          file_content: fileContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // 保存文件到数据库(根据提供商自动选择)
        return await add('conversation_files', fileData)
      })

      await Promise.all(filePromises)
      console.log(`📁 All files saved to ${provider}`)

      // 更新响应，包含对话ID
      parsedResponse.conversationId = conversationId

    } catch (saveError: any) {
      console.error('❌ Failed to save project to database:', saveError)
      console.error('错误详情:', saveError.message)

      // 根据数据库类型提供不同的错误信息
      const provider = getDatabaseProvider()

      if (provider === 'cloudbase') {
        // CloudBase 错误处理
        if (saveError.message && (saveError.message.includes('DATABASE_COLLECTION_NOT_EXIST') || saveError.message.includes('Db or Table not exist'))) {
          console.error('🔍 解决方案：请在CloudBase控制台创建 conversation_files 集合')
          console.error('   1. 访问 https://console.cloud.tencent.com/tcb')
          console.error('   2. 选择你的环境')
          console.error('   3. 点击"数据库"')
          console.error('   4. 创建集合: conversation_files')
          console.error('   5. 设置读取和写入权限为 true')
        }
      } else if (provider === 'supabase') {
        // Supabase 错误处理
        if (saveError.message && saveError.message.includes('relation') && saveError.message.includes('does not exist')) {
          console.error('🔍 解决方案：请在Supabase控制台创建 conversations 和 conversation_files 表')
          console.error('   1. 访问 https://app.supabase.com')
          console.error('   2. 选择你的项目')
          console.error('   3. 点击"SQL Editor"')
          console.error('   4. 执行以下SQL创建表:')
          console.error(`
-- 创建 conversations 表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid() NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'generation',
  prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 conversation_files 表
CREATE TABLE IF NOT EXISTS conversation_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid() NOT NULL,
  file_path TEXT NOT NULL,
  file_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_files ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own files" ON conversation_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files" ON conversation_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);
          `)
        }
      }

      // 不阻止返回响应，但记录错误
      parsedResponse.saveError = saveError.message
    }

    // Return successful response
    const previewKey = parsedResponse.files?.['src/App.jsx'] ? 'src/App.jsx' : 'src/App.tsx'
    console.log('Sending response with App preview:', parsedResponse.files?.[previewKey]?.substring(0, 200).replace(/\n/g, '\\n'))
    console.log('Response App contains newlines:', parsedResponse.files?.[previewKey]?.includes('\n'))

    return NextResponse.json({
      success: true,
      project: parsedResponse
    })

  } catch (error: any) {
    console.error('Error generating code:', error)
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}