import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AVAILABLE_MODELS, canUseModel, type SubscriptionTier } from '@/lib/subscription-tiers'
import { CODE_GENERATION_SYSTEM_PROMPT, CODE_GENERATION_SYSTEM_PROMPT_FREE } from '@/lib/ai-prompts'
import { requireAuth } from '@/lib/auth/auth'
import { add } from '@/lib/database/cloudbase'
import { recordRecommendationUsage } from '@/lib/subscription/usage-tracker'

// Vercel Serverless Function 超时配置 (秒)
export const maxDuration = 60

// 生成状态管理接口
interface GenerationState {
  taskId: string
  status: 'streaming' | 'fallback_async' | 'completed' | 'failed'
  streamedContent: string
  progress: number
  lastActivity: number
  mode: 'streaming' | 'async'
}

// 通用分段生成函数
function splitPromptIntoSegments(prompt: string): string[] {
  const segments: string[] = [];

  // 分析提示内容，决定分割策略
  const hasMultipleFeatures = prompt.includes('包含') || prompt.includes('包括') ||
                             prompt.includes('和') || prompt.includes('以及') ||
                             prompt.includes('功能') || prompt.includes('组件');

  if (hasMultipleFeatures) {
    // 智能分割：根据功能点分割
    const parts = prompt.split(/[，,。包含包括和以及功能组件]/).filter(p => p.trim().length > 5);

    if (parts.length >= 2) {
      // 基础结构段落
      const basePrompt = parts[0].trim();
      segments.push(`${basePrompt}，请创建一个基础的组件结构。`);

      // 功能段落
      for (let i = 1; i < Math.min(parts.length, 4); i++) {
        const feature = parts[i].trim();
        if (feature.length > 3) {
          segments.push(`${basePrompt}，请添加${feature}功能。`);
        }
      }

      // 如果功能太多，合并最后几个
      if (parts.length > 4) {
        const remainingFeatures = parts.slice(3).join('、');
        segments.push(`${basePrompt}，请集成${remainingFeatures}等其他功能。`);
      }
    } else {
      // 简单分割
      splitSimplePrompt(prompt, segments);
    }
  } else {
    // 简单提示也分割为2-3个段落
    splitSimplePrompt(prompt, segments);
  }

  // 确保至少有2个段落，最多不超过5个
  if (segments.length < 2) {
    splitSimplePrompt(prompt, segments);
  }

  return segments.slice(0, 5); // 限制最大段落数
}

// 简单提示分割函数
function splitSimplePrompt(prompt: string, segments: string[]): void {
  const promptLength = prompt.length;

  if (promptLength < 100) {
    // 短提示：分成2个段落
    segments.push(`${prompt}，请先创建基础结构。`);
    segments.push(`${prompt}，请完善功能和样式。`);
  } else if (promptLength < 200) {
    // 中等提示：分成2-3��段落
    segments.push(`${prompt}，第一部分：基础实现。`);
    segments.push(`${prompt}，第二部分：功能完善。`);
  } else {
    // 长提示：分成3个段落
    segments.push(`${prompt.substring(0, promptLength / 3)}...，第一阶段实现。`);
    segments.push(`${prompt.substring(promptLength / 3, 2 * promptLength / 3)}...，第二阶段完善。`);
    segments.push(`${prompt.substring(2 * promptLength / 3)}，第三阶段集成。`);
  }
}

