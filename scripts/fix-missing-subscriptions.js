/**
 * 修复缺失的订阅记录
 * 检查所有已完成的支付记录，为没有订阅的用户创建订阅
 */

// 使用动态导入来支持 TypeScript 模块
async function main() {
  const { query, update, add } = await import('../lib/database/cloudbase');
  const { WebhookHandler } = await import('../lib/payment/webhook-handler');

async function fixMissingSubscriptions(query, update, add, WebhookHandler) {
  console.log('🔍 开始检查缺失的订阅记录...\n');

  try {
    // 1. 查询所有已完成的支付记录
    console.log('📋 查询所有已完成的支付记录...');
    const completedPayments = await query('payments', {
      where: { status: 'completed' },
      limit: 100
    });

    if (!completedPayments.data || completedPayments.data.length === 0) {
      console.log('✅ 没有找到已完成的支付记录。');
      return;
    }

    console.log(`📊 找到 ${completedPayments.data.length} 条已完成的支付记录\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. 检查每条支付记录对应的订阅
    for (const payment of completedPayments.data) {
      const userId = payment.user_id;
      const transactionId = payment.transaction_id;
      const amount = payment.amount || 0;
      const provider = payment.payment_method || 'alipay';
      const metadata = payment.metadata || {};

      console.log(`\n🔍 检查支付记录: ${transactionId}`);
      console.log(`   - 用户ID: ${userId}`);
      console.log(`   - 金额: ${amount}`);
      console.log(`   - 支付方式: ${provider}`);
      console.log(`   - 状态: ${payment.status}`);

      // 检查用户是否已有订阅
      const existingSubscription = await query('user_subscriptions', {
        where: { user_id: userId },
        limit: 1
      });

      if (existingSubscription.data && existingSubscription.data.length > 0) {
        const sub = existingSubscription.data[0];
        console.log(`   ✅ 用户已有订阅: ${sub.tier}, 到期: ${sub.current_period_end}`);
        skippedCount++;
        continue;
      }

      // 用户没有订阅，需要创建
      console.log(`   ⚠️  用户没有订阅记录，准备创建...`);

      try {
        // 从metadata中获取订阅信息
        const billingCycle = metadata.billingCycle || 'monthly';
        const planType = metadata.planType || 'basic';

        // 根据账单周期计算订阅天数
        const days = billingCycle === 'yearly' ? 365 : 30;

        // 计算到期时间
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        // 根据支付金额确定tier（优先使用planType）
        let tier = planType || 'basic';
        if (!planType || planType === 'basic') {
          if (amount >= 1999) tier = 'premium';
          else if (amount >= 199) tier = 'premium';
          else if (amount >= 79) tier = 'pro';
          else if (amount >= 29) tier = 'basic';
        }

        const subscriptionData = {
          user_id: userId,
          tier,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: expiresAt.toISOString(),
          payment_method: provider,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log(`   📝 创建订阅: tier=${tier}, days=${days}, expiresAt=${expiresAt.toISOString()}`);

        const result = await add('user_subscriptions', subscriptionData);

        if (result && result.id) {
          console.log(`   ✅ 订阅创建成功！文档ID: ${result.id}`);
          fixedCount++;
        } else {
          console.error(`   ❌ 订阅创建失败：返回结果中没有ID`);
          errorCount++;
        }
      } catch (createError) {
        console.error(`   ❌ 创建订阅时出错:`, createError);
        console.error(`   错误详情:`, {
          message: createError?.message,
          stack: createError?.stack,
        });
        errorCount++;
      }
    }

    // 3. 输出统计信息
    console.log('\n' + '='.repeat(50));
    console.log('📊 修复统计:');
    console.log(`   ✅ 成功创建: ${fixedCount} 个订阅`);
    console.log(`   ⏭️  已跳过: ${skippedCount} 个（已有订阅）`);
    console.log(`   ❌ 失败: ${errorCount} 个`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 运行修复脚本时发生错误:', error);
    console.error('错误详情:', {
      message: error?.message,
      stack: error?.stack,
    });
  }
}

  // 运行修复脚本
  await fixMissingSubscriptions(query, update, add, WebhookHandler);
  console.log('\n🎉 修复脚本执行完成！');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ 修复脚本执行失败:', error);
  process.exit(1);
});

