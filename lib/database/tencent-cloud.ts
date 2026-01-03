// lib/database/tencent-cloud.ts
// 腾讯云数据库配置和连接

import { Pool, Client, QueryResult } from 'pg'

// 腾讯云数据库配置接口
export interface TencentCloudDBConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean | object
  max?: number
  idleTimeoutMillis?: number
  connectionTimeoutMillis?: number
}

// 从环境变量获取腾讯云数据库配置
function getTencentCloudConfig(): TencentCloudDBConfig | null {
  const host = process.env.TENCENT_CLOUD_DB_HOST
  const port = parseInt(process.env.TENCENT_CLOUD_DB_PORT || '5432')
  const database = process.env.TENCENT_CLOUD_DB_NAME
  const username = process.env.TENCENT_CLOUD_DB_USER
  const password = process.env.TENCENT_CLOUD_DB_PASSWORD

  if (!host || !database || !username || !password) {
    console.warn('腾讯云数据库配置不完整')
    return null
  }

  return {
    host,
    port,
    database,
    username,
    password,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  }
}

// 数据库连接池
let pool: Pool | null = null

/**
 * 获取数据库连接池
 */
export function getPool(): Pool | null {
  if (!pool) {
    const config = getTencentCloudConfig()
    if (!config) {
      console.error('无法获取腾讯云数据库配置')
      return null
    }

    try {
      pool = new Pool(config)

      // 连接池事件监听
      pool.on('connect', (client) => {
        console.log('📊 腾讯云数据库连接已建立')
      })

      pool.on('error', (err) => {
        console.error('❌ 数据库连接池错误:', err)
      })

      pool.on('remove', (client) => {
        console.log('📊 数据库连接已移除')
      })

    } catch (error) {
      console.error('❌ 创建数据库连接池失败:', error)
      return null
    }
  }

  return pool
}

/**
 * 执行查询
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = getPool()
  if (!client) {
    throw new Error('数据库连接池不可用')
  }

  try {
    const result = await client.query<T>(text, params)
    return result
  } catch (error) {
    console.error('数据库查询错误:', error)
    throw error
  }
}

/**
 * 执行事务
 */
export async function transaction<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const pool = getPool()
  if (!pool) {
    throw new Error('数据库连接池不可用')
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * 测试数据库连接
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time')
    console.log('✅ 腾讯云数据库连接测试成功:', result.rows[0])
    return true
  } catch (error) {
    console.error('❌ 腾讯云数据库连接测试失败:', error)
    return false
  }
}

/**
 * 关闭数据库连接池
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log('📊 腾讯云数据库连接池已关闭')
  }
}

// 兼容Supabase风格的查询方法
export const tencentCloudDB = {
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          try {
            const result = await query(`SELECT ${columns} FROM ${table} WHERE ${column} = $1 LIMIT 1`, [value])
            return {
              data: result.rows[0] || null,
              error: null
            }
          } catch (error) {
            return {
              data: null,
              error
            }
          }
        }
      }),
      single: async () => {
        try {
          const result = await query(`SELECT ${columns} FROM ${table} LIMIT 1`)
          return {
            data: result.rows[0] || null,
            error: null
          }
        } catch (error) {
          return {
            data: null,
            error
          }
        }
      }
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          try {
            const keys = Object.keys(data)
            const values = Object.values(data)
            const placeholders = keys.map((_, i) => `$${i + 1}`)
            const result = await query(
              `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
              values
            )
            return {
              data: result.rows[0] || null,
              error: null
            }
          } catch (error) {
            return {
              data: null,
              error
            }
          }
        }
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          try {
            const keys = Object.keys(data)
            const values = Object.values(data)
            const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ')
            values.push(value) // 添加WHERE条件的值
            const result = await query(
              `UPDATE ${table} SET ${setClause} WHERE ${column} = $${values.length} RETURNING *`,
              values
            )
            return {
              data: result.rows[0] || null,
              error: null
            }
          } catch (error) {
            return {
              data: null,
              error
            }
          }
        }
      })
    }),
    upsert: (data: any) => ({
      single: async () => {
        try {
          const keys = Object.keys(data)
          const values = Object.values(data)
          const placeholders = keys.map((_, i) => `$${i + 1}`)
          const updates = keys.map(key => `${key} = EXCLUDED.${key}`).join(', ')
          const result = await query(
            `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (id) DO UPDATE SET ${updates} RETURNING *`,
            values
          )
          return {
            data: result.rows[0] || null,
            error: null
          }
        } catch (error) {
          return {
            data: null,
            error
          }
        }
      }
    })
  })
}

export default tencentCloudDB