// 根据订阅层级生成项目生成的系统提示词
function getProjectGenerationPrompt(tier: SubscriptionTier): string {
  if (tier === 'free') {
    // 免费版：严格限制只生成4个文件
    return `Generate a SIMPLE React app as JSON. Keep it minimal and easy to understand.

CRITICAL FILE REQUIREMENTS - MUST FOLLOW EXACTLY:
- You MUST generate EXACTLY 4 files, NO MORE, NO LESS:
  1. src/App.jsx (main component)
  2. src/index.css (styles)
  3. package.json (dependencies)
  4. README.md (documentation)
- DO NOT create ANY other files
- DO NOT create src/components/ directory
- DO NOT create src/utils/ directory
- DO NOT create any additional .jsx or .js files
- ALL component code MUST be in src/App.jsx only

CODE RULES - VERY IMPORTANT:
- Use pure JavaScript/JSX only, NO TypeScript
- NO type annotations (no : string, : number, : React.FC, etc.)
- NO interface or type definitions
- NO generics like useState<string>(), just use useState()
- ALL code in single App.jsx file - NO separate component files
- Use basic React hooks: useState, useEffect
- Keep component under 150 lines
- Simple inline styles with Tailwind CSS classes
- No complex patterns (no Context, Redux, custom hooks)
- Focus on clarity over features
- CRITICAL: All ternary expressions MUST be complete with both branches
  - CORRECT: \${duration ? (currentTime / duration) * 100 : 0}%
  - WRONG: \${duration ? (currentTime / duration) * 100 }% (missing : part)
- CRITICAL: JSX table structure must be correct:
  - <table><thead><tr><th>...</th></tr></thead><tbody>...</tbody></table>

Return JSON with EXACTLY these 4 files:
{"files":{"src/App.jsx":"...","src/index.css":"...","package.json":"...","README.md":"..."},"projectName":"my-app"}`;
  } else {
    // 付费版（pro/enterprise）：允许生成更多文件和组件
    return `Generate a React app as JSON. You can create multiple files and components as needed.

FILE REQUIREMENTS:
- Required base files: src/App.jsx, src/index.css, package.json, README.md
- You CAN create additional files as needed:
  - src/components/ directory for reusable components
  - src/utils/ directory for utility functions
  - src/hooks/ directory for custom hooks
  - Additional .jsx or .js files as needed
- Organize code into logical modules and components

CODE RULES - VERY IMPORTANT:
- Use pure JavaScript/JSX only, NO TypeScript
- NO type annotations (no : string, : number, : React.FC, etc.)
- NO interface or type definitions
- NO generics like useState<string>(), just use useState()
- Use React hooks: useState, useEffect, custom hooks allowed
- Break down complex components into smaller reusable components
- Use Tailwind CSS classes for styling
- Follow React best practices and patterns
- CRITICAL: All ternary expressions MUST be complete with both branches
  - CORRECT: \${duration ? (currentTime / duration) * 100 : 0}%
  - WRONG: \${duration ? (currentTime / duration) * 100 }% (missing : part)
- CRITICAL: JSX table structure must be correct:
  - <table><thead><tr><th>...</th></tr></thead><tbody>...</tbody></table>

Return JSON with all necessary files:
{"files":{"src/App.jsx":"...","src/index.css":"...","package.json":"...","README.md":"...","src/components/Component.jsx":"..."},"projectName":"my-app"}`;
  }
}

// 分段生成处理函数 - 直接使用流式响应
function generateInSegments(
  segments: string[],
  model: string,
  conversationId: string | undefined,
  user: any
): Response {
  console.log(`🎯 开始分段生成，共 ${segments.length} 个部分`);

  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = '';

      try {
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          console.log(`📝 生成第 ${i + 1}/${segments.length} 部分: ${segment.substring(0, 50)}...`);

          // 发送分段开始信号
          const segmentStartData = {
            type: 'segment_start',
            segment: i + 1,
            total: segments.length,
            prompt: segment
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(segmentStartData)}\n\n`));

          // 调用AI生成这个段落
          const segmentContent = await generateSegment(segment, model, user);

          // 连续发送内容，确保代码显示不中断
          // 将内容按字符分组发送，每组8个字符
          const chars = segmentContent.split('');
          const chunkSize = 8;

          for (let j = 0; j < chars.length; j += chunkSize) {
            const chunk = chars.slice(j, j + chunkSize).join('');
            const charsData = {
              type: 'chars',
              chars: chunk,
              segment: i + 1,
              isComplete: false
            };
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(charsData)}\n\n`));

            // 小延迟以模拟流式效果
            await new Promise(resolve => setTimeout(resolve, 5));
          }

          // 发送段落完成信号
          const segmentCompleteData = {
            type: 'segment_complete',
            segment: i + 1,
            total: segments.length
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(segmentCompleteData)}\n\n`));

          fullContent += segmentContent;

          // 保存到数据库
          if (conversationId) {
            await add('conversation_messages', {
              conversation_id: conversationId,
              user_id: user.id,
              content: segment,
              role: 'user',
              created_at: new Date()
            });

            await add('conversation_messages', {
              conversation_id: conversationId,
              user_id: user.id,
              content: segmentContent,
              role: 'assistant',
              created_at: new Date()
            });
          }
        }

        // 发送最终完成信号
        const completeData = {
          type: 'complete',
          project: {
            files: {
              'generated-code.js': fullContent
            }
          }
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(completeData)}\n\n`));
        controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
        controller.close();

      } catch (error) {
        console.error('分段生成失败:', error);
        const errorData = {
          type: 'error',
          error: '分段生成失败，请重试'
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorData)}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// 生成单个段落的函数
async function generateSegment(prompt: string, model: string, user: any): Promise<string> {
  console.log(`🤖 生成段落: ${prompt}`);

  try {
    // 获取模型配置
    const modelConfig = AVAILABLE_MODELS[model];
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }

    // 初始化AI客户端
    let client: OpenAI;
    let apiKey: string;

    switch (modelConfig.provider) {
      case 'dashscope':
        apiKey = process.env.DASHSCOPE_API_KEY!;
        client = new OpenAI({
          apiKey: apiKey,
          baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        });
        break;
      case 'deepseek':
        apiKey = process.env.DEEPSEEK_API_KEY!;
        client = new OpenAI({
          apiKey: apiKey,
          baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        });
        break;
      case 'zhipu':
        apiKey = process.env.GLM_API_KEY!;
        client = new OpenAI({
          apiKey: apiKey,
          baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/',
        });
        break;
      default:
        throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }

    // 调用AI API
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的前端开发工程师，请根据用户需求生成高质量的React代码。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(modelConfig.maxTokens, 2000), // 限制段落长度
      temperature: 0.7,
      stream: false // 分段生成不使用流式
    });

    const content = completion.choices[0]?.message?.content || '';
    console.log(`✅ 段落生成完成，长度: ${content.length}`);

    // 记录代码生成使用（包括修改代码）
    try {
      await recordRecommendationUsage(user.id, {
        model: model,
        prompt_length: prompt.length,
        generated_length: content.length,
        type: 'code_generation'
      });
      console.log('✅ 代码生成使用已记录');
    } catch (error) {
      console.error('❌ 记录使用失败:', error);
      // 不影响生成流程，继续返回结果
    }

    return content;

  } catch (error) {
    console.error('段落生成失败:', error);
    // 返回简化版本作为后备
    return `
// 段落生成失败，返回简化版本
// 提示: ${prompt}

function FallbackComponent() {
  return (
    <div className="fallback">
      <h2>组件生成中...</h2>
      <p>正在处理：${prompt.substring(0, 50)}...</p>
    </div>
  );
}

export default FallbackComponent;
`;
  }
}

