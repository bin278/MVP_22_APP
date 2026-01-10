// scripts/init-database.ts
// 数据库初始化脚本 - 创建必要的集合和表

import { add, query } from '../lib/database'

/**
 * 初始化 CloudBase 集合
 * CloudBase 会在第一次 add 时自动创建集合，但我们需要确保集合存在
 */
async function initCloudBaseCollections() {
  console.log('🔧 开始初始化 CloudBase 集合...')

  const collections = [
    'generation_tasks',
    'conversation_files',
    'conversations',
    'payments',
    'subscriptions',
    'usage_records'
  ]

  for (const collectionName of collections) {
    try {
      // 尝试查询集合（检查是否存在）
      await query(collectionName, { limit: 1 })
      console.log(`✅ 集合 ${collectionName} 已存在`)
    } catch (error: any) {
      if (error.message && error.message.includes('DATABASE_COLLECTION_NOT_EXIST')) {
        // 集合不存在，创建一个临时文档来初始化集合
        try {
          console.log(`📝 创建集合 ${collectionName}...`)
          await add(collectionName, {
            _temp: true,
            createdAt: new Date().toISOString(),
            description: '临时初始化文档'
          })
          console.log(`✅ 集合 ${collectionName} 创建成功`)
        } catch (createError: any) {
          console.error(`❌ 创建集合 ${collectionName} 失败:`, createError.message)
        }
      } else {
        console.error(`❌ 检查集合 ${collectionName} 时出错:`, error.message)
      }
    }
  }

  console.log('✅ CloudBase 集合初始化完成')
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始数据库初始化...\n')

  try {
    // 获取当前数据库提供商
    const { getDatabaseProvider } = await import('../lib/database')
    const provider = getDatabaseProvider()
    console.log(`📊 当前数据库提供商: ${provider}\n`)

    if (provider === 'cloudbase') {
      await initCloudBaseCollections()
    } else if (provider === 'supabase') {
      console.log('⚠️  Supabase 需要通过 SQL 迁移文件创建表，请运行迁移脚本')
      console.log('   迁移文件位置: supabase/migrations/')
    } else if (provider === 'tencent-cloud') {
      console.log('⚠️  腾讯云 PostgreSQL 需要通过 SQL 脚本创建表')
    }

    console.log('\n✅ 数据库初始化完成')
    process.exit(0)
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    process.exit(1)
  }
}

// 运行脚本
main()
