import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getPublicEnvSync, getPublicEnv } from './env-client'

// 服务器端：直接使用 process.env
// 客户端：优先使用 API 获取的环境变量
function getSupabaseConfig() {
  // 服务器端直接使用 process.env
  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    }
  }

  // 客户端使用同步方法（需要先调用 getPublicEnv 初始化）
  const env = getPublicEnvSync()
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

const config = getSupabaseConfig()

// Only create Supabase client if both URL and key are available
export const supabase = config.url && config.anonKey
  ? createClient(config.url, config.anonKey)
  : null

/**
 * 异步创建 Supabase 客户端（客户端使用）
 * 从 API 获取环境变量后创建客户端
 */
export async function createSupabaseClient(): Promise<SupabaseClient | null> {
  // 服务器端直接使用同步方式
  if (typeof window === 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && anonKey ? createClient(url, anonKey) : null
  }

  // 客户端从 API 获取
  try {
    const env = await getPublicEnv()
    if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    }
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
  }

  return null
}

// For server-side operations (API routes)
// Only create admin client if service role key is available
let supabaseAdmin: ReturnType<typeof createClient> | null = null

if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
}

export { supabaseAdmin }