// 全局状态存储（生产环境应该用Redis）
const generationStates = new Map<string, GenerationState>()

// 风险评估函数
function assessGenerationRisk(prompt: string, model: string): boolean {
  const complexity = prompt.length + (prompt.split(' ').length * 2)
  const isComplexModel = model.includes('gpt-4') || model.includes('claude') || model.includes('deepseek')

  // 复杂度阈值：长提示词 + 复杂模型 = 高风险
  return complexity > 800 || (complexity > 400 && isComplexModel)
}

// 实时风险检测
function shouldFallback(state: GenerationState): boolean {
  const timeElapsed = Date.now() - state.lastActivity

  // 条件1：长时间无响应（30秒）
  if (timeElapsed > 30000) return true

  // 条件2：内容过少但时间较长（可能卡住）
  if (timeElapsed > 15000 && state.streamedContent.length < 50) return true

  // 条件3：进度停滞
  if (state.progress > 0 && timeElapsed > 10000 && state.progress < 20) return true

  return false
}

// 异步后备处理
async function startAsyncFallback(
  taskId: string,
  prompt: string,
  model: string,
  apiKey: string,
  baseUrl: string,
  existingContent: string,
  user: any
) {
  try {
    console.log(`🔄 启动异步后备处理，任务ID: ${taskId}`)

    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    })

    // 从现有内容继续生成
    const fullPrompt = existingContent
      ? `基于以下已生成的代码片段，继续完成完整的React组件：\n\n已生成：${existingContent}\n\n原始需求：${prompt}\n\n请生成完整的、可运行的代码。`
      : prompt

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `Generate a SIMPLE React app as JSON. Keep it minimal and easy to understand.

CRITICAL FILE REQUIREMENTS - MUST FOLLOW EXACTLY:
- You MUST generate EXACTLY 4 files, NO MORE, NO LESS:
  1. src/App.jsx (main component)
  2. src/index.css (styles)
  3. package.json (dependencies)
  4. README.md (documentation)
- DO NOT create ANY other files
- DO NOT create src/components/ directory
- DO NOT create src/utils/ directory
- DO NOT create any additional .jsx or .js files
- ALL component code MUST be in src/App.jsx only

CODE RULES - VERY IMPORTANT:
- Use pure JavaScript/JSX only, NO TypeScript
- NO type annotations (no : string, : number, : React.FC, etc.)
- NO interface or type definitions
- NO generics like useState<string>(), just use useState()
- ALL code in single App.jsx file - NO separate component files
- Use basic React hooks: useState, useEffect
- Keep component under 150 lines
- Simple inline styles with Tailwind CSS classes
- No complex patterns (no Context, Redux, custom hooks)
- Focus on clarity over features
- CRITICAL: All ternary expressions MUST be complete with both branches
  - CORRECT: \${duration ? (currentTime / duration) * 100 : 0}%
  - WRONG: \${duration ? (currentTime / duration) * 100 }% (missing : part)
- CRITICAL: JSX table structure must be correct:
  - <table><thead><tr><th>...</th></tr></thead><tbody>...</tbody></table>

Return JSON with EXACTLY these 4 files:
{"files":{"src/App.jsx":"...","src/index.css":"...","package.json":"...","README.md":"..."},"projectName":"my-app"}`
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      max_tokens: Math.min(parseInt(process.env.DEEPSEEK_MAX_TOKENS!), 8192),
      temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE!),
    })

    const additionalContent = completion.choices[0]?.message?.content || ''
    const finalContent = existingContent + additionalContent

    // 格式化代码
    let formattedCode = formatCodeString(finalContent)

    // 确保有有效的代码
    if (!formattedCode || formattedCode.length < 100) {
      formattedCode = `import React from 'react';

function GeneratedApp() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generated App</h1>
        <p className="text-gray-600 mb-4">
          Code generation completed with fallback mode.
        </p>
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> This was generated using fallback mode due to complexity.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GeneratedApp;`
    }

    // 创建项目结构
    const project = {
      files: {
        'src/App.jsx': formattedCode,
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

    // 更新状态
    const state = generationStates.get(taskId)
    if (state) {
      state.status = 'completed'
      state.progress = 100
    }

    console.log(`✅ 异步后备处理完成，任务ID: ${taskId}`)

    // 记录代码生成使用（包括修改代码）
    try {
      // 计算生成的内容长度
      let generatedLength = 0
      if (project.files) {
        Object.values(project.files).forEach((fileContent: any) => {
          generatedLength += String(fileContent).length
        })
      }

      await recordRecommendationUsage(user.id, {
        model: model,
        prompt_length: prompt.length,
        generated_length: generatedLength,
        type: 'code_generation'
      })
      console.log('✅ 异步模式代码生成使用已记录')
    } catch (usageError) {
      console.error('❌ 记录使用失败:', usageError)
      // 不影响生成流程，继续返回结果
    }

    return project

  } catch (error) {
    console.error('异步后备处理失败:', error)

    const state = generationStates.get(taskId)
    if (state) {
      state.status = 'failed'
    }

    throw error
  }
}

