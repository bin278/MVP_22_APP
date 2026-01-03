// scripts/test-cleanup-function.mjs - 测试订阅过期清理功能
// 这是一个 Node.js 测试脚本,用于验证过期清理功能

/**
 * 使用方法:
 * 1. 在浏览器开发者工具中获取 access token:
 *    - 打开你的应用
 *    - 按 F12 打开控制台
 *    - 执行: JSON.parse(localStorage.getItem('app-auth-state') || '{}').accessToken
 * 2. 复制 token 并运行: TOKEN=your_token node scripts/test-cleanup-function.mjs
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error('❌ 错误: 请设置 TOKEN 环境变量');
  console.error('   示例: TOKEN=your_access_token node scripts/test-cleanup-function.mjs\n');
  process.exit(1);
}

console.log('🧪 订阅过期清理功能测试');
console.log('========================================\n');
console.log(`API Base: ${API_BASE}`);
console.log(`Token: ${TOKEN.substring(0, 20)}...\n`);

// 测试 1: 查看过期订阅统计
async function testGetStats() {
  console.log('📊 测试 1: 查看过期订阅统计');
  console.log('----------------------------------------');

  try {
    const response = await fetch(`${API_BASE}/api/subscription/cleanup-expired`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 查询成功\n');
      console.log('📊 统计数据:');
      console.log(`   总活跃订阅数: ${data.stats.totalActive}`);
      console.log(`   已过期数: ${data.stats.expired}`);
      console.log(`   仍活跃数: ${data.stats.active}`);

      if (data.expiredSubscriptions && data.expiredSubscriptions.length > 0) {
        console.log('\n🔍 过期订阅详情:');
        data.expiredSubscriptions.forEach((sub, index) => {
          console.log(`\n   ${index + 1}. 订阅ID: ${sub.id}`);
          console.log(`      用户ID: ${sub.userId}`);
          console.log(`      计划类型: ${sub.plan}`);
          console.log(`      过期时间: ${sub.subscriptionEnd}`);
          console.log(`      已过期天数: ${sub.daysSinceExpiry} 天`);
        });
        console.log(`\n✅ 找到 ${data.expiredSubscriptions.length} 个过期订阅`);
        return data.expiredSubscriptions.length;
      } else {
        console.log('\n✅ 没有找到过期的订阅');
        return 0;
      }
    } else {
      console.log(`❌ 查询失败: ${data.error}`);
      return -1;
    }
  } catch (error) {
    console.error(`❌ 请求失败: ${error.message}`);
    return -1;
  }
}

// 测试 2: 执行批量清理
async function testCleanup() {
  console.log('\n\n🧹 测试 2: 执行批量清理');
  console.log('----------------------------------------');

  // 询问是否继续
  console.log('⚠️  警告: 此操作将更新数据库中的订阅状态');
  console.log('如果需要跳过清理,请按 Ctrl+C\n');

  // 等待 3 秒让用户有机会取消
  console.log('⏳ 3 秒后开始清理...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const response = await fetch(`${API_BASE}/api/subscription/cleanup-expired`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 清理成功\n');
      console.log('📊 清理结果:');
      console.log(`   消息: ${data.message}`);
      console.log(`   成功清理数: ${data.cleaned}`);
      console.log(`   失败数: ${data.failed}`);

      if (data.results && data.results.length > 0) {
        console.log('\n📋 详细结果:');
        let successCount = 0;
        let failCount = 0;

        data.results.forEach((result, index) => {
          if (result.success) {
            successCount++;
            console.log(`\n   ✅ ${index + 1}. 订阅 ${result.subscriptionId.substring(0, 12)}...`);
            console.log(`      用户: ${result.userId}`);
            console.log(`      计划: ${result.plan}`);
            console.log(`      过期时间: ${result.expiredAt}`);
          } else {
            failCount++;
            console.log(`\n   ❌ ${index + 1}. 订阅 ${result.subscriptionId?.substring(0, 12)}... 失败`);
            console.log(`      错误: ${result.error}`);
          }
        });

        console.log(`\n✅ 成功: ${successCount}, ❌ 失败: ${failCount}`);
      }
    } else {
      console.log(`❌ 清理失败: ${data.error}`);
      if (data.details) {
        console.log(`详细错误: ${data.details}`);
      }
    }
  } catch (error) {
    console.error(`❌ 请求失败: ${error.message}`);
  }
}

// 主函数
async function main() {
  console.log('开始测试...\n');

  // 1. 先查看过期订阅统计
  const expiredCount = await testGetStats();

  // 2. 如果有过期订阅,询问是否执行清理
  if (expiredCount > 0) {
    console.log(`\n⚠️  发现 ${expiredCount} 个过期订阅`);
    await testCleanup();
  } else if (expiredCount === 0) {
    console.log('\n✅ 没有过期订阅需要清理,测试通过!');
  } else {
    console.log('\n❌ 查询失败,无法继续测试');
  }

  console.log('\n========================================');
  console.log('✅ 测试完成');
  console.log('========================================\n');

  console.log('📝 下一步: 测试自动过期检测功能');
  console.log('   1. 创建一个过期的测试订阅');
  console.log('   2. 使用该用户账户登录并访问应用');
  console.log('   3. 检查控制台日志,应该看到:');
  console.log('      [CloudBase Plan] User xxx subscription expired at...');
  console.log('      [Subscription Cleanup] Updating expired subscription...');
  console.log('   4. 验证数据库中的订阅状态已更新为 "expired"\n');
}

// 运行测试
main().catch(console.error);
