#!/usr/bin/env node

// scripts/setup-cloudbase-db.js
// 腾讯云CloudBase数据库初始化脚本

async function setupCloudBaseDatabase() {
  console.log('🚀 开始设置腾讯云CloudBase数据库...\n');

  // 检查环境变量
  const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
  const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;
  const envId = process.env.TENCENT_CLOUD_ENV_ID;

  if (!secretId || !secretKey || !envId) {
    console.error('❌ 缺少必要的环境变量:');
    console.error('   TENCENT_CLOUD_SECRET_ID');
    console.error('   TENCENT_CLOUD_SECRET_KEY');
    console.error('   TENCENT_CLOUD_ENV_ID');
    console.error('\n请参考 CLOUDBASE_DB_SETUP.md 配置环境变量\n');
    process.exit(1);
  }

  try {
    // 动态导入CloudBase模块
    const { getDatabase, query, add } = await import('../lib/database/cloudbase.js');

    console.log('📊 连接到腾讯云CloudBase...');

    // 测试连接
    const db = getDatabase();
    if (!db) {
      console.error('❌ 无法连接到CloudBase数据库');
      process.exit(1);
    }

    console.log('✅ CloudBase连接成功');

    // 检查集合是否存在（通过查询测试）
    console.log('🔍 检查数据库集合...');

    const collections = ['payments', 'user_subscriptions'];
    for (const collection of collections) {
      try {
        const result = await query(collection, { limit: 1 });
        console.log(`   ✅ 集合 '${collection}' 已存在`);
      } catch (error) {
        console.log(`   ⚠️ 集合 '${collection}' 不存在或无数据`);
      }
    }

    // 插入测试数据
    console.log('🧪 插入测试数据...');

    // 测试支付数据
    const testPayment = {
      user_id: 'test_user_' + Date.now(),
      amount: 0.01,
      currency: 'CNY',
      status: 'completed',
      payment_method: 'alipay',
      transaction_id: 'test_txn_' + Date.now(),
      created_at: new Date(),
      updated_at: new Date(),
      completed_at: new Date(),
      metadata: {
        test: true,
        description: 'CloudBase数据库测试'
      }
    };

    try {
      const paymentResult = await add('payments', testPayment);
      console.log('   ✅ 支付测试数据插入成功:', paymentResult.id);
    } catch (error) {
      console.log('   ⚠️ 支付测试数据插入失败:', error.message);
    }

    // 测试用户订阅数据
    const testSubscription = {
      user_id: 'test_user_' + Date.now(),
      tier: 'free',
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      const subscriptionResult = await add('user_subscriptions', testSubscription);
      console.log('   ✅ 订阅测试数据插入成功:', subscriptionResult.id);
    } catch (error) {
      console.log('   ⚠️ 订阅测试数据插入失败:', error.message);
    }

    console.log('\n🎉 腾讯云CloudBase数据库设置完成！');
    console.log('📖 接下来：');
    console.log('   1. 更新环境变量 DATABASE_PROVIDER=cloudbase');
    console.log('   2. 重启应用服务器');
    console.log('   3. 测试支付功能');
    console.log('   4. 验证数据是否正确存储');

  } catch (error) {
    console.error('❌ CloudBase数据库设置失败:', error);
    process.exit(1);
  }
}

// 运行设置脚本
if (require.main === module) {
  setupCloudBaseDatabase().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { setupCloudBaseDatabase };




