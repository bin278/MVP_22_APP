import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'
import { query } from '@/lib/database'

// 查询任务状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
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
    const { taskId } = await params

    console.log(`🔍 从数据库查询任务: ${taskId}, 用户: ${user.id}`)

    // 检查数据库连接
    try {
      const { getDatabaseProvider } = await import('@/lib/database')
      const provider = getDatabaseProvider()
      console.log(`📊 当前数据库提供商: ${provider}`)
    } catch (dbError: any) {
      console.error('❌ 数据库配置错误:', dbError)
    }

    // 直接从数据库查询任务
    const result = await query('generation_tasks', { where: { taskId } })
    console.log('📊 查询结果:', result)
    const task = result && result.data && result.data.length > 0 ? result.data[0] as any : null

    console.log(`📋 任务查询结果:`, task ? { status: task.status, userId: task.userId } : 'null')

    if (!task) {
      console.log(`❌ 任务不存在: ${taskId}`)
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      )
    }

    // 验证任务所有权
    if (task.userId !== user.id) {
      return NextResponse.json(
        { error: '无权限访问此任务' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      taskId: task.taskId,
      status: task.status,
      progress: task.progress,
      result: task.result,
      error: task.error,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    })

  } catch (error: any) {
    console.error('查询任务状态失败:', error)
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
      stack: error.stack
    })
    return NextResponse.json(
      {
        error: '查询失败',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

// 取消任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user
    const { taskId } = await params

    // 从数据库查询任务
    const result = await query('generation_tasks', { where: { taskId } })
    const task = result && result.data && result.data.length > 0 ? result.data[0] as any : null

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      )
    }

    if (task.userId !== user.id) {
      return NextResponse.json(
        { error: '无权限取消此任务' },
        { status: 403 }
      )
    }

    // 取消任务 - 更新数据库
    const { update } = await import('@/lib/database')
    await update('generation_tasks', { taskId }, {
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: '任务已取消'
    })

  } catch (error: any) {
    console.error('取消任务失败:', error)
    return NextResponse.json(
      { error: '取消失败' },
      { status: 500 }
    )
  }
}