// 清理重复的代码定义

// 清理重复的代码定义

// 清理重复的代码定义

// 清理重复的代码定义

// 保存消息到对话
async function saveMessageToConversation(conversationId: string, role: 'user' | 'assistant', content: string, userId: string) {
  try {
    const messageData = {
      conversation_id: conversationId,
      user_id: userId,
      role: role,
      content: content,
      message_type: 'code_generation',
      created_at: new Date().toISOString()
    }

    await add('conversation_messages', messageData)
    console.log(`💾 Message saved to conversation ${conversationId}`)
  } catch (error) {
    console.error('❌ Failed to save message to conversation:', error)
    throw error
  }
}

function formatCodeString(code: string): string {
  // Quick check: if code already has good formatting, return as-is
  const lineCount = (code.match(/\n/g) || []).length
  if (lineCount > 5) {
    return code
  }

  // For minified code, do basic formatting
  if (code.length > 100 && lineCount < 3) {
    console.log('Formatting minified code')

    // Simple and fast formatting - just add newlines at key points
    let formatted = code
      // Add newlines after semicolons (simple version)
      .replace(/;/g, ';\n')
      // Add newlines around braces
      .replace(/{/g, '{\n')
      .replace(/}/g, '\n}')
      // Clean up excessive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Basic indentation
      .split('\n')
      .map((line, index, arr) => {
        const trimmed = line.trim()
        if (!trimmed) return ''

        // Simple indentation based on brace counting
        let indent = 0
        for (let i = 0; i < index; i++) {
          const prevLine = arr[i].trim()
          if (prevLine.endsWith('{')) indent++
          if (prevLine.startsWith('}')) indent--
        }

        return '  '.repeat(Math.max(0, indent)) + trimmed
      })
      .join('\n')

    return formatted
  }

  return code
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      console.log('❌ Authentication failed:', authResult.error)
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      )
    }

    const user = authResult.user
    console.log('✅ User authenticated:', user.email)

    // 获取用户订阅等级
    const userTier = user.subscription_plan === 'pro' ? 'pro' : 'free'
    console.log('📊 User tier:', userTier)

    const body = await request.json()
    const { prompt, model: requestedModel = 'deepseek-chat', conversationId } = body

    console.log('📝 Request details:', { prompt, requestedModel, conversationId, userId: user.id })

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // 全部使用分段生成模式，确保稳定性
    console.log('🎯 启用分段生成模式（全任务适用）');

    // 将所有提示都分割为多个部分（用于后面的生成逻辑）
    const segments = splitPromptIntoSegments(prompt);
    console.log(`📊 提示已分割为 ${segments.length} 个部分`);

    // 生成任务ID
    const taskId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 初始化生成状态
    const state: GenerationState = {
      taskId,
      status: 'streaming',
      streamedContent: '',
      progress: 0,
      lastActivity: Date.now(),
      mode: 'streaming'
    }
    generationStates.set(taskId, state)

    // 风险评估
    const isHighRisk = assessGenerationRisk(prompt, requestedModel)
    console.log(`📊 复杂度评估: ${prompt.length} 字符, 风险等级: ${isHighRisk ? '高' : '低'}`)

    if (isHighRisk) {
      console.log('🚨 高风险任务，直接切换到异步模式')

      // 异步处理高风险任务
      startAsyncFallback(taskId, prompt, requestedModel, process.env.DEEPSEEK_API_KEY!, process.env.DEEPSEEK_BASE_URL!, '', user)
        .then(project => {
          // 异步完成时更新状态
          const currentState = generationStates.get(taskId)
          if (currentState) {
            currentState.status = 'completed'
            currentState.progress = 100
          }
        })
        .catch(error => {
          console.error('异步生成失败:', error)
          const currentState = generationStates.get(taskId)
          if (currentState) {
            currentState.status = 'failed'
          }
        })

      // 返回异步模式切换信号
      return new Response(
        `data: ${JSON.stringify({
          type: 'mode_switch',
          mode: 'async',
          taskId,
          reason: 'high_complexity'
        })}\n\n` +
        `data: ${JSON.stringify({
          type: 'async_started',
          taskId,
          message: '复杂任务已切换到异步模式，请等待完成'
        })}\n\n` +
        `data: [DONE]\n\n`,
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        }
      )
    }

    // 低风险任务：使用智能流式生成
    console.log('🎯 低风险任务，使用智能流式生成模式')

    console.log('🔐 Step 3: Checking model permissions')

    console.log(`🔍 Checking model access: userTier=${userTier}, requestedModel=${requestedModel}`);

    // 验证用户是否有权限使用请求的模型
    if (!canUseModel(userTier, requestedModel)) {
      console.log(`❌ Access denied: ${requestedModel} requires higher tier than ${userTier}`);
      return NextResponse.json(
        { error: `Access denied: ${requestedModel} requires a higher subscription tier. Your tier: ${userTier}` },
        { status: 403 }
      )
    }

    // 获取模型配置
    const modelConfig = AVAILABLE_MODELS[requestedModel]
    if (!modelConfig) {
      console.log(`❌ Invalid model: ${requestedModel} not found in AVAILABLE_MODELS`);
      console.log(`📋 Available models:`, Object.keys(AVAILABLE_MODELS));
      return NextResponse.json(
        { error: `Invalid model: ${requestedModel}. Available models: ${Object.keys(AVAILABLE_MODELS).join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`✅ Model access granted: ${requestedModel} (provider: ${modelConfig.provider})`);
    console.log('🔑 Step 4: Setting up API configuration');

    // 根据模型提供商选择API配置
    let apiKey: string | undefined
    let baseUrl: string | undefined
    let model: string

    console.log(`🔧 Configuring API for provider: ${modelConfig.provider}`);

    switch (modelConfig.provider) {
      case 'dashscope':
        console.log('🎯 Using Alibaba Cloud DashScope (百炼) API');
        apiKey = process.env.DASHSCOPE_API_KEY
        baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
        model = requestedModel
        break
      case 'deepseek':
        console.log('🎯 Using DeepSeek API');
        apiKey = process.env.DEEPSEEK_API_KEY
        baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
        model = requestedModel
        break
      case 'openai':
        console.log('🎯 Using OpenAI API');
        apiKey = process.env.OPENAI_API_KEY
        baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
        model = requestedModel
        break
      case 'anthropic':
        console.log('🎯 Using Anthropic API');
        apiKey = process.env.ANTHROPIC_API_KEY
        baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
        model = requestedModel
        break
      case 'zhipu':
        console.log('🎯 Using Zhipu AI API');
        apiKey = process.env.GLM_API_KEY
        baseUrl = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/'
        model = process.env.GLM_MODEL || 'glm-4-6'
        break
      default:
        console.log(`❌ Unsupported provider: ${modelConfig.provider}`);
        return NextResponse.json(
          { error: `Unsupported model provider: ${modelConfig.provider}` },
          { status: 400 }
        )
    }

    console.log(`🔑 API config: key=${apiKey ? 'present' : 'missing'}, baseUrl=${baseUrl}, model=${model}`);

    console.log('🔐 Step 5: Checking API key configuration');

    if (!apiKey) {
      console.error(`❌ ${modelConfig.provider} API key is not configured`)
      return NextResponse.json(
        {
          error: `${modelConfig.provider} API key is not configured. Please set the appropriate API key in your environment variables.`,
          details: `Required environment variable: ${modelConfig.provider.toUpperCase()}_API_KEY`
        },
        { status: 400 }
      )
    }

    console.log(`✅ API key found for ${modelConfig.provider}`);

    // 检查API key是否正确配置
    const placeholderKeys = [
      'your_deepseek_api_key_here',
      'your_glm_api_key_here',
      'your_openai_api_key_here',
      'your_anthropic_api_key_here'
    ]

    if (placeholderKeys.includes(apiKey)) {
      console.error(`❌ ${modelConfig.provider} API key is using placeholder value`)
      return NextResponse.json(
        {
          error: `${modelConfig.provider} API key is using placeholder value. Please set the actual API key in your CloudBase environment variables.`,
          details: `Required environment variable: ${modelConfig.provider.toUpperCase()}_API_KEY (current value is a placeholder)`
        },
        { status: 400 }
      )
    }

    console.log(`✅ API key validation passed for ${modelConfig.provider}`);

    // Initialize OpenAI client with DeepSeek configuration
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    })

    console.log('🤖 Starting streaming AI generation...')

    // Record start time for performance tracking
    const startTime = performance.now()

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let controllerClosed = false

        const safeEnqueue = (data) => {
          if (!controllerClosed) {
            try {
              controller.enqueue(data)
            } catch (error) {
              console.error('Failed to enqueue data:', error)
              controllerClosed = true
            }
          }
        }

        const safeClose = () => {
          if (!controllerClosed) {
            try {
              controller.close()
              controllerClosed = true
            } catch (error) {
              console.error('Failed to close controller:', error)
            }
          }
        }
        try {
          const completion = await client.chat.completions.create({
            model: model,
            messages: [
              {
                role: 'system',
                content: `Generate a SIMPLE React app as JSON. Keep it minimal and easy to understand.

CRITICAL FILE REQUIREMENTS - MUST FOLLOW EXACTLY:
- You MUST generate EXACTLY 4 files, NO MORE, NO LESS:
  1. src/App.jsx (main component)
  2. src/index.css (styles)
  3. package.json (dependencies)
  4. README.md (documentation)
- DO NOT create ANY other files
- DO NOT create src/components/ directory
- DO NOT create src/utils/ directory
- DO NOT create any additional .jsx or .js files
- ALL component code MUST be in src/App.jsx only

CODE RULES - VERY IMPORTANT:
- Use pure JavaScript/JSX only, NO TypeScript
- NO type annotations (no : string, : number, : React.FC, etc.)
- NO interface or type definitions
- NO generics like useState<string>(), just use useState()
- ALL code in single App.jsx file - NO separate component files
- Use basic React hooks: useState, useEffect
- Keep component under 150 lines
- Simple inline styles with Tailwind CSS classes
- No complex patterns (no Context, Redux, custom hooks)
- Focus on clarity over features

Return JSON with EXACTLY these 4 files:
{"files":{"src/App.jsx":"...","src/index.css":"...","package.json":"...","README.md":"..."},"projectName":"my-app"}`
              },
              {
                role: 'user',
                content: prompt.trim()
              }
            ],
            max_tokens: Math.min(parseInt(process.env.DEEPSEEK_MAX_TOKENS || '8192'), 8192),
            temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
            stream: true, // Enable streaming
          })

          let streamedChars = 0
          let accumulatedContent = ''

          // 优化1: 添加心跳机制，防止代理中断连接
          const heartbeatInterval = setInterval(() => {
            try {
              safeEnqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`)
            } catch (error) {
              console.error('Failed to send heartbeat:', error)
            }
          }, 10000) // 每10秒发送心跳

          let charBuffer = ''
          const BATCH_SIZE = 5 // 减少批量大小，提高响应性

          // Process streaming chunks in real-time - optimized for production with smart fallback
          let fallbackTriggered = false

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              accumulatedContent += content

              // 更新生成状态
              state.streamedContent = accumulatedContent
              state.lastActivity = Date.now()
              state.progress = Math.min(90, (accumulatedContent.length / Math.max(prompt.length * 2, 500)) * 100)

              // 实时风险检测
              if (!fallbackTriggered && shouldFallback(state)) {
                console.log('🔄 检测到生成风险，切换到异步模式')
                fallbackTriggered = true
                state.status = 'fallback_async'
                state.mode = 'async'

                // 通知前端切换模式
                safeEnqueue(`data: ${JSON.stringify({
                  type: 'mode_switch',
                  mode: 'async',
                  taskId: state.taskId,
                  reason: 'runtime_risk_detected',
                  progress: state.progress
                })}\n\n`)

                // 启动异步后备处理
                startAsyncFallback(
                  state.taskId,
                  prompt,
                  requestedModel,
                  apiKey,
                  baseUrl,
                  accumulatedContent,
                  user
                ).catch(error => {
                  console.error('异步后备处理失败:', error)
                  safeEnqueue(`data: ${JSON.stringify({
                    type: 'error',
                    error: '异步处理失败',
                    details: error.message
                  })}\n\n`)
                })

                // 停止流式处理
                break
              }

              // 批量发送字符
              for (const char of content) {
                charBuffer += char
                streamedChars++

                if (charBuffer.length >= BATCH_SIZE) {
                  const batchData = {
                    type: 'chars',
                    chars: charBuffer,
                    totalLength: streamedChars,
                    progress: state.progress
                  }

                  safeEnqueue(`data: ${JSON.stringify(batchData)}\n\n`)
                  charBuffer = ''

                  // 减少延迟以提高响应性
                  await new Promise(resolve => setTimeout(resolve, 2))
                }
              }
            }
          }

          // 发送剩余的字符缓冲区
          if (charBuffer.length > 0) {
            const finalBatchData = {
              type: 'chars',
              chars: charBuffer,
              totalLength: streamedChars
            }
            safeEnqueue(`data: ${JSON.stringify(finalBatchData)}\n\n`)
          }

          // 清理心跳定时器
          clearInterval(heartbeatInterval)

          console.log('AI streaming completed, total characters streamed:', streamedChars)

          // Since we're streaming code directly, we need to format it for the final response
          let finalCode = accumulatedContent.trim()

          // Clean up the code - remove any markdown formatting if present
          const codeBlockRegex = /```(?:jsx?|typescript|js|react)?\s*([\s\S]*?)```/
          const match = finalCode.match(codeBlockRegex)
          if (match) {
            finalCode = match[1].trim()
          }

          // Format the code
          finalCode = formatCodeString(finalCode)

          // Ensure we have valid code
          if (!finalCode || finalCode.length < 50) {
            finalCode = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generated App</h1>
        <p className="text-gray-600 mb-4">
          Code generation completed successfully!
        </p>
      </div>
    </div>
  );
}

