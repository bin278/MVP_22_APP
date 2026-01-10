/**
 * 测试使用次数扣除
 * 用法: node scripts/test-usage-deduction.js <user_id>
 */

const userId = process.argv[2];

if (!userId) {
  console.error('❌ 请提供用户 ID');
  console.error('\n用法:');
  console.error('  node scripts/test-usage-deduction.js <user_id>');
  console.error('\n示例:');
  console.error('  node scripts/test-usage-deduction.js 16759c96-dd3a-4b14-a952-77bf5b798236');
  process.exit(1);
}

console.log(`\n🧪 测试用户: ${userId}`);
console.log(`📝 将调用 POST http://localhost:3000/api/test-intl-usage\n`);

fetch('http://localhost:3000/api/test-intl-usage', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId })
})
  .then(res => res.json())
  .then(data => {
    console.log('\n✅ 测试结果:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n📊 使用前后对比:');
      console.log('────────────────────────────────────');
      console.log(`使用前:`);
      console.log(`  - 本月已使用: ${data.stats.before.currentPeriodUsage}`);
      console.log(`  - 总限额: ${data.stats.before.periodLimit}`);
      console.log(`  - 剩余次数: ${data.stats.before.remainingUsage}`);

      console.log(`\n使用后:`);
      console.log(`  - 本月已使用: ${data.stats.after.currentPeriodUsage}`);
      console.log(`  - 总限额: ${data.stats.after.periodLimit}`);
      console.log(`  - 剩余次数: ${data.stats.after.remainingUsage}`);

      console.log(`\n变化:`);
      console.log(`  - 已使用变化: ${data.stats.diff.usageDiff > 0 ? '+' : ''}${data.stats.diff.usageDiff}`);
      console.log(`  - 剩余变化: ${data.stats.diff.remainingDiff > 0 ? '+' : ''}${data.stats.diff.remainingDiff}`);
      console.log(`  - 限额变化: ${data.stats.diff.limitDiff > 0 ? '+' : ''}${data.stats.diff.limitDiff}`);
      console.log('────────────────────────────────────');

      if (data.stats.diff.usageDiff === 1) {
        console.log('\n✅ 推荐使用次数表 (recommendation_usage) 记录成功');
      } else if (data.stats.diff.usageDiff === 0 && data.stats.diff.limitDiff === -1) {
        console.log('\n✅ 从加油包扣除次数成功（recommendation_usage 表无新增记录）');
      } else {
        console.log('\n⚠️  变化异常，请检查');
      }
    }
  })
  .catch(error => {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n请确保:');
    console.error('  1. 开发服务器正在运行 (npm run dev)');
    console.error('  2. 端口 3000 可用');
    process.exit(1);
  });
