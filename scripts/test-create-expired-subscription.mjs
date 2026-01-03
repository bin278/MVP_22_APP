// scripts/test-create-expired-subscription.mjs - 创建过期测试订阅
import { getCloudBaseDb } from '../lib/database/cloudbase-client.js';
import { isChinaDeployment } from '../lib/config/deployment.config.js';

/**
 * 使用方法:
 * node scripts/test-create-expired-subscription.mjs <userId>
 *
 * 功能:
 * 为指定用户创建一个已过期的订阅,用于测试自动清理功能
 */

const userId = process.argv[2];

if (!userId) {
  console.error('❌ 错误: 请提供用户ID');
  console.error('   使用方法: node scripts/test-create-expired-subscription.mjs <userId>\n');
  console.error('   示例: node scripts/test-create-expired-subscription.mjs abc123xyz\n');
  process.exit(1);
}

console.log('🧪 创建过期测试订阅');
console.log('========================================\n');
console.log(`用户ID: ${userId}\n`);

if (!isChinaDeployment()) {
  console.error('❌ 此脚本仅支持 CN 部署环境');
  process.exit(1);
}

async function createExpiredSubscription() {
  const db = getCloudBaseDb();

  try {
    // 1. 检查用户是否存在
    console.log('📋 步骤 1: 检查用户是否存在...');
    const userResult = await db.collection('users').doc(userId).get();

    if (!userResult.data || userResult.data.length === 0) {
      console.error('❌ 用户不存在');
      process.exit(1);
    }

    const userData = userResult.data[0] || userResult.data;
    console.log('✅ 用户存在');
    console.log(`   邮箱: ${userData.email || 'N/A'}`);
    console.log(`   当前计划: ${userData.subscription_plan || 'free'}\n`);

    // 2. 创建过期订阅 (过期日期设为昨天)
    console.log('📋 步骤 2: 创建过期订阅...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const subscriptionData = {
      user_id: userId,
      plan_type: 'pro',
      status: 'active', // 注意: 设置为 active,但日期已过期
      subscription_start: twoDaysAgo.toISOString(),
      subscription_end: yesterday.toISOString(), // 昨天
      billing_cycle: 'monthly',
      created_at: twoDaysAgo.toISOString(),
      updated_at: twoDaysAgo.toISOString(),
      metadata: {
        test: true,
        testNote: '这是一个测试用的过期订阅',
      },
    };

    console.log('订阅数据:');
    console.log(`   计划类型: ${subscriptionData.plan_type}`);
    console.log(`   状态: ${subscriptionData.status}`);
    console.log(`   开始时间: ${subscriptionData.subscription_start}`);
    console.log(`   结束时间: ${subscriptionData.subscription_end} (已过期)\n`);

    const result = await db.collection('user_subscriptions').add(subscriptionData);
    console.log(`✅ 过期订阅创建成功!`);
    console.log(`   订阅ID: ${result.id}\n`);

    // 3. 更新用户的订阅计划为 pro (模拟用户在过期前的情况)
    console.log('📋 步骤 3: 更新用户订阅计划...');
    await db.collection('users').doc(userId).update({
      subscription_plan: 'pro',
      updated_at: new Date().toISOString(),
    });
    console.log('✅ 用户订阅计划已更新为 pro\n');

    // 4. 验证创建结果
    console.log('📋 步骤 4: 验证创建结果...');

    const verifyResult = await db
      .collection('user_subscriptions')
      .doc(result.id)
      .get();

    if (verifyResult.data && verifyResult.data.length > 0) {
      const createdSub = verifyResult.data[0] || verifyResult.data;
      console.log('✅ 验证成功!');
      console.log(`   订阅ID: ${createdSub._id}`);
      console.log(`   计划类型: ${createdSub.plan_type}`);
      console.log(`   状态: ${createdSub.status}`);
      console.log(`   过期时间: ${createdSub.subscription_end}`);
      console.log(`   是否过期: ${new Date(createdSub.subscription_end) < new Date() ? '是 ✓' : '否'}`);
    }

    console.log('\n========================================');
    console.log('✅ 测试订阅创建完成!');
    console.log('========================================\n');

    console.log('📝 测试步骤:');
    console.log('   1. 使用该用户账户登录应用');
    console.log('   2. 访问任何需要检查订阅的页面(如生成代码页面)');
    console.log('   3. 查看控制台日志,应该看到:');
    console.log('      [CloudBase Plan] User ' + userId + ' subscription expired at ' + yesterday.toISOString());
    console.log('      [Subscription Cleanup] Updating expired subscription ' + result.id);
    console.log('   4. 刷新页面,再次检查用户的订阅计划,应该降级为 free\n');

    console.log('🧹 清理测试数据:');
    console.log('   测试完成后,可以手动删除该测试订阅:');
    console.log(`   订阅ID: ${result.id}\n`);

  } catch (error) {
    console.error('❌ 创建失败:', error);
    process.exit(1);
  }
}

createExpiredSubscription().catch(console.error);