export default App;`
          }

          console.log('Final code formatted, length:', finalCode.length)

          // Send final complete response
          const finalData = {
            type: 'complete',
            project: {
              files: {
                'src/App.jsx': finalCode,
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
              projectName: 'streaming-app'
            }
          }

          safeEnqueue(`data: ${JSON.stringify(finalData)}\n\n`)
          safeEnqueue(`data: [DONE]\n\n`)
          safeClose()

          console.log('Streaming generation completed, processing final response...')

          // Process the final accumulated content
          let parsedResponse

          try {
            // Try to extract JSON from the accumulated content
            let jsonContent = accumulatedContent.trim()

            // Check if response contains markdown code blocks
            const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/
            const match = accumulatedContent.match(codeBlockRegex)
            if (match) {
              jsonContent = match[1].trim()
            }

            // Clean up any extra text before or after JSON
            const jsonStart = jsonContent.indexOf('{')
            let jsonEnd = jsonContent.lastIndexOf('}')

            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1)
            }

            parsedResponse = JSON.parse(jsonContent)

            // Format the code
            const appKey = parsedResponse.files['src/App.jsx'] ? 'src/App.jsx' :
                          parsedResponse.files['src/App.tsx'] ? 'src/App.tsx' : null
            if (parsedResponse.files && appKey) {
              const originalCode = parsedResponse.files[appKey]
              const formattedCode = formatCodeString(originalCode)
              parsedResponse.files[appKey] = formattedCode
            }

          } catch (parseError) {
            console.warn('JSON parsing failed in streaming response, using fallback')

            // Fallback: try to extract code from the accumulated content
            let extractedCode = accumulatedContent

            // Try to find React component code
            const codePatterns = [
              /```(?:jsx?|typescript|js|react)?\s*([\s\S]*?)```/,
              /(?:function|const)\s+App[\s\S]*?(?=```|$)/,
            ]

            for (const pattern of codePatterns) {
              const match = accumulatedContent?.match(pattern)
              if (match && match[1] && match[1].length > 100) {
                extractedCode = match[1].trim()
                break
              }
            }

            // Apply formatting
            extractedCode = formatCodeString(extractedCode)

            // Ensure we have at least a basic component
            if (!extractedCode || extractedCode.length < 50) {
              extractedCode = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generated App</h1>
        <p className="text-gray-600 mb-4">
          The AI generated streaming content, but the code structure was incomplete.
          This is a fallback component to ensure the app runs.
        </p>
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> The streaming generation may have been truncated.
            Try simplifying your request or try again.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;`
            }

            parsedResponse = {
              files: {
                'src/App.jsx': extractedCode,
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
              projectName: 'streaming-app'
            }
          }

          // 保存AI响应到对话（如果有conversationId）
          if (conversationId) {
            try {
              console.log('💾 Saving AI response to conversation:', conversationId)
              await saveMessageToConversation(conversationId, 'assistant', JSON.stringify(parsedResponse), user.id)
              console.log('✅ AI response saved to conversation')
            } catch (saveError) {
              console.error('❌ Failed to save AI response to conversation:', saveError)
              // 不影响代码生成，只记录错误
            }
          }

          // 记录代码生成使用（包括修改代码）
          try {
            // 计算生成的内容长度
            let generatedLength = 0
            if (parsedResponse.files) {
              Object.values(parsedResponse.files).forEach((fileContent: any) => {
                generatedLength += String(fileContent).length
              })
            }

            await recordRecommendationUsage(user.id, {
              model: requestedModel,
              prompt_length: prompt.length,
              generated_length: generatedLength,
              type: 'code_generation'
            })
            console.log('✅ 代码生成使用已记录')
          } catch (usageError) {
            console.error('❌ 记录使用失败:', usageError)
            // 不影响生成流程，继续返回结果
          }

          // Send final complete response
          const parsedFinalData = {
            type: 'complete',
            project: parsedResponse
          }

          safeEnqueue(`data: ${JSON.stringify(parsedFinalData)}\n\n`)
          safeEnqueue(`data: [DONE]\n\n`)
          safeClose()

          const totalTime = performance.now()
          console.log(`✅ Streaming request completed in ${(totalTime - startTime).toFixed(2)}ms`)

        } catch (error: any) {
          console.error('Error in streaming response:', error)
          
          // Handle specific error types
          let errorMessage = 'Failed to generate code'
          let errorDetails = ''
          
          if (error?.status === 402 || error?.response?.status === 402) {
            errorMessage = 'Insufficient API Balance'
            errorDetails = 'Your API account has insufficient balance. Please top up your account to continue using the service.'
          } else if (error?.status === 401 || error?.response?.status === 401) {
            errorMessage = 'Invalid API Key'
            errorDetails = 'The API key is invalid or expired. Please check your API configuration.'
          } else if (error?.status === 429 || error?.response?.status === 429) {
            errorMessage = 'Rate Limit Exceeded'
            errorDetails = 'Too many requests. Please wait a moment and try again.'
          } else if (error?.message) {
            errorMessage = error.message
            errorDetails = error.message
          }
          
          const errorData = {
            type: 'error',
            error: errorMessage,
            details: errorDetails,
            statusCode: error?.status || error?.response?.status || 500
          }
          safeEnqueue(`data: ${JSON.stringify(errorData)}\n\n`)
          safeEnqueue(`data: [DONE]\n\n`)
          safeClose()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('Error starting streaming generation:', error)
    return NextResponse.json(
      { error: 'Failed to start streaming generation' },
      { status: 500 }
    )
  }
}
