/**
 * 客户端环境变量获取工具
 * 在腾讯云CloudBase部署时，通过 API 获取环境变量而不是直接访问 process.env
 */

interface PublicEnv {
  // 应用配置
  NEXT_PUBLIC_APP_URL?: string
  NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID?: string
  WECHAT_APP_ID?: string

  // Supabase 配置
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string

  // Stripe 配置
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string

  // 部署环境信息
  DEPLOYMENT_REGION?: string
  NODE_ENV?: string
}

let envCache: PublicEnv | null = null
let envPromise: Promise<PublicEnv> | null = null

/**
 * 从 API 获取环境变量
 */
async function fetchEnvFromAPI(): Promise<PublicEnv> {
  console.log('🌐 Fetching environment variables from /api/env')
  try {
    const response = await fetch('/api/env', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 不使用缓存，确保获取最新的环境变量
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch env: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    console.log('📡 /api/env response:', {
      success: data.success,
      hasEnv: !!data.env,
      error: data.error,
      status: response.status
    })

    if (!data.success) {
      console.warn('⚠️ /api/env returned success: false, using fallback values:', data.error)
      // 不抛出错误，而是使用 fallback
    } else {
      console.log('✅ /api/env returned valid data')
      return data.env as PublicEnv
    }
  } catch (error) {
    console.error('Failed to fetch environment variables from API:', error)
    // 如果 API 失败，使用开发环境回退值
  }

  // 使用 fallback 值
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || '',
    WECHAT_APP_ID: process.env.WECHAT_APP_ID || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || 'cn',
    NODE_ENV: process.env.NODE_ENV || 'development',
  }
}

/**
 * 获取环境变量（带缓存）
 * 首次调用会从 API 获取，后续调用直接返回缓存
 */
export async function getPublicEnv(): Promise<PublicEnv> {
  // 如果已有缓存，直接返回
  if (envCache) {
    return envCache
  }

  // 如果正在请求中，等待该请求完成
  if (envPromise) {
    return envPromise
  }

  // 创建新的请求
  envPromise = fetchEnvFromAPI()
  envCache = await envPromise
  envPromise = null

  return envCache
}

/**
 * 同步获取环境变量（仅在客户端使用）
 * 注意：此方法需要在组件挂载后调用，确保 envCache 已初始化
 */
export function getPublicEnvSync(): PublicEnv {
  if (!envCache) {
    // 如果缓存未初始化，返回开发环境默认值
    console.warn('Environment variables not initialized. Call getPublicEnv() first.')
    return {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: '',
      WECHAT_APP_ID: '',
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
      DEPLOYMENT_REGION: 'cn',
      NODE_ENV: 'development',
    }
  }
  return envCache
}

/**
 * 清除环境变量缓存（用于测试或强制刷新）
 */
export function clearEnvCache(): void {
  envCache = null
  envPromise = null
  console.log('🗑️ 环境变量缓存已清除')
}

/**
 * 在开发环境中，每次页面加载时自动清除缓存
 * 确保环境变量更改能够生效
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 开发模式下不长期缓存，每次重新获取
  const originalGetEnv = getPublicEnv
  let callCount = 0
  getPublicEnv = async function() {
    callCount++
    if (callCount > 1) {
      console.log('🔄 开发模式：重新获取环境变量')
      clearEnvCache()
    }
    return originalGetEnv()
  } as any
}






