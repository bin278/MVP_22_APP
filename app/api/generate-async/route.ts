import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'
import { add, update, query } from '@/lib/database/cloudbase'
import OpenAI from 'openai'
import { recordRecommendationUsage } from '@/lib/subscription/usage-tracker'

// 导入SSE广播函数
function broadcastTaskUpdate(taskId: string, data: any) {
  // 动态导入SSE模块
  import('./[taskId]/stream/route').then(({ broadcastTaskUpdate: broadcast }) => {
    broadcast(taskId, data)
  }).catch(error => {
    console.error('Failed to import broadcast function:', error)
  })
}

// 任务状态枚举
enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 任务接口
interface GenerationTask {
  _id?: string
  taskId: string
  userId: string
  conversationId?: string
  prompt: string
  model: string
  status: TaskStatus
  progress: number
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
}

// 全局任务队列（生产环境应该用Redis或数据库）
// 使用全局变量避免热重载时的重置
if (!(global as any).taskQueue) {
  (global as any).taskQueue = new Map<string, GenerationTask>()
}
export const taskQueue = (global as any).taskQueue as Map<string, GenerationTask>

// AI客户端初始化
function getAIClient(model: string) {
  const isDeepSeek = model.includes('deepseek')

  if (isDeepSeek) {
    return new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    })
  } else {
    // 其他模型的配置
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
}

// 格式化代码
function formatCodeString(code: string): string {
  const lineCount = (code.match(/\n/g) || []).length
  if (lineCount > 5) {
    return code
  }

  // 简单的代码格式化
  let formatted = code
    .replace(/;/g, ';\n')
    .replace(/{/g, '{\n')
    .replace(/}/g, '\n}')
    .replace(/\n\s*\n\s*\n/g, '\n\n')

  return formatted
}

// 创建项目结构
function createProjectFromCode(code: string, isModification: boolean = false) {
  const project = {
    files: {
      'src/App.tsx': code,
      'src/index.css': `body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

code {
  font-family: 'Monaco', 'Menlo', monospace;
}`,
      'package.json': JSON.stringify({
        "name": "generated-app",
        "version": "0.1.0",
        "dependencies": {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-scripts": "5.0.1"
        }
      }, null, 2)
    },
    projectName: 'smart-generated-app'
  }

  // 如果是修改任务，添加标记
  if (isModification) {
    (project as any).isModification = true
  }

  return project
}

// 异步代码生成
async function generateCodeAsync(
  prompt: string,
  model: string,
  onProgress: (progress: number) => void
): Promise<any> {
  const client = getAIClient(model)

  onProgress(10)

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

    onProgress(80)

    const generatedCode = completion.choices[0]?.message?.content || ''
    const formattedCode = formatCodeString(generatedCode)
    const project = createProjectFromCode(formattedCode)

    onProgress(100)

    return project

  } catch (error: any) {
    console.error('AI生成失败:', error)
    throw error
  }
}

// 开始异步生成任务
export async function POST(request: NextRequest) {
  console.log('📥 收到异步生成请求')
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
    const { prompt, model, conversationId, existingContent, isModification, originalCode } = await request.json()
    console.log('📝 请求参数:', { prompt: prompt.substring(0, 50) + '...', model, conversationId, isModification })

    // 生成唯一任务ID
    const taskId = `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建任务
    const task: GenerationTask = {
      taskId,
      userId: user.id,
      conversationId,
      prompt: prompt.trim(),
      model: model || 'deepseek-chat',
      status: TaskStatus.PENDING,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 存储到队列
    taskQueue.set(taskId, task)
    console.log(`✅ 任务已存储到全局队列: ${taskId}, 队列大小: ${taskQueue.size}`)

    // 异步执行任务（不等待，避免阻塞API响应）
    setImmediate(() => {
      console.log(`🚀 开始异步处理任务: ${taskId}, isModification: ${!!existingContent}`)
      processAsyncTask(task, existingContent, !!existingContent).catch(error => {
        console.error('异步任务处理失败:', error)
      })
    })

    return NextResponse.json({
      success: true,
      taskId,
      status: 'accepted',
      message: '异步任务已提交处理'
    })

  } catch (error: any) {
    console.error('创建异步任务失败:', error)
    return NextResponse.json(
      { error: '创建任务失败' },
      { status: 500 }
    )
  }
}

// 处理异步任务
async function processAsyncTask(task: GenerationTask, existingContent?: string, isModification: boolean = false) {
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
      message: '开始处理任务...'
    })

    // 如果有现有内容，从断点继续生成
    const fullPrompt = existingContent
      ? `Continue generating from this existing code:\n\n${existingContent}\n\nAdditional requirements: ${task.prompt}`
      : task.prompt

    console.log(`🎯 处理任务类型: ${isModification ? '修改' : '生成'}, 现有内容长度: ${existingContent?.length || 0}`)

    // 生成代码
    const result = await generateCodeAsync(
      fullPrompt,
      task.model,
      (progress) => {
        task.progress = 10 + (progress * 0.8) // 10-90%
        task.updatedAt = new Date().toISOString()
        taskQueue.set(task.taskId, task)

        // 广播进度更新
        broadcastTaskUpdate(task.taskId, {
          type: 'progress_update',
          progress: task.progress,
          message: `生成进度: ${Math.round(task.progress)}%`
        })
      }
    )

    // 创建结果项目，包含修改标记
    const projectResult = createProjectFromCode(result.files['src/App.tsx'] || result.files[Object.keys(result.files)[0]], isModification)

    // 完成任务
    task.status = TaskStatus.COMPLETED
    task.progress = 100
    task.result = projectResult
    task.completedAt = new Date().toISOString()
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)

    // 记录代码生成使用（包括修改代码）
    try {
      // 计算生成的内容长度
      let generatedLength = 0
      if (projectResult.files) {
        Object.values(projectResult.files).forEach((fileContent: any) => {
          generatedLength += String(fileContent).length
        })
      }

      await recordRecommendationUsage(task.userId, {
        model: task.model,
        prompt_length: task.prompt.length,
        generated_length: generatedLength,
        type: isModification ? 'code_modification' : 'code_generation'
      })
      console.log('✅ [异步任务] 代码生成使用已记录')
    } catch (usageError) {
      console.error('❌ [异步任务] 记录使用失败:', usageError)
      // 不影响任务完成，继续返回结果
    }

    // 广播完成状态
    broadcastTaskUpdate(task.taskId, {
      type: 'completed',
      result: result,
      message: '代码生成完成！'
    })

    console.log(`✅ 异步任务 ${task.taskId} 完成`)

  } catch (error: any) {
    console.error(`❌ 异步任务 ${task.taskId} 失败:`, error)

    // 任务失败
    task.status = TaskStatus.FAILED
    task.error = error.message || '生成失败'
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)

    // 广播失败状态
    broadcastTaskUpdate(task.taskId, {
      type: 'failed',
      error: task.error,
      message: '代码生成失败'
    })
  }
}
