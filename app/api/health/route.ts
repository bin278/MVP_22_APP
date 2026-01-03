import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 基础健康检查
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.DEPLOYMENT_REGION || 'unknown',

      // CloudBase 连接状态
      cloudbase: {
        envId: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID ? 'configured' : 'not_configured',
        authProvider: process.env.AUTH_PROVIDER || 'unknown',
        databaseProvider: process.env.DATABASE_PROVIDER || 'unknown'
      },

      // 支付功能状态
      payment: {
        wechat: process.env.WECHAT_PAY_APPID ? 'configured' : 'not_configured',
        alipay: process.env.ALIPAY_APP_ID ? 'configured' : 'not_configured',
        testMode: process.env.PAYMENT_TEST_MODE === 'true'
      }
    }

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  }
}

