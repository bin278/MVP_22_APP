import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {
      // API Keys
      deepseek: {
        configured: !!process.env.DEEPSEEK_API_KEY,
        prefix: process.env.DEEPSEEK_API_KEY?.substring(0, 10) + '...',
      },
      cloudbase: {
        envId: process.env.TCB_ENV_ID || 'not set',
        configured: !!process.env.TCB_ENV_ID,
      },

      // Database
      database: {
        url: process.env.DATABASE_URL ? 'configured' : 'not set',
        postgres: !!process.env.POSTGRES_URL,
      },

      // OAuth
      github: {
        clientId: process.env.GITHUB_CLIENT_ID ? 'configured' : 'not set',
      },
      wechat: {
        appId: process.env.WECHAT_APP_ID ? 'configured' : 'not set',
      },
    },

    // Headers
    headers: {
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin'),
    },

    // All env vars (sanitized)
    allEnvVars: Object.keys(process.env)
      .filter(key => !key.includes('SECRET') && !key.includes('PRIVATE') && !key.includes('PASSWORD'))
      .reduce((acc, key) => {
        const value = process.env[key]
        if (value && typeof value === 'string' && value.length > 50) {
          acc[key] = value.substring(0, 20) + '...'
        } else {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, any>),
  }

  return NextResponse.json(checks)
}
