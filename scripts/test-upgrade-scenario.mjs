// scripts/test-upgrade-scenario.mjs - 测试用户升级场景
import { getCloudBaseDb } from '../lib/database/cloudbase-client.js';
import { isChinaDeployment } from '../lib/config/deployment.config.js';

/**
 * 使用方法:
 * node scripts/test-upgrade-scenario.mjs <userId>
 *
 * 功能:
 * 模拟用户升级订阅的场景，验证过期清理逻辑不会影响升级后的用户
 */

const userId = process.argv[2];

if (!userId) {
  console.error('❌ 错误: 请提供用户ID');
  console.error('   使用方法: node scripts/test-upgrade-scenario.mjs <userId>\n');
  process.exit(1);
}

console.log('🧪 测试用户升级场景');
console.log('========================================\n');
console.log(`用户ID: ${userId}\n`);

if (!isChinaDeployment()) {
  console.error('❌ 此脚本仅支持 CN 部署环境');
  process.exit(1);
}

async function testUpgradeScenario() {
  const db = getCloudBaseDb();
  const now = new Date();

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

    // 2. 创建一个已过期的旧订阅
    console.log('📋 步骤 2: 创建已过期的旧订阅 (模拟用户之前订阅已过期)...');
    const oldSubscriptionEndDate = new Date(now);
    oldSubscriptionEndDate.setDate(oldSubscriptionEndDate.getDate() - 10); // 10天前过期

    const oldSubscriptionData = {
      user_id: userId,
      plan_type: 'pro',
      status: 'active', // 仍然是 active，但已过期
      subscription_start: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40天前开始
      subscription_end: oldSubscriptionEndDate.toISOString(),
      billing_cycle: 'monthly',
      created_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        test: true,
        testNote: '旧的过期订阅 (升级前)',
      },
    };

    const oldSubResult = await db.collection('user_subscriptions').add(oldSubscriptionData);
    console.log('✅ 旧订阅创建成功');
    console.log(`   订阅ID: ${oldSubResult.id}`);
    console.log(`   状态: active (但已过期)`);
    console.log(`   过期时间: ${oldSubscriptionEndDate.toISOString()}\n`);

    // 3. 创建新的有效订阅 (模拟用户刚升级)
    console.log('📋 步骤 3: 创建新的有效订阅 (模拟用户刚升级)...');
    const newSubscriptionEndDate = new Date(now);
    newSubscriptionEndDate.setDate(newSubscriptionEndDate.getDate() + 30); // 30天后过期

    const newSubscriptionData = {
      user_id: userId,
      plan_type: 'pro', // 或者 'enterprise' 升级到企业版
      status: 'active',
      subscription_start: now.toISOString(),
      subscription_end: newSubscriptionEndDate.toISOString(),
      billing_cycle: 'monthly',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      metadata: {
        test: true,
        testNote: '新升级的订阅 (有效)',
      },
    };

    const newSubResult = await db.collection('user_subscriptions').add(newSubscriptionData);
    console.log('✅ 新订阅创建成功');
    console.log(`   订阅ID: ${newSubResult.id}`);
    console.log(`   状态: active`);
    console.log(`   过期时间: ${newSubscriptionEndDate.toISOString()} (未来)\n`);

    // 4. 更新用户的订阅计划
    console.log('📋 步骤 4: 更新用户订阅计划为 pro...');
    await db.collection('users').doc(userId).update({
      subscription_plan: 'pro',
      subscription_status: 'active',
      updated_at: now.toISOString(),
    });
    console.log('✅ 用户订阅计划已更新为 pro\n');

    // 5. 验证当前状态
    console.log('📋 步骤 5: 验证当前状态...');
    const allSubsResult = await db
      .collection('user_subscriptions')
      .where({ user_id: userId })
      .get();

    console.log(`✅ 用户共有 ${allSubsResult.data.length} 个订阅:\n`);

    allSubsResult.data.forEach((sub, index) => {
      const isExpired = new Date(sub.subscription_end) < now;
      console.log(`   ${index + 1}. 订阅ID: ${sub._id.substring(0, 12)}...`);
      console.log(`      计划: ${sub.plan_type}`);
      console.log(`      状态: ${sub.status}`);
      console.log(`      过期时间: ${sub.subscription_end}`);
      console.log(`      是否过期: ${isExpired ? '是 ❌' : '否 ✅'}`);
      console.log('');
    });

    console.log('========================================');
    console.log('✅ 升级场景创建完成!');
    console.log('========================================\n');

    console.log('📝 测试场景说明:');
    console.log('   用户现在有两个订阅:');
    console.log(`   1. 旧订阅 (ID: ${oldSubResult.id.substring(0, 8)}...) - 已过期`);
    console.log(`   2. 新订阅 (ID: ${newSubResult.id.substring(0, 8)}...) - 有效`);
    console.log('');

    console.log('🧪 测试步骤:');
    console.log('   1. 运行批量清理 API:');
    console.log('      POST /api/subscription/cleanup-expired');
    console.log('');
    console.log('   2. 预期结果:');
    console.log('   ✅ 旧订阅被标记为 expired');
    console.log('   ✅ 新订阅保持 active 状态');
    console.log('   ✅ 用户的 subscription_plan 保持为 pro (不会降级为 free)');
    console.log('');

    console.log('🔍 验证清理结果:');
    console.log('   清理后，再次查询用户订阅:');
    console.log(`   db.collection('user_subscriptions').where({ user_id: '${userId}' }).get()`);
    console.log('');
    console.log('   应该看到:');
    console.log('   - 旧订阅: status = "expired"');
    console.log('   - 新订阅: status = "active"');
    console.log('   - 用户计划: subscription_plan = "pro"');
    console.log('');

    console.log('🗑️ 清理测试数据:');
    console.log('   测试完成后，可以删除这些测试订阅:');
    console.log(`   旧订阅ID: ${oldSubResult.id}`);
    console.log(`   新订阅ID: ${newSubResult.id}`);
    console.log('');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testUpgradeScenario().catch(console.error);
