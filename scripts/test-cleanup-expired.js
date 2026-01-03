// scripts/test-cleanup-expired.js - 测试订阅过期清理功能

/**
 * 使用方法：
 * 1. 确保已登录并拥有有效的 access token
 * 2. 运行: node scripts/test-cleanup-expired.js
 *
 * 功能：
 * - 查看过期订阅统计（GET 请求）
 * - 执行清理操作（POST 请求）
 */

const API_BASE = 'http://localhost:3000';

// 从 localStorage 或其他地方获取 token
// 这里需要手动替换为实际的 token
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || '';

async function testGetExpiredStats() {
  console.log('\n📊 测试 1: 查看过期订阅统计\n');

  try {
    const response = await fetch(`${API_BASE}/api/subscription/cleanup-expired`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 查询成功');
      console.log('📊 统计数据:', {
        总活跃订阅数: data.stats.totalActive,
        已过期数: data.stats.expired,
        仍活跃数: data.stats.active,
      });

      if (data.expiredSubscriptions && data.expiredSubscriptions.length > 0) {
        console.log('\n🔍 过期订阅详情:');
        data.expiredSubscriptions.forEach((sub, index) => {
          console.log(`\n  ${index + 1}. 订阅ID: ${sub.id}`);
          console.log(`     用户ID: ${sub.userId}`);
          console.log(`     计划类型: ${sub.plan}`);
          console.log(`     过期时间: ${sub.subscriptionEnd}`);
          console.log(`     已过期天数: ${sub.daysSinceExpiry} 天`);
        });
      } else {
        console.log('\n✅ 没有找到过期的订阅');
      }
    } else {
      console.log('❌ 查询失败:', data.error);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

async function testCleanupExpired() {
  console.log('\n🧹 测试 2: 执行过期订阅清理\n');

  try {
    const response = await fetch(`${API_BASE}/api/subscription/cleanup-expired`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 清理成功');
      console.log('📊 清理结果:', {
        消息: data.message,
        成功清理数: data.cleaned,
        失败数: data.failed,
      });

      if (data.results && data.results.length > 0) {
        console.log('\n📋 详细结果:');
        data.results.forEach((result, index) => {
          if (result.success) {
            console.log(`\n  ✅ ${index + 1}. 订阅 ${result.subscriptionId}`);
            console.log(`     用户: ${result.userId}`);
            console.log(`     计划: ${result.plan}`);
            console.log(`     过期时间: ${result.expiredAt}`);
          } else {
            console.log(`\n  ❌ ${index + 1}. 订阅 ${result.subscriptionId} 失败`);
            console.log(`     错误: ${result.error}`);
          }
        });
      }
    } else {
      console.log('❌ 清理失败:', data.error);
      if (data.details) {
        console.log('详细错误:', data.details);
      }
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('🧪 订阅过期清理功能测试');
  console.log('========================================');

  if (!ACCESS_TOKEN) {
    console.error('\n❌ 错误: 请设置 ACCESS_TOKEN 环境变量');
    console.log('示例: ACCESS_TOKEN=your_token_here node scripts/test-cleanup-expired.js\n');
    process.exit(1);
  }

  // 1. 先查看过期订阅统计
  await testGetExpiredStats();

  // 询问是否执行清理
  console.log('\n⚠️  警告: 此操作将更新数据库中的订阅状态');
  console.log('如果需要执行清理，请取消注释下面的代码\n');

  // 取消下面的注释来执行清理
  // await testCleanupExpired();

  console.log('\n========================================');
  console.log('✅ 测试完成');
  console.log('========================================\n');
}

// 运行测试
main().catch(console.error);
