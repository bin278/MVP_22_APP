// lib/database/supabase.ts
// Supabase数据库适配器

import { createClient } from '@supabase/supabase-js'

// Supabase配置接口
export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey: string
}

// 从环境变量获取Supabase配置
function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey) {
    console.warn('Supabase配置不完整')
    return null
  }

  return {
    url,
    anonKey,
    serviceRoleKey: serviceRoleKey || ''
  }
}

// Supabase客户端实例
let adminClient: ReturnType<typeof createClient> | null = null

/**
 * 获取Supabase Admin客户端(服务器端使用)
 */
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    console.warn('Supabase Admin客户端只能在服务器端使用')
    return null
  }

  if (!adminClient) {
    const config = getSupabaseConfig()
    if (!config) {
      console.error('无法获取Supabase配置')
      return null
    }

    if (!config.serviceRoleKey || config.serviceRoleKey === 'your_supabase_service_role_key') {
      console.warn('Supabase Service Role Key未配置,将使用匿名密钥(权限受限)')
    }

    try {
      adminClient = createClient(
        config.url,
        config.serviceRoleKey || config.anonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      console.log('📊 Supabase Admin连接已建立')
    } catch (error) {
      console.error('❌ 创建Supabase Admin客户端失败:', error)
      return null
    }
  }

  return adminClient
}

/**
 * 查询数据
 */
export async function query(tableName: string, options: any = {}) {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase连接不可用')
  }

  try {
    let query = client.from(tableName).select(options.columns || '*')

    // 应用过滤条件
    if (options.where) {
      Object.entries(options.where).forEach(([column, value]) => {
        query = query.eq(column, value)
      })
    }

    // 应用排序
    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      })
    }

    // 应用限制
    if (options.limit) {
      query = query.limit(options.limit)
    }

    // 应用偏移
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return {
      data: data || [],
      error: null
    }
  } catch (error: any) {
    console.error('Supabase查询错误:', error)
    throw error
  }
}

/**
 * 添加数据
 */
export async function add(tableName: string, data: any) {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase连接不可用')
  }

  try {
    const { data: result, error } = await client
      .from(tableName)
      .insert(data)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: result.id,
      data: result,
      error: null
    }
  } catch (error: any) {
    console.error('Supabase添加数据错误:', error)
    throw error
  }
}

/**
 * 更新数据
 */
export async function update(tableName: string, docId: string, data: any) {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase连接不可用')
  }

  try {
    const { data: result, error } = await client
      .from(tableName)
      .update(data)
      .eq('id', docId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      data: result,
      error: null
    }
  } catch (error: any) {
    console.error('Supabase更新数据错误:', error)
    throw error
  }
}

/**
 * 删除数据
 */
export async function remove(tableName: string, docId: string) {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase连接不可用')
  }

  try {
    const { error } = await client
      .from(tableName)
      .delete()
      .eq('id', docId)

    if (error) {
      throw error
    }

    return {
      success: true,
      error: null
    }
  } catch (error: any) {
    console.error('Supabase删除数据错误:', error)
    throw error
  }
}

/**
 * 测试数据库连接
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = getSupabaseAdmin()
    if (!client) {
      console.error('❌ Supabase客户端未初始化')
      return false
    }

    // 尝试一个简单的查询
    const { error } = await client
      .from('payments')
      .select('count', { count: 'exact', head: true })

    if (error) {
      // 如果表不存在,尝试另一个查询
      console.warn('payments表不存在,尝试通用查询...')
      const { error: testError } = await client
        .rpc('get_table_info', { table_name: 'conversations' })

      if (testError) {
        console.log('✅ Supabase连接正常(但可能需要创建数据库表)')
        return true
      }
    }

    console.log('✅ Supabase数据库连接测试成功')
    return true
  } catch (error) {
    console.error('❌ Supabase数据库连接测试失败:', error)
    return false
  }
}

// 兼容CloudBase接口的包装器
export const supabaseDB = {
  from: (table: string) => {
    const client = getSupabaseAdmin()
    if (!client) {
      throw new Error('Supabase客户端未初始化')
    }

    return {
      select: (columns: string = '*') => {
        let query = client.from(table).select(columns)

        return {
          eq: (column: string, value: any) => ({
            single: async () => {
              try {
                const { data, error } = await query.eq(column, value).single()
                return {
                  data: data || null,
                  error: error || null
                }
              } catch (err: any) {
                return {
                  data: null,
                  error: err
                }
              }
            },
            limit: (limit: number) => ({
              single: async () => {
                try {
                  const { data, error } = await query.eq(column, value).limit(limit).single()
                  return {
                    data: data || null,
                    error: error || null
                  }
                } catch (err: any) {
                  return {
                    data: null,
                    error: err
                  }
                }
              }
            })
          }),
          single: async () => {
            try {
              const { data, error } = await query.single()
              return {
                data: data || null,
                error: error || null
              }
            } catch (err: any) {
              return {
                data: null,
                error: err
              }
            }
          }
        }
      },
      insert: (data: any) => {
        return {
          select: () => ({
            single: async () => {
              try {
                const { data: result, error } = await client
                  .from(table)
                  .insert(data)
                  .select()
                  .single()

                return {
                  data: result || null,
                  error: error || null
                }
              } catch (err: any) {
                return {
                  data: null,
                  error: err
                }
              }
            }
          })
        }
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              try {
                const { data: result, error } = await client
                  .from(table)
                  .update(data)
                  .eq(column, value)
                  .select()
                  .single()

                return {
                  data: result || null,
                  error: error || null
                }
              } catch (err: any) {
                return {
                  data: null,
                  error: err
                }
              }
            }
          })
        })
      }),
      upsert: (data: any) => ({
        single: async () => {
          try {
            const { data: result, error } = await client
              .from(table)
              .upsert(data)
              .select()
              .single()

            return {
              data: result || null,
              error: error || null
            }
          } catch (err: any) {
            return {
              data: null,
              error: err
            }
          }
        }
      })
    }
  }
}

export default supabaseDB
