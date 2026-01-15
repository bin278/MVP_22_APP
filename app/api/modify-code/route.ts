import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Vercel Serverless Function 超时配置 (秒)
export const maxDuration = 60

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

    // 获取模型配置
    const { AVAILABLE_MODELS, getDefaultModel } = await import('@/lib/subscription-tiers')
    const modelId = getDefaultModel(user.subscription_tier)
    const modelConfig = AVAILABLE_MODELS[modelId]

    if (!modelConfig) {
      return NextResponse.json(
        { error: `Unsupported model: ${modelId}` },
        { status: 500 }
      )
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
        return NextResponse.json(
          { error: `Unsupported provider: ${modelConfig.provider}` },
          { status: 500 }
        )
    }

    if (!apiKey || apiKey.includes('your_') || apiKey.includes('your-')) {
      return NextResponse.json(
        { error: `${modelConfig.provider} API key is not configured` },
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
        model: modelId,
        messages: [
          {
            role: 'system',
            content: `You are a code modification assistant. Modify the given React/JavaScript code according to the user's instruction. Return ONLY the modified code, no explanations, no markdown, no JSON structure.

Requirements:
1. Keep the same code structure and formatting style
2. Only modify what the user asks for
3. Ensure the code remains functional
4. Use proper indentation (2 spaces)
5. Return the complete modified code
6. Use pure JavaScript/JSX only, NO TypeScript
7. NO type annotations (no : string, : number, : React.FC, etc.)

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
        max_tokens: modelConfig.maxTokens,
        temperature: 0.7, // 中等随机性
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




















