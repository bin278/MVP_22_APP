import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { getDatabase } from '@/lib/database/cloudbase'

interface JWTPayload {
  userId?: string
  openid?: string  // 兼容旧格式
  exp: number
}

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: -1, msg: '未授权访问' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

    // 验证JWT并解析openid
    let decoded: JWTPayload
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
      console.log('JWT验证成功:', decoded)
    } catch (err) {
      console.error('JWT验证失败:', err.message)
      return NextResponse.json(
        { code: -1, msg: 'Token无效' },
        { status: 401 }
      )
    }

    // 支持userId和openid两种格式（向后兼容）
    const openid = decoded.userId || decoded.openid
    if (!openid) {
      return NextResponse.json(
        { code: -1, msg: 'Token缺少用户标识' },
        { status: 401 }
      )
    }
    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { code: -1, msg: 'prompt参数无效' },
        { status: 400 }
      )
    }

    // 生成唯一TaskID
    const taskId = randomUUID()

    // 将任务保存到数据库，准备异步处理
    try {
      console.log('💾 保存代码生成任务到数据库...')

      const db = await getDatabase()
      await db.collection('code_generation_tasks').add({
        taskId,
        openid,
        prompt: prompt.trim(),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      console.log('✅ 任务保存成功，准备异步处理')

      // 使用 waitUntil 在响应后继续执行后台任务
      waitUntil(
        (async () => {
          try {
            console.log('🤖 开始异步AI代码生成...')
            const generatedCode = await generateCodeWithAI(prompt.trim())

            await db.collection('code_generation_tasks').where({
              taskId
            }).update({
              status: 'completed',
              code: generatedCode,
              codeLength: generatedCode.length,
              completedAt: new Date(),
              updatedAt: new Date()
            })

            console.log('✅ 异步代码生成完成')
          } catch (error: any) {
            console.error('❌ 异步代码生成失败:', error)

            await db.collection('code_generation_tasks').where({
              taskId
            }).update({
              status: 'failed',
              error: error.message,
              updatedAt: new Date()
            })
          }
        })()
      )

      return NextResponse.json({
        code: 0,
        msg: '任务创建成功，代码生成中...',
        data: {
          taskId,
          status: 'processing'
        }
      })

    } catch (error: any) {
      console.error('❌ 代码生成失败:', error)

      return NextResponse.json({
        code: -1,
        msg: '代码生成失败',
        error: error.message
      }, { status: 500 })
    }

  } catch (err: any) {
    console.error('创建任务失败:', err)
    return NextResponse.json(
      { code: -1, msg: '创建任务失败', error: err.message },
      { status: 500 }
    )
  }
}

// AI代码生成函数（复用现有的AI调用逻辑）
async function generateCodeWithAI(prompt: string): Promise<string> {
  const model = 'deepseek-chat' // 默认使用deepseek

  // 获取API配置（复用generate-stream的逻辑）
  let apiKey: string
  let baseUrl: string
  let client: any

  // 获取DeepSeek配置
  apiKey = process.env.DEEPSEEK_API_KEY!
  baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

  // 创建OpenAI兼容客户端
  const OpenAI = require('openai')
  client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are a professional frontend developer. Generate a complete React component based on user requirements.

IMPORTANT: User requirements may be in Chinese or English. Treat both languages equally and generate the same quality code regardless of the input language.

CRITICAL RULES:
1. Return ONLY the React component code with necessary imports
2. Use modern React hooks (useState, useEffect, etc.) and functional components
3. Include inline styles or Tailwind classes for styling
4. Make it visually appealing and responsive
5. ALWAYS declare variables and hooks BEFORE the return statement
6. The return statement must ONLY contain JSX expressions
7. NEVER use "javascript:" prefix or similar invalid tokens
8. NEVER use undefined variables - all variables must be declared with const/let/var before use
9. Pay special attention to variables like 'left', 'right', 'top', 'bottom' - ensure they are properly declared
10. ONLY use standard HTML elements (div, button, input, etc.) or components you define in the same file
11. NEVER reference external components like Editor, Chart, FormGenerator, etc. unless you define them first
12. Export as default

CORRECT STRUCTURE EXAMPLE:
import React from 'react';

function App() {
  const [count, setCount] = React.useState(0);
  const handleClick = () => setCount(count + 1);

  return (
    <div className="p-4">
      <h1>Counter: {count}</h1>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}

export default App;`
        },
        {
          role: 'user',
          content: prompt.trim()
        }
      ],
      max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS!),
      temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE!),
    })

    // 获取完整响应
    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from AI')
    }

    return content.trim()
  } catch (error: any) {
    console.error('AI生成失败:', error)
    throw new Error(`AI生成失败: ${error.message}`)
  }
}
