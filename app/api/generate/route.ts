import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { requireAuth } from '@/lib/auth/auth'
import { add } from '@/lib/database/cloudbase'

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

async function generateCodeWithRetry(prompt: string, maxRetries: number = 1) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    throw new Error('DeepSeek API key is not configured. Please set DEEPSEEK_API_KEY in your environment variables. Get your API key from https://platform.deepseek.com/')
  }

  // Initialize OpenAI client with DeepSeek configuration
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to generate code`)

      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: `Generate a complete, well-formatted React component. IMPORTANT:

1. Use proper code formatting with consistent indentation (2 spaces)
2. Include all necessary React imports
3. Create a functional component with proper JSX structure
4. Use Tailwind CSS classes for styling
5. Ensure the code is immediately runnable

Return ONLY this JSON structure:
{
  "files": {
    "src/App.tsx": "import React from 'react';\n\nfunction App() {\n  return (\n    <div className=\\"p-4\\">\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;",
    "src/index.css": "body { margin: 0; font-family: system-ui, sans-serif; }",
    "package.json": "{\\"name\\": \\"app\\", \\"version\\": \\"1.0.0\\"}"
  },
  "projectName": "my-app"
}

Make sure the App.tsx code is properly formatted with newlines and indentation!`
          },
          {
            role: 'user',
            content: prompt.trim()
          }
        ],
        max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
      })

      const generatedContent = completion.choices[0]?.message?.content

      if (!generatedContent) {
        throw new Error('Empty response from AI service')
      }

      console.log('AI response length:', generatedContent.length)
      return generatedContent

    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error.message)

      if (attempt === maxRetries) {
        throw error
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
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
        // If JSON is incomplete, try to fix it
        jsonContent = jsonContent.substring(jsonStart)
        console.log('Attempting to fix incomplete JSON, original length:', jsonContent.length)

        // More aggressive JSON fixing
        let fixedJson = jsonContent

        // Count braces and brackets
        const openBraces = (fixedJson.match(/\{/g) || []).length
        const closeBraces = (fixedJson.match(/\}/g) || []).length
        const openBrackets = (fixedJson.match(/\[/g) || []).length
        const closeBrackets = (fixedJson.match(/\]/g) || []).length

        // Count quotes (simple approach - assume even number means balanced)
        const quotes = (fixedJson.match(/"/g) || []).length

        // Fix unbalanced structures
        if (closeBraces < openBraces) {
          const missingBraces = openBraces - closeBraces
          fixedJson += '}'.repeat(missingBraces)
          console.log(`Added ${missingBraces} missing closing braces`)
        }
        if (closeBrackets < openBrackets) {
          const missingBrackets = openBrackets - closeBrackets
          fixedJson += ']'.repeat(missingBrackets)
          console.log(`Added ${missingBrackets} missing closing brackets`)
        }
        if (quotes % 2 !== 0) {
          fixedJson += '"'
          console.log('Added missing closing quote')
        }

        // Try to find and fix the last incomplete string
        const lastStringMatch = fixedJson.match(/"([^"]*)$/m)
        if (lastStringMatch && !lastStringMatch[1].endsWith('"')) {
          // Find the last quote and add closing quote
          const lastQuoteIndex = fixedJson.lastIndexOf('"')
          if (lastQuoteIndex !== -1) {
            const afterLastQuote = fixedJson.substring(lastQuoteIndex + 1)
            // If there's content after the last quote without another quote, this might be incomplete
            if (afterLastQuote.includes(',') || afterLastQuote.includes('}')) {
              // Try to close the string properly
              fixedJson = fixedJson.substring(0, lastQuoteIndex + 1) + afterLastQuote
            }
          }
        }

        jsonContent = fixedJson
        console.log('JSON fixing completed, new length:', jsonContent.length)
      }

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

      // Ensure code formatting is preserved
      if (parsedResponse.files && parsedResponse.files['src/App.tsx']) {
        const originalCode = parsedResponse.files['src/App.tsx']
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

        parsedResponse.files['src/App.tsx'] = formattedCode
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
          'src/App.tsx': extractedCode,
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
    if (!parsedResponse.files || !parsedResponse.files['src/App.tsx']) {
      throw new Error('Invalid response structure: missing files or App.tsx')
    }

    // Check for incomplete code
    const appCode = parsedResponse.files['src/App.tsx']
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

    // 保存生成的项目到CloudBase数据库
    try {
      console.log('💾 Saving generated project to CloudBase...')

      // 创建对话记录
      const conversationData = {
        user_id: user.id,
        title: `Generated Project: ${parsedResponse.projectName || 'Unnamed Project'}`,
        type: 'generation',
        prompt: prompt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const conversationResult = await add('conversations', conversationData)
      const conversationId = conversationResult.id

      console.log('📝 Conversation created with ID:', conversationId)

      // 保存生成的文件
      const filePromises = Object.entries(parsedResponse.files).map(async ([filePath, fileContent]) => {
        const fileData = {
          conversation_id: conversationId,
          file_path: filePath,
          file_content: fileContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return await add('conversation_files', fileData)
      })

      await Promise.all(filePromises)
      console.log('📁 All files saved to CloudBase')

      // 更新响应，包含对话ID
      parsedResponse.conversationId = conversationId

    } catch (saveError: any) {
      console.error('❌ Failed to save project to CloudBase:', saveError)
      console.error('错误详情:', saveError.message)

      // 如果是集合不存在的错误，尝试提供更详细的错误信息
      if (saveError.message && (saveError.message.includes('DATABASE_COLLECTION_NOT_EXIST') || saveError.message.includes('Db or Table not exist'))) {
        console.error('🔍 解决方案：请在CloudBase控制台创建 conversation_files 集合')
        console.error('   1. 访问 https://console.cloud.tencent.com/tcb')
        console.error('   2. 选择你的环境')
        console.error('   3. 点击"数据库"')
        console.error('   4. 创建集合: conversation_files')
        console.error('   5. 设置读取和写入权限为 true')
      }

      // 不阻止返回响应，但记录错误
      parsedResponse.saveError = saveError.message
    }

    // Return successful response
    console.log('Sending response with App.tsx preview:', parsedResponse.files?.['src/App.tsx']?.substring(0, 200).replace(/\n/g, '\\n'))
    console.log('Response App.tsx contains newlines:', parsedResponse.files?.['src/App.tsx']?.includes('\n'))

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