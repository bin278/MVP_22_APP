import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getDatabase } from '@/lib/database/cloudbase'

interface JWTPayload {
  userId?: string
  openid?: string
  exp: number
}

export async function GET(request: NextRequest) {
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

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { code: -1, msg: '缺少taskId参数' },
        { status: 400 }
      )
    }

    // 查询数据库
    console.log('🔍 查询任务状态:', taskId)
    const db = await getDatabase()

    const tasks = await db.collection('code_generation_tasks')
      .where({
        taskId,
        openid // 确保用户只能查询自己的任务
      })
      .get()

    if (!tasks.data || tasks.data.length === 0) {
      return NextResponse.json(
        { code: -1, msg: '任务不存在' },
        { status: 404 }
      )
    }

    const task = tasks.data[0]
    console.log('📊 任务状态:', task.status)

    return NextResponse.json({
      code: 0,
      msg: '查询成功',
      data: {
        taskId: task.taskId,
        status: task.status,
        code: task.code || '',
        codeLength: task.codeLength || 0,
        error: task.error || null,
        createdAt: task.createdAt,
        completedAt: task.completedAt
      }
    })

  } catch (err: any) {
    console.error('查询任务失败:', err)
    return NextResponse.json(
      { code: -1, msg: '查询任务失败', error: err.message },
      { status: 500 }
    )
  }
}