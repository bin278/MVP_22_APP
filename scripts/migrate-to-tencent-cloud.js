#!/usr/bin/env node

// scripts/migrate-to-tencent-cloud.js
// 从Supabase迁移数据到腾讯云数据库

const { Client: SupabaseClient } = require('pg');
const { Client: TencentClient } = require('pg');

async function migrateToTencentCloud() {
  console.log('🚀 开始从Supabase迁移数据到腾讯云...\n');

  // Supabase配置（源数据库）
  const supabaseConfig = {
    host: process.env.SUPABASE_DB_HOST,
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
    database: process.env.SUPABASE_DB_NAME,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  };

  // 腾讯云配置（目标数据库）
  const tencentConfig = {
    host: process.env.TENCENT_CLOUD_DB_HOST,
    port: parseInt(process.env.TENCENT_CLOUD_DB_PORT || '5432'),
    database: process.env.TENCENT_CLOUD_DB_NAME,
    user: process.env.TENCENT_CLOUD_DB_USER,
    password: process.env.TENCENT_CLOUD_DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };

  let supabaseClient = null;
  let tencentClient = null;

  try {
    // 连接源数据库（Supabase）
    console.log('📊 连接到Supabase数据库...');
    supabaseClient = new SupabaseClient(supabaseConfig);
    await supabaseClient.connect();
    console.log('✅ Supabase连接成功');

    // 连接目标数据库（腾讯云）
    console.log('📊 连接到腾讯云数据库...');
    tencentClient = new TencentClient(tencentConfig);
    await tencentClient.connect();
    console.log('✅ 腾讯云连接成功\n');

    // 开始事务
    await tencentClient.query('BEGIN');

    // 迁移支付数据
    console.log('💳 迁移支付数据...');
    const paymentsResult = await supabaseClient.query(`
      SELECT
        id, user_id, amount, currency, status, payment_method,
        transaction_id, created_at, updated_at, completed_at,
        metadata
      FROM payments
      ORDER BY created_at ASC
    `);

    if (paymentsResult.rows.length > 0) {
      console.log(`   发现 ${paymentsResult.rows.length} 条支付记录`);

      for (const payment of paymentsResult.rows) {
        await tencentClient.query(`
          INSERT INTO payments (
            id, user_id, amount, currency, status, payment_method,
            transaction_id, created_at, updated_at, completed_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `, [
          payment.id,
          payment.user_id,
          payment.amount,
          payment.currency,
          payment.status,
          payment.payment_method,
          payment.transaction_id,
          payment.created_at,
          payment.updated_at,
          payment.completed_at,
          JSON.stringify(payment.metadata)
        ]);
      }

      console.log('✅ 支付数据迁移完成');
    } else {
      console.log('ℹ️ 没有找到支付数据');
    }

    // 迁移用户订阅数据
    console.log('👤 迁移用户订阅数据...');
    const subscriptionsResult = await supabaseClient.query(`
      SELECT
        id, user_id, tier, status, current_period_start,
        current_period_end, payment_method, created_at, updated_at
      FROM user_subscriptions
      ORDER BY created_at ASC
    `);

    if (subscriptionsResult.rows.length > 0) {
      console.log(`   发现 ${subscriptionsResult.rows.length} 条订阅记录`);

      for (const subscription of subscriptionsResult.rows) {
        await tencentClient.query(`
          INSERT INTO user_subscriptions (
            id, user_id, tier, status, current_period_start,
            current_period_end, payment_method, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (user_id) DO UPDATE SET
            tier = EXCLUDED.tier,
            status = EXCLUDED.status,
            current_period_start = EXCLUDED.current_period_start,
            current_period_end = EXCLUDED.current_period_end,
            payment_method = EXCLUDED.payment_method,
            updated_at = EXCLUDED.updated_at
        `, [
          subscription.id,
          subscription.user_id,
          subscription.tier,
          subscription.status,
          subscription.current_period_start,
          subscription.current_period_end,
          subscription.payment_method,
          subscription.created_at,
          subscription.updated_at
        ]);
      }

      console.log('✅ 用户订阅数据迁移完成');
    } else {
      console.log('ℹ️ 没有找到用户订阅数据');
    }

    // 提交事务
    await tencentClient.query('COMMIT');
    console.log('\n✅ 数据迁移完成！');

    // 验证迁移结果
    console.log('🔍 验证迁移结果...');
    const migratedPayments = await tencentClient.query('SELECT COUNT(*) as count FROM payments');
    const migratedSubscriptions = await tencentClient.query('SELECT COUNT(*) as count FROM user_subscriptions');

    console.log(`   支付记录: ${migratedPayments.rows[0].count}`);
    console.log(`   订阅记录: ${migratedSubscriptions.rows[0].count}`);

    console.log('\n🎉 数据迁移成功完成！');
    console.log('📖 接下来：');
    console.log('   1. 更新环境变量 DATABASE_PROVIDER=tencent-cloud');
    console.log('   2. 重启应用服务器');
    console.log('   3. 测试支付功能');
    console.log('   4. 验证数据完整性');

  } catch (error) {
    // 回滚事务
    if (tencentClient) {
      try {
        await tencentClient.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ 事务回滚失败:', rollbackError);
      }
    }

    console.error('❌ 数据迁移失败:', error);
    process.exit(1);
  } finally {
    // 关闭连接
    if (supabaseClient) {
      await supabaseClient.end();
    }
    if (tencentClient) {
      await tencentClient.end();
    }
  }
}

// 运行迁移脚本
if (require.main === module) {
  migrateToTencentCloud().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { migrateToTencentCloud };




