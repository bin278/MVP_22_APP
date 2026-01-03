import { NextRequest, NextResponse } from 'next/server'
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

      // 触发异步代码生成（可以是后台任务或队列）
      // 这里暂时返回任务ID，客户端通过轮询或WebSocket获取结果
      setImmediate(async () => {
        try {
          console.log('🤖 开始异步AI代码生成...')
          const generatedCode = await generateCodeWithAI(prompt.trim())

          // 更新数据库状态
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

          // 更新错误状态
          await db.collection('code_generation_tasks').where({
            taskId
          }).update({
            status: 'failed',
            error: error.message,
            updatedAt: new Date()
          })
        }
      })

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
          content: `Generate a complete React component. Return ONLY the React component code, no explanations, no markdown, no JSON structure.

Requirements:
1. Use proper code formatting with consistent indentation (2 spaces)
2. Include all necessary React imports
3. Create a functional component with proper JSX structure
4. Use Tailwind CSS classes for styling
5. Make it immediately runnable
6. Export as default

Example output:
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Hello World</h1>
        <p className="text-gray-600">Welcome to my app!</p>
      </div>
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
      max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
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
