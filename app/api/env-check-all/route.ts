import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    // 腾讯云环境
    TENCENT_CLOUD_ENV_ID: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID ? '✅' : '❌',

    // 应用配置
    APP_URL: process.env.NEXT_PUBLIC_APP_URL ? '✅' : '❌',

    // 微信配置
    WECHAT_APP_ID: process.env.WECHAT_APP_ID ? '✅' : '❌',
    WECHAT_APP_SECRET: process.env.WECHAT_APP_SECRET ? '✅' : '❌',

    // JWT配置
    JWT_SECRET: process.env.JWT_SECRET ? '✅' : '❌',

    // AI API配置
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '✅' : '❌',
    GLM_API_KEY: process.env.GLM_API_KEY ? '✅' : '❌',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅' : '❌',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅' : '❌',

    // 支付配置
    WECHAT_PAY_APPID: process.env.WECHAT_PAY_APPID ? '✅' : '❌',
    ALIPAY_APP_ID: process.env.ALIPAY_APP_ID ? '✅' : '❌',

    // 数据库配置
    CLOUDBASE_ENV_ID: process.env.CLOUDBASE_ENV_ID ? '✅' : '❌',
  }

  // 检查是否有未配置的关键变量
  const missingCritical = []
  const placeholderChecks = [
    { key: 'DEEPSEEK_API_KEY', placeholder: 'your_deepseek_api_key_here' },
    { key: 'GLM_API_KEY', placeholder: 'your_glm_api_key_here' },
    { key: 'OPENAI_API_KEY', placeholder: 'your_openai_api_key_here' },
    { key: 'ANTHROPIC_API_KEY', placeholder: 'your_anthropic_api_key_here' },
  ]

  placeholderChecks.forEach(({ key, placeholder }) => {
    if (!process.env[key] || process.env[key] === placeholder) {
      missingCritical.push(key)
    }
  })

  if (!process.env.JWT_SECRET) {
    missingCritical.push('JWT_SECRET')
  }

  // 检查API key是否有效（不只是检查是否存在）
  const apiKeyValidation = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here' && process.env.DEEPSEEK_API_KEY.length > 10,
    GLM_API_KEY: process.env.GLM_API_KEY && process.env.GLM_API_KEY !== 'your_glm_api_key_here' && process.env.GLM_API_KEY.length > 10,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' && process.env.OPENAI_API_KEY.startsWith('sk-'),
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here' && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-'),
  }

  return NextResponse.json({
    success: true,
    message: 'Environment variables comprehensive check',
    checks,
    apiKeyValidation,
    missingCritical,
    recommendations: missingCritical.length > 0 ? [
      '请在腾讯云CloudBase控制台的环境变量中设置以下变量：',
      ...missingCritical.map(key => `- ${key}`)
    ] : ['所有关键环境变量已正确配置'],
    cloudbaseSetupGuide: {
      title: 'CloudBase 环境变量设置指南',
      steps: [
        '1. 登录腾讯云CloudBase控制台',
        '2. 进入你的环境 -> 云托管 -> 环境变量',
        '3. 添加以下变量：',
        '   - DEEPSEEK_API_KEY=你的DeepSeek API密钥',
        '   - GLM_API_KEY=你的智谱AI API密钥',
        '   - JWT_SECRET=随机生成的JWT密钥',
        '   - WECHAT_APP_ID=微信应用ID（如果需要微信登录）',
        '   - NEXT_PUBLIC_APP_URL=https://你的域名',
        '4. 保存并重新部署应用'
      ]
    },
    timestamp: new Date().toISOString()
  })
}










