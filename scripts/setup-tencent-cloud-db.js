#!/usr/bin/env node

// scripts/setup-tencent-cloud-db.js
// 腾讯云数据库初始化脚本

const { Client } = require('pg');

async function setupTencentCloudDatabase() {
  console.log('🚀 开始设置腾讯云数据库...\n');

  // 从环境变量获取数据库配置
  const config = {
    host: process.env.TENCENT_CLOUD_DB_HOST,
    port: parseInt(process.env.TENCENT_CLOUD_DB_PORT || '5432'),
    database: process.env.TENCENT_CLOUD_DB_NAME,
    user: process.env.TENCENT_CLOUD_DB_USER,
    password: process.env.TENCENT_CLOUD_DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };

  // 验证配置
  const requiredFields = ['host', 'database', 'user', 'password'];
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    console.error('❌ 缺少必要的环境变量:');
    missingFields.forEach(field => {
      const envVar = `TENCENT_CLOUD_DB_${field.toUpperCase()}`;
      console.error(`   - ${envVar}`);
    });
    console.error('\n请参考 TENCENT_CLOUD_DB_SETUP.md 配置环境变量\n');
    process.exit(1);
  }

  const client = new Client(config);

  try {
    console.log('📊 连接到腾讯云数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功\n');

    // 创建支付表
    console.log('📋 创建支付表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'CNY',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payment_method VARCHAR(20) NOT NULL,
        transaction_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB
      );
    `);

    // 创建用户订阅表
    console.log('👤 创建用户订阅表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        tier VARCHAR(20) NOT NULL DEFAULT 'free',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        current_period_start TIMESTAMP WITH TIME ZONE,
        current_period_end TIMESTAMP WITH TIME ZONE,
        payment_method VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 创建索引
    console.log('🔍 创建数据库索引...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
    `);

    // 验证表创建成功
    console.log('✅ 验证表创建...');
    const paymentsResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('payments', 'user_subscriptions')
    `);

    const createdTables = paymentsResult.rows.map(row => row.table_name);
    console.log('📋 已创建的表:', createdTables.join(', '));

    if (createdTables.includes('payments') && createdTables.includes('user_subscriptions')) {
      console.log('✅ 所有表创建成功\n');
    } else {
      console.warn('⚠️ 部分表可能未创建成功\n');
    }

    // 测试数据插入（可选）
    console.log('🧪 插入测试数据...');
    try {
      await client.query(`
        INSERT INTO payments (user_id, amount, currency, status, payment_method, transaction_id)
        VALUES ('test_user', 0.01, 'CNY', 'completed', 'alipay', 'test_txn_001')
        ON CONFLICT DO NOTHING;
      `);

      await client.query(`
        INSERT INTO user_subscriptions (user_id, tier, status)
        VALUES ('test_user', 'free', 'active')
        ON CONFLICT (user_id) DO NOTHING;
      `);

      console.log('✅ 测试数据插入成功');
    } catch (error) {
      console.log('⚠️ 测试数据插入失败（可能已存在）:', error.message);
    }

    console.log('\n🎉 腾讯云数据库设置完成！');
    console.log('📖 接下来：');
    console.log('   1. 更新环境变量 DATABASE_PROVIDER=tencent-cloud');
    console.log('   2. 重启应用服务器');
    console.log('   3. 测试支付功能');

  } catch (error) {
    console.error('❌ 数据库设置失败:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 运行设置脚本
if (require.main === module) {
  setupTencentCloudDatabase().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { setupTencentCloudDatabase };




