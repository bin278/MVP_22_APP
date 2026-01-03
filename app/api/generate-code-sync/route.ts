import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { add, getDatabase } from '@/lib/database/cloudbase'


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

    console.log('🚀 开始AI代码生成，等待完整生成...')

    try {
      // 设置45秒超时，避免CloudBase的60秒硬限制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SYNC_GENERATION_TIMEOUT')), 45000)
      })

      console.log('🚀 开始同步AI代码生成（45秒超时限制）...')

      // 直接调用AI生成代码，带超时控制
      const generatedCode = await Promise.race([
        generateCodeWithAI(prompt.trim()),
        timeoutPromise
      ])

      console.log('✅ AI代码生成完成')

      // 保存生成记录到数据库
      try {
        await add('code_generation_history', {
          openid,
          prompt: prompt.trim(),
          code: generatedCode,
          codeLength: generatedCode.length,
          createdAt: new Date(),
          method: 'sync-full'
        })
        console.log('📊 生成历史已保存到数据库')
      } catch (dbError: any) {
        console.warn('⚠️ 保存生成历史失败，但不影响代码生成:', dbError.message)
      }

      // 返回完整的生成代码
      return NextResponse.json({
        code: 0,
        msg: '代码生成成功',
        data: {
          code: generatedCode,
          codeLength: generatedCode.length
        }
      })

    } catch (error: any) {
      console.error('❌ AI代码生成失败:', error)
      return NextResponse.json({
        code: -1,
        msg: '代码生成失败',
        error: error.message
      }, { status: 500 })
    }

  } catch (err: any) {
    console.error('同步生成请求失败:', err)
    return NextResponse.json(
      { code: -1, msg: '请求处理失败', error: err.message },
      { status: 500 }
    )
  }
}



// 优化的AI代码生成（在60秒内完成）
async function generateCodeWithAI(prompt: string): Promise<string> {
  const model = 'deepseek-chat'
  let apiKey: string
  let baseUrl: string
  let client: any

  apiKey = process.env.DEEPSEEK_API_KEY!
  baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

  const OpenAI = require('openai')
  client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  console.log('🚀 开始优化的AI代码生成...')

  // 高质量代码生成参数（允许更长时间）
  const completion = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: `Generate a clean React component in JavaScript. Return ONLY the code, no explanations.

Requirements:
1. Plain JavaScript only (no TypeScript)
2. React hooks and functional components
3. All imports at top
4. Tailwind CSS styling
5. Default export
6. Keep it simple and focused

Return ONLY the raw JavaScript code, nothing else.`
      },
      {
        role: 'user',
        content: prompt.trim()
      }
    ],
    max_tokens: 2500, // 减少token限制以加快生成速度
    temperature: 0.6, // 平衡创造性和速度
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('No content generated from AI')
  }

  console.log('✅ AI代码生成完成，长度:', content.trim().length)

  // 清理和提取真正的React组件代码
  const cleanCode = extractReactComponentCode(content.trim())
  console.log('🧹 代码清理完成，清理后长度:', cleanCode.length)

  return cleanCode
}

// 更新任务成功状态
async function updateTaskSuccess(taskId: string, generatedCode: string) {
  try {
    const db = getDatabase()
    await db.collection('code_generation_tasks').doc(taskId).update({
      status: 'completed',
      code: generatedCode,
      codeLength: generatedCode.length,
      completedAt: new Date(),
      updatedAt: new Date()
    })
    console.log('✅ 任务完成状态已更新:', taskId)
  } catch (error: any) {
    console.error('❌ 更新任务成功状态失败:', error)
  }
}

// 更新任务失败状态
async function updateTaskFailed(taskId: string, errorMessage: string) {
  try {
    const db = getDatabase()
    await db.collection('code_generation_tasks').doc(taskId).update({
      status: 'failed',
      error: errorMessage,
      failedAt: new Date(),
      updatedAt: new Date()
    })
    console.log('❌ 任务失败状态已更新:', taskId)
  } catch (error: any) {
    console.error('❌ 更新任务失败状态失败:', error)
  }
}

