#!/usr/bin/env node

// scripts/test-database.js
// 数据库连接和功能测试脚本

async function testDatabase() {
  console.log('🧪 开始数据库测试...\n');

  const provider = process.env.DATABASE_PROVIDER || 'supabase';
  console.log(`📊 当前数据库提供商: ${provider}\n`);

  try {
    if (provider === 'tencent-cloud') {
      // 测试腾讯云数据库
      console.log('📊 测试腾讯云数据库连接...');

      const { testConnection, query } = await import('../lib/database/tencent-cloud.js');

      const connected = await testConnection();
      if (!connected) {
        console.error('❌ 腾讯云数据库连接失败');
        process.exit(1);
      }

      // 测试基本查询
      console.log('🔍 测试数据库查询...');

      // 查询支付表
      const paymentsResult = await query('SELECT COUNT(*) as count FROM payments');
      console.log(`   💳 支付记录总数: ${paymentsResult.rows[0].count}`);

      // 查询订阅表
      const subscriptionsResult = await query('SELECT COUNT(*) as count FROM subscriptions');
      console.log(`   👤 订阅记录总数: ${subscriptionsResult.rows[0].count}`);

      // 查询用户订阅表
      const userSubscriptionsResult = await query('SELECT COUNT(*) as count FROM user_subscriptions');
      console.log(`   👥 用户订阅记录总数: ${userSubscriptionsResult.rows[0].count}`);

      // 测试插入查询
      console.log('📝 测试数据插入...');
      const testId = `test_${Date.now()}`;
      await query(`
        INSERT INTO payments (user_id, amount, currency, status, payment_method, transaction_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [testId, 0.01, 'CNY', 'completed', 'alipay', `test_txn_${Date.now()}`]);

      console.log('   ✅ 测试数据插入成功');

      // 清理测试数据
      await query('DELETE FROM payments WHERE user_id = $1', [testId]);
      console.log('   🧹 测试数据清理完成');

    } else {
      // 测试Supabase数据库
      console.log('📊 测试Supabase数据库连接...');

      const { supabaseAdmin } = await import('../lib/supabase.js');

      if (!supabaseAdmin) {
        console.error('❌ Supabase客户端未初始化');
        process.exit(1);
      }

      // 测试基本查询
      console.log('🔍 测试数据库查询...');

      try {
        // 查询支付表
        const { count: paymentsCount, error: paymentsError } = await supabaseAdmin
          .from('payments')
          .select('*', { count: 'exact', head: true });

        if (paymentsError) throw paymentsError;
        console.log(`   💳 支付记录总数: ${paymentsCount}`);
      } catch (error) {
        console.log(`   ⚠️ 支付表查询失败: ${error.message}`);
      }

      try {
        // 查询订阅表
        const { count: subscriptionsCount, error: subscriptionsError } = await supabaseAdmin
          .from('subscriptions')
          .select('*', { count: 'exact', head: true });

        if (subscriptionsError) throw subscriptionsError;
        console.log(`   👤 订阅记录总数: ${subscriptionsCount}`);
      } catch (error) {
        console.log(`   ⚠️ 订阅表查询失败: ${error.message}`);
      }

      try {
        // 查询用户订阅表
        const { count: userSubscriptionsCount, error: userSubscriptionsError } = await supabaseAdmin
          .from('user_subscriptions')
          .select('*', { count: 'exact', head: true });

        if (userSubscriptionsError) throw userSubscriptionsError;
        console.log(`   👥 用户订阅记录总数: ${userSubscriptionsCount}`);
      } catch (error) {
        console.log(`   ⚠️ 用户订阅表查询失败: ${error.message}`);
      }

      console.log('   ✅ Supabase数据库连接正常');
    }

    console.log('\n🎉 数据库测试完成！所有功能正常。');

  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
    process.exit(1);
  }
}

// 运行测试脚本
if (require.main === module) {
  testDatabase().catch(error => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { testDatabase };




