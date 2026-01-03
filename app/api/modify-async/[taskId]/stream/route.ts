import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'

// SSE 连接管理器
const activeConnections = new Map<string, ReadableStreamDefaultController>()

// 广播任务状态更新
export function broadcastTaskUpdate(taskId: string, data: any) {
  const controller = activeConnections.get(taskId)
  if (controller) {
    try {
      const eventData = `data: ${JSON.stringify(data)}\n\n`
      controller.enqueue(new TextEncoder().encode(eventData))
    } catch (error) {
      console.error('Failed to send SSE data:', error)
      activeConnections.delete(taskId)
    }
  }
}

// GET /api/modify-async/[taskId]/stream - SSE 流式监听
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const taskId = params.taskId

  try {
    // 从查询参数获取token进行认证 (SSE不支持Authorization头)
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response('Authentication token required', { status: 401 })
    }

    // 验证token
    const authResult = await requireAuth({
      ...request,
      headers: new Headers({
        ...Object.fromEntries(request.headers.entries()),
        'authorization': `Bearer ${token}`
      })
    })

    if (!authResult.success) {
      return new Response('Authentication required', { status: 401 })
    }

    // 创建 SSE 流
    const stream = new ReadableStream({
      start(controller) {
        // 存储连接
        activeConnections.set(taskId, controller)

        // 发送初始连接确认
        const initData = {
          type: 'connected',
          taskId,
          timestamp: Date.now(),
          message: 'SSE connection established for code modification'
        }
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(initData)}\n\n`))

        // 清理函数
        request.signal.addEventListener('abort', () => {
          activeConnections.delete(taskId)
          console.log(`SSE connection closed for modification task ${taskId}`)
        })
      },
      cancel() {
        activeConnections.delete(taskId)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })

  } catch (error: any) {
    console.error('SSE connection error for modification:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