// 提取和清理React组件代码
function extractReactComponentCode(rawContent: string): string {
  let code = rawContent.trim()

  console.log('🔍 开始清理AI生成的代码...')
  console.log('原始内容长度:', code.length)
  console.log('原始内容预览:', code.substring(0, 300) + (code.length > 300 ? '...' : ''))

  // 1. 尝试从markdown代码块中提取代码
  const markdownRegex = /```(?:jsx?|typescript|ts|js)?\n?([\s\S]*?)```/g
  const markdownMatches = [...code.matchAll(markdownRegex)]

  if (markdownMatches.length > 0) {
    // 找到最长的代码块，通常是主要的组件代码
    let longestMatch = markdownMatches[0][1]
    for (const match of markdownMatches) {
      if (match[1].length > longestMatch.length) {
        longestMatch = match[1]
      }
    }
    code = longestMatch.trim()
    console.log('📦 从markdown代码块提取了代码')
  }

  // 2. 移除常见的AI生成的前缀和后缀
  code = code
    // 移除代码块外的解释文本
    .replace(/^(?:Here's|Here is|Below is|This is|I created|I've created|Here's a|Here is a).*?(?:component|code|React component):\s*/im, '')
    .replace(/^(?:The following|Following).*?(?:component|code):\s*/im, '')
    // 移除行首的说明文字
    .replace(/^.*?(?:component|code) (?:that|which|with).*?:\s*/im, '')
    // 移除结尾的解释
    .replace(/\n\n.*?(?:This|The).*?(?:component|code).*?(?:provides|includes|features|uses).*?$/s, '')
    .replace(/\n\n.*?(?:You can|To use|The component).*?$/s, '')

  // 3. 移除多余的空行
  code = code.replace(/\n{3,}/g, '\n\n')

  // 4. 确保代码以import或function或const开头
  const lines = code.split('\n').filter(line => line.trim())

  // 查找第一个有意义的代码行
  let startIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('import') ||
        line.startsWith('export') ||
        line.startsWith('function') ||
        line.startsWith('const') ||
        line.startsWith('interface') ||
        line.startsWith('type') ||
        line.includes('=') && line.includes('=>') ||
        line.includes('React.') ||
        line.includes('<') && line.includes('>')) {
      startIndex = i
      break
    }
  }

  // 从有意义的代码行开始
  code = lines.slice(startIndex).join('\n')

  // 5. 移除结尾的注释和多余内容
  code = code
    .replace(/\n\/\/.*?(?:This|The).*?(?:component|code).*?(?:is|provides|includes).*?$/s, '')
    .replace(/\n\/\*.*?(?:This|The).*?(?:component|code).*?(?:is|provides|includes).*?\*\//s, '')

  // 6. 最后的清理
  code = code.trim()

  // 7. 额外的清理 - 移除AI可能添加的额外内容
  // 移除代码顶部的多余注释
  code = code.replace(/^\/\*[\s\S]*?\*\/\s*/m, '')
  code = code.replace(/^\/\/.*$/gm, '')

  // 移除可能的语言标识
  code = code.replace(/^javascript\s*/im, '')
  code = code.replace(/^js\s*/im, '')

  // 移除可能的代码块标记
  code = code.replace(/^```\w*\s*$/gm, '')
  code = code.replace(/^```\s*$/gm, '')

  // 8. 移除TypeScript语法（以防AI仍然生成TS代码）
  // 移除interface定义
  code = code.replace(/interface\s+\w+\s*\{[^}]*\};?\s*/g, '')
  // 移除type定义
  code = code.replace(/type\s+\w+\s*=.*;\s*/g, '')

  // 更精确地移除TypeScript类型注解
  // 移除函数参数类型注解，如 (param: string) => (param)
  code = code.replace(/\(\s*\w+\s*:\s*[^,)]+/g, '(')
  // 移除变量声明类型注解，如 const x: string = (const x =)
  code = code.replace(/(const|let|var)\s+(\w+)\s*:\s*[^=]+=\s*/g, '$1 $2 = ')
  // 移除React.FC类型注解
  code = code.replace(/:\s*React\.FC(\<[^>]*\>)?/g, '')
  // 移除其他常见的类型注解模式
  code = code.replace(/(\w+)\s*:\s*\w+(\[\])?\s*=\s*/g, '$1 = ')

  // 移除泛型尖括号，但保留JSX中的尖括号
  // 这是一个简化版本，避免误删JSX
  code = code.replace(/<(\w+)\s*extends\s*[^>]*>/g, '') // 移除extends泛型
  code = code.replace(/<(\w+)\s*,?\s*\w+\s*>/g, '') // 移除简单泛型

  // 8. 验证代码是否合理
  const hasReactImport = code.includes('import React') || code.includes("from 'react'")
  const hasComponent = code.includes('function') || code.includes('const') || code.includes('export')
  const hasJSX = code.includes('<') && code.includes('>')

  if (!hasComponent || !hasJSX) {
    console.warn('⚠️ 提取的代码可能不完整，hasComponent:', hasComponent, 'hasJSX:', hasJSX)
    // 如果提取失败，返回原始内容
    return rawContent.trim()
  }

  console.log('✅ 代码清理完成，清理后长度:', code.length)
  console.log('🔍 代码预览:', code.substring(0, 200) + (code.length > 200 ? '...' : ''))

  return code
}

