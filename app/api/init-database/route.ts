// app/api/init-database/route.ts
// 数据库初始化 API - 创建必要的集合

import { NextResponse } from 'next/server'
import { add, query } from '@/lib/database'

/**
 * POST /api/init-database
 * 初始化数据库集合（仅用于开发环境）
 */
export async function POST(request: Request) {
  // 安全检查：仅允许在开发环境使用
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: '此 API 仅用于开发环境' },
      { status: 403 }
    )
  }

  try {
    console.log('🔧 开始初始化 CloudBase 集合...')

    const collections = [
      'generation_tasks',
      'conversation_files',
      'conversations',
      'payments',
      'subscriptions',
      'usage_records'
    ]

    const results: any[] = []

    for (const collectionName of collections) {
      try {
        // 尝试查询集合（检查是否存在）
        const checkResult = await query(collectionName, { limit: 1 })

        if (checkResult.data && checkResult.data.length > 0) {
          console.log(`✅ 集合 ${collectionName} 已存在，有 ${checkResult.data.length} 条数据`)
          results.push({
            collection: collectionName,
            status: 'exists',
            count: checkResult.data.length
          })
        } else {
          console.log(`✅ 集合 ${collectionName} 已存在（空）`)
          results.push({
            collection: collectionName,
            status: 'exists_empty',
            count: 0
          })
        }
      } catch (error: any) {
        if (error.message && error.message.includes('DATABASE_COLLECTION_NOT_EXIST')) {
          // 集合不存在，创建一个临时文档来初始化集合
          try {
            console.log(`📝 创建集合 ${collectionName}...`)
            await add(collectionName, {
              _temp: true,
              createdAt: new Date().toISOString(),
              description: '临时初始化文档，可安全删除'
            })
            console.log(`✅ 集合 ${collectionName} 创建成功`)
            results.push({
              collection: collectionName,
              status: 'created',
              message: '集合创建成功'
            })
          } catch (createError: any) {
            console.error(`❌ 创建集合 ${collectionName} 失败:`, createError.message)
            results.push({
              collection: collectionName,
              status: 'error',
              error: createError.message
            })
          }
        } else {
          console.error(`❌ 检查集合 ${collectionName} 时出错:`, error.message)
          results.push({
            collection: collectionName,
            status: 'error',
            error: error.message
          })
        }
      }
    }

    console.log('✅ CloudBase 集合初始化完成')

    return NextResponse.json({
      success: true,
      message: '数据库初始化完成',
      results
    })

  } catch (error: any) {
    console.error('❌ 数据库初始化失败:', error)
    return NextResponse.json(
      {
        error: '数据库初始化失败',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/init-database
 * 查询数据库状态
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: '此 API 仅用于开发环境' },
      { status: 403 }
    )
  }

  try {
    const collections = [
      'generation_tasks',
      'conversation_files',
      'conversations',
      'payments',
      'subscriptions',
      'usage_records'
    ]

    const results: any[] = []

    for (const collectionName of collections) {
      try {
        const result = await query(collectionName, { limit: 1 })
        results.push({
          collection: collectionName,
          status: 'exists',
          hasData: result.data && result.data.length > 0
        })
      } catch (error: any) {
        if (error.message && error.message.includes('DATABASE_COLLECTION_NOT_EXIST')) {
          results.push({
            collection: collectionName,
            status: 'not_exists'
          })
        } else {
          results.push({
            collection: collectionName,
            status: 'error',
            error: error.message
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    return NextResponse.json(
      {
        error: '查询数据库状态失败',
        details: error.message
      },
      { status: 500 }
    )
  }
}
