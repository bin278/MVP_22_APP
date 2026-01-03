import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug generate request received')

    // 获取请求头
    const headers = Object.fromEntries(request.headers.entries())
    console.log('📋 Request headers:', headers)

    // 获取请求体
    const body = await request.json()
    console.log('📝 Request body:', {
      body,
      promptLength: body.prompt?.length,
      model: body.model,
      promptType: typeof body.prompt,
      promptTrimmed: body.prompt?.trim?.(),
      promptTrimmedLength: body.prompt?.trim?.().length
    })

    // 检查环境变量
    const envCheck = {
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '✅' : '❌',
      GLM_API_KEY: process.env.GLM_API_KEY ? '✅' : '❌',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅' : '❌',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅' : '❌',
      JWT_SECRET: process.env.JWT_SECRET ? '✅' : '❌'
    }
    console.log('🔑 Environment variables:', envCheck)

    // 检查认证
    const authHeader = request.headers.get('authorization')
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing')

    // 模拟验证逻辑
    const validationResults = {
      hasPrompt: !!body.prompt,
      promptIsString: typeof body.prompt === 'string',
      promptNotEmpty: body.prompt?.trim?.().length > 0,
      hasModel: !!body.model,
      modelIsString: typeof body.model === 'string'
    }
    console.log('✅ Validation results:', validationResults)

    // 检查所有条件
    const allValid = validationResults.hasPrompt &&
                     validationResults.promptIsString &&
                     validationResults.promptNotEmpty &&
                     validationResults.hasModel &&
                     validationResults.modelIsString

    console.log('🎯 All validation passed:', allValid)

    if (!allValid) {
      console.log('❌ Validation failed, returning 400')
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationResults,
        receivedBody: body
      }, { status: 400 })
    }

    console.log('✅ Validation passed, request is valid')
    return NextResponse.json({
      success: true,
      message: 'Request validation passed',
      details: validationResults,
      envCheck,
      receivedBody: body
    })

  } catch (error) {
    console.error('💥 Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}










