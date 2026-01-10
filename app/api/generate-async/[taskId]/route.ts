import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'
import { taskQueue } from '../route'
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

    console.log(`🔍 查询任务: ${taskId}, 用户: ${user.id}, 全局队列大小: ${taskQueue.size}`)
    console.log('🔍 队列中的所有任务ID:', Array.from(taskQueue.keys()))

    // 先尝试从全局队列获取任务状态(本地开发)
    let task = taskQueue.get(taskId)

    // 如果队列中没有,从数据库查询(Vercel)
    if (!task) {
      console.log(`🔍 队列中未找到,尝试从数据库查询: ${taskId}`)
      try {
        const result = await query('generation_tasks', { taskId })
        if (result && result.length > 0) {
          task = result[0] as any
          console.log(`✅ 从数据库找到任务: ${taskId}, 状态: ${task.status}`)
        }
      } catch (dbError) {
        console.error('数据库查询失败:', dbError)
      }
    } else {
      console.log(`✅ 从队列找到任务: ${taskId}, 状态: ${task.status}`)
    }

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
    return NextResponse.json(
      { error: '查询失败' },
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

    const task = taskQueue.get(taskId)
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

    // 取消任务
    task.status = 'cancelled'
    task.updatedAt = new Date().toISOString()
    taskQueue.set(taskId, task)

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
