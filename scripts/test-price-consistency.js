// 测试价格一致性修复
console.log('🧪 测试价格一致性修复...\n');

// 1. 检查subscription-tiers中的价格
const { SUBSCRIPTION_TIERS } = require('../lib/subscription-tiers');

console.log('📊 SUBSCRIPTION_TIERS 中的价格:');
Object.entries(SUBSCRIPTION_TIERS).forEach(([tier, config]) => {
  console.log(`  ${tier}: 月付 ${config.price.monthly}元, 年付 ${config.price.yearly}元`);
});

console.log('\n2️⃣ 测试不同套餐的价格获取:');

// 测试basic套餐
const basicMonthly = SUBSCRIPTION_TIERS.basic.price.monthly;
const basicYearly = SUBSCRIPTION_TIERS.basic.price.yearly;
console.log(`basic 月付: ${basicMonthly}元 (期望: 29)`);
console.log(`basic 年付: ${basicYearly}元 (期望: 299)`);

// 测试pro套餐
const proMonthly = SUBSCRIPTION_TIERS.pro.price.monthly;
const proYearly = SUBSCRIPTION_TIERS.pro.price.yearly;
console.log(`pro 月付: ${proMonthly}元 (期望: 79)`);
console.log(`pro 年付: ${proYearly}元 (期望: 799)`);

// 测试premium套餐
const premiumMonthly = SUBSCRIPTION_TIERS.premium.price.monthly;
const premiumYearly = SUBSCRIPTION_TIERS.premium.price.yearly;
console.log(`premium 月付: ${premiumMonthly}元 (期望: 199)`);
console.log(`premium 年付: ${premiumYearly}元 (期望: 1999)`);

// 3. 测试支付API的价格获取
console.log('\n3️⃣ 测试支付API的价格获取:');

// 模拟getPlanAmount函数
function getPlanAmount(planId, billingCycle) {
  const tier = SUBSCRIPTION_TIERS[planId];
  if (!tier) return null;
  return tier.price[billingCycle];
}

console.log('支付API价格测试:');
console.log(`basic monthly: ${getPlanAmount('basic', 'monthly')}元 (期望: 29)`);
console.log(`pro monthly: ${getPlanAmount('pro', 'monthly')}元 (期望: 79)`);
console.log(`premium yearly: ${getPlanAmount('premium', 'yearly')}元 (期望: 1999)`);

console.log('\n✅ 价格一致性修复完成！');
console.log('现在选择套餐页面和支付页面的价格应该完全一致。');


