/**
 * 检查加油包是否添加成功
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCreditPackage() {
  const userId = '16759c96-dd3a-4b14-a952-77bf5b798236';

  console.log('🔍 检查用户加油包...\n');

  // 1. 检查加油包
  const { data: packages, error: packageError } = await supabase
    .from('user_credit_packages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (packageError) {
    console.error('❌ 查询加油包失败:', packageError);
  } else {
    console.log('📦 加油包数量:', packages?.length || 0);
    if (packages && packages.length > 0) {
      packages.forEach((pkg, index) => {
        console.log(`\n加油包 #${index + 1}:`);
        console.log('  类型:', pkg.package_type);
        console.log('  总额度:', pkg.credits_total);
        console.log('  剩余:', pkg.credits_remaining);
        console.log('  状态:', pkg.status);
        console.log('  过期时间:', pkg.expiry_date);
        console.log('  购买时间:', pkg.purchase_date);
      });
    } else {
      console.log('ℹ️  未找到加油包');
    }
  }

  // 2. 检查最近的支付记录
  console.log('\n\n🔍 检查最近的支付记录...\n');

  const { data: payments, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (paymentError) {
    console.error('❌ 查询支付记录失败:', paymentError);
  } else {
    console.log('💳 支付记录数量:', payments?.length || 0);
    if (payments && payments.length > 0) {
      payments.forEach((payment, index) => {
        console.log(`\n支付 #${index + 1}:`);
        console.log('  金额:', payment.amount, payment.currency);
        console.log('  方式:', payment.payment_method);
        console.log('  类型:', payment.payment_type);
        console.log('  状态:', payment.status);
        console.log('  Session ID:', payment.stripe_session_id || payment.paypal_order_id);
        console.log('  创建时间:', payment.created_at);
        console.log('  Metadata:', JSON.stringify(payment.metadata, null, 2));
      });
    }
  }

  // 3. 检查使用统计
  console.log('\n\n🔍 检查本月使用统计...\n');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const { data: usage, error: usageError } = await supabase
    .from('recommendation_usage')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString());

  if (usageError) {
    console.error('❌ 查询使用统计失败:', usageError);
  } else {
    console.log('📊 本月使用次数:', usage?.length || 0);
    console.log('📅 统计期间:', startOfMonth.toISOString(), '至', endOfMonth.toISOString());
  }
}

checkCreditPackage().then(() => {
  console.log('\n✅ 检查完成');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 错误:', error);
  process.exit(1);
});
