// 测试订阅创建脚本
// 用于调试支付成功后的订阅创建问题

const { query, update, add } = require('../lib/database/cloudbase');

async function testSubscriptionCreation() {
  try {
    console.log('🧪 测试订阅创建...\n');

    // 1. 查找最近的支付记录
    console.log('📋 查找最近的支付记录...');
    const paymentsResult = await query('payments', {
      where: { status: 'completed' },
      limit: 5,
      orderBy: [{ field: 'created_at', order: 'desc' }]
    });

    if (!paymentsResult.data || paymentsResult.data.length === 0) {
      console.log('❌ 没有找到已完成的支付记录');
      return;
    }

    console.log(`✅ 找到 ${paymentsResult.data.length} 条支付记录\n`);

    // 2. 检查每条支付记录对应的订阅
    for (const payment of paymentsResult.data) {
      console.log(`\n📝 检查支付记录: ${payment.transaction_id}`);
      console.log(`   用户ID: ${payment.user_id}`);
      console.log(`   金额: ${payment.amount}`);
      console.log(`   状态: ${payment.status}`);
      console.log(`   元数据:`, JSON.stringify(payment.metadata, null, 2));

      // 查找对应的订阅记录
      const subscriptionResult = await query('user_subscriptions', {
        where: { user_id: payment.user_id },
        limit: 1
      });

      if (subscriptionResult.data && subscriptionResult.data.length > 0) {
        const subscription = subscriptionResult.data[0];
        console.log(`   ✅ 找到订阅记录:`);
        console.log(`      等级: ${subscription.tier}`);
        console.log(`      状态: ${subscription.status}`);
        console.log(`      到期时间: ${subscription.current_period_end}`);
      } else {
        console.log(`   ❌ 没有找到订阅记录！`);
        console.log(`   🔧 尝试手动创建订阅...`);

        // 尝试手动创建订阅
        const metadata = payment.metadata || {};
        const billingCycle = metadata.billingCycle || 'monthly';
        const planType = metadata.planType || 'basic';
        const days = billingCycle === 'yearly' ? 365 : 30;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        let tier = planType || 'basic';
        if (!planType || planType === 'basic') {
          if (payment.amount >= 1999) tier = 'premium';
          else if (payment.amount >= 199) tier = 'premium';
          else if (payment.amount >= 79) tier = 'pro';
          else if (payment.amount >= 29) tier = 'basic';
        }

        try {
          const result = await add('user_subscriptions', {
            user_id: payment.user_id,
            tier,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: expiresAt.toISOString(),
            payment_method: payment.payment_method || 'alipay',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          console.log(`   ✅ 订阅创建成功！`);
          console.log(`      文档ID: ${result.id}`);
          console.log(`      等级: ${tier}`);
          console.log(`      天数: ${days}`);
        } catch (error) {
          console.error(`   ❌ 订阅创建失败:`, error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testSubscriptionCreation();

