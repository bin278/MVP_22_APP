import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'
import { taskQueue } from '../generate-async/route'
import OpenAI from 'openai'

// 任务状态枚举
enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 任务接口
interface ModificationTask {
  _id?: string
  taskId: string
  userId: string
  conversationId?: string
  code: string
  instruction: string
  status: TaskStatus
  progress: number
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
}

// 导入SSE广播函数
function broadcastTaskUpdate(taskId: string, data: any) {
  // 动态导入SSE模块
  import('./[taskId]/stream/route').then(({ broadcastTaskUpdate: broadcast }) => {
    broadcast(taskId, data)
  }).catch(error => {
    console.error('Failed to import broadcast function:', error)
  })
}

// 代码修改函数
async function modifyCodeAsync(
  code: string,
  instruction: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  })

  onProgress(10)

  try {
    const completion = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
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
      max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.5'),
    })

    onProgress(80)

    const modifiedCode = completion.choices[0]?.message?.content || ''

    // Clean up the modified code
    let cleanCode = modifiedCode.trim()

    // Remove markdown code blocks if present
    const codeBlockRegex = /```(?:typescript|tsx|jsx|js|ts)?\s*([\s\S]*?)```/
    const match = cleanCode.match(codeBlockRegex)
    if (match) {
      cleanCode = match[1].trim()
    }

    onProgress(100)

    return cleanCode

  } catch (error: any) {
    console.error('AI代码修改失败:', error)
    throw error
  }
}

// 开始异步修改任务
export async function POST(request: NextRequest) {
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
    const { code, instruction, conversationId } = await request.json()

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

    // 生成唯一任务ID
    const taskId = `modify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建任务
    const task: ModificationTask = {
      taskId,
      userId: user.id,
      conversationId,
      code: code.trim(),
      instruction: instruction.trim(),
      status: TaskStatus.PENDING,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 存储到队列
    taskQueue.set(taskId, task)

    // 异步执行任务
    processModificationTask(task)

    return NextResponse.json({
      success: true,
      taskId,
      status: 'accepted',
      message: '异步代码修改任务已提交处理'
    })

  } catch (error: any) {
    console.error('创建异步修改任务失败:', error)
    return NextResponse.json(
      { error: '创建任务失败' },
      { status: 500 }
    )
  }
}

// 处理异步修改任务
async function processModificationTask(task: ModificationTask) {
  try {
    // 更新状态为运行中
    task.status = TaskStatus.RUNNING
    task.startedAt = new Date().toISOString()
    task.progress = 10
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)

    // 广播开始处理状态
    broadcastTaskUpdate(task.taskId, {
      type: 'status_update',
      status: TaskStatus.RUNNING,
      progress: 10,
      message: '开始处理代码修改...'
    })

    // 执行代码修改
    const result = await modifyCodeAsync(
      task.code,
      task.instruction,
      (progress) => {
        task.progress = 10 + (progress * 0.8) // 10-90%
        task.updatedAt = new Date().toISOString()
        taskQueue.set(task.taskId, task)

        // 广播进度更新
        broadcastTaskUpdate(task.taskId, {
          type: 'progress_update',
          progress: task.progress,
          message: `修改进度: ${Math.round(task.progress)}%`
        })
      }
    )

    // 完成任务
    task.status = TaskStatus.COMPLETED
    task.progress = 100
    task.result = result
    task.completedAt = new Date().toISOString()
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)

    // 广播完成状态
    broadcastTaskUpdate(task.taskId, {
      type: 'completed',
      result: result,
      codeLength: result.length,
      message: '代码修改完成！'
    })

    console.log(`✅ 异步修改任务 ${task.taskId} 完成`)

  } catch (error: any) {
    console.error(`❌ 异步修改任务 ${task.taskId} 失败:`, error)

    // 任务失败
    task.status = TaskStatus.FAILED
    task.error = error.message || '修改失败'
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)

    // 广播失败状态
    broadcastTaskUpdate(task.taskId, {
      type: 'failed',
      error: task.error,
      message: '代码修改失败'
    })
  }
}
