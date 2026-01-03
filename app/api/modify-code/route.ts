import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { code, instruction } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
      return NextResponse.json(
        { error: 'Instruction is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

    if (!apiKey || apiKey === 'your_actual_api_key_here') {
      return NextResponse.json(
        { error: 'DeepSeek API key is not configured' },
        { status: 500 }
      )
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    })

    console.log('🔄 开始同步AI代码修改...')

    console.log('🔧 开始AI代码修改，让AI完全修改完毕...')

    try {
      // 直接调用AI，不设置主动超时，让CloudBase平台自然处理60秒超时
      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a code modification assistant. Modify the given React/TypeScript code according to the user's instruction. Return ONLY the modified code, no explanations, no markdown, no JSON structure.

Requirements:
1. Keep the same code structure and formatting style
2. Only modify what the user asks for
3. Ensure the code remains functional
4. Use proper indentation (2 spaces)
5. Return the complete modified code
6. Take your time to make comprehensive modifications

Example:
User code: "function App() { return <div>Hello</div>; }"
Instruction: "Add a button"
Response: "function App() { return <div><div>Hello</div><button>Click me</button></div>; }"`
          },
          {
            role: 'user',
            content: `Current code:\n\`\`\`typescript\n${code}\n\`\`\`\n\nInstruction: ${instruction}\n\nReturn only the modified code:`
          }
        ],
        max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '3000'), // 增加token限制
        temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.5'), // 中等随机性
      })

      console.log('✅ 同步代码修改完成')

      // 获取完整响应
      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content generated from AI')
      }

      // Clean up the modified code
      let modifiedCode = content.trim()

      // Remove markdown code blocks if present
      const codeBlockRegex = /```(?:typescript|tsx|jsx|js|ts)?\s*([\s\S]*?)```/
      const match = modifiedCode.match(codeBlockRegex)
      if (match) {
        modifiedCode = match[1].trim()
      }

      return NextResponse.json({
        code: 0,
        msg: '代码修改成功',
        data: {
          code: modifiedCode,
          codeLength: modifiedCode.length
        }
      })

    } catch (error: any) {
      console.error('❌ 同步代码修改失败:', error)

      // 如果是网络超时或其他错误，给出相应提示
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return NextResponse.json({
          code: -1,
          msg: '网络请求超时，请稍后重试',
          error: '网络超时'
        }, { status: 500 })
      }

      return NextResponse.json({
        code: -1,
        msg: '代码修改失败',
        error: error.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error starting code modification:', error)
    return NextResponse.json(
      { code: -1, msg: '请求处理失败', error: error.message },
      { status: 500 }
    )
  }
}




















