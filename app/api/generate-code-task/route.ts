import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database/cloudbase'

// 查询代码生成任务状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { code: -1, msg: '缺少taskId参数' },
        { status: 400 }
      )
    }

    console.log('🔍 查询代码生成任务状态:', taskId)

    const db = getDatabase()
    const taskDoc = await db.collection('code_generation_tasks').doc(taskId).get()

    if (!taskDoc.data) {
      return NextResponse.json(
        { code: -1, msg: '任务不存在' },
        { status: 404 }
      )
    }

    const task = taskDoc.data

    return NextResponse.json({
      code: 0,
      msg: '查询成功',
      data: {
        taskId: task.taskId,
        status: task.status,
        code: task.code || null,
        codeLength: task.codeLength || 0,
        error: task.error || null,
        createdAt: task.createdAt,
        completedAt: task.completedAt || null,
        failedAt: task.failedAt || null
      }
    })

  } catch (error: any) {
    console.error('查询任务状态失败:', error)
    return NextResponse.json(
      { code: -1, msg: '查询失败', error: error.message },
      { status: 500 }
    )
  }
}
