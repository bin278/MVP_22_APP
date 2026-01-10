/**
 * 手动添加加油包到数据库
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addCreditPackage() {
  const userId = '16759c96-dd3a-4b14-a952-77bf5b798236';
  const packageType = 'basic';
  const credits = 100;
  const validity = 30;

  console.log('🔍 手动添加加油包到数据库...\n');

  // 计算过期时间
  const purchaseDate = new Date();
  const expiryDate = new Date(purchaseDate);
  expiryDate.setDate(expiryDate.getDate() + validity);

  const creditPackage = {
    user_id: userId,
    package_type: packageType,
    package_id: `manual_${Date.now()}`,
    credits_total: credits,
    credits_remaining: credits,
    status: 'active',
    expiry_date: expiryDate.toISOString(),
    purchase_date: purchaseDate.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('加油包信息:');
  console.log('  用户 ID:', userId);
  console.log('  类型:', packageType);
  console.log('  额度:', credits);
  console.log('  过期时间:', expiryDate.toISOString());
  console.log('');

  const { data, error } = await supabase
    .from('user_credit_packages')
    .insert(creditPackage)
    .select();

  if (error) {
    console.error('❌ 添加加油包失败:', error);
    return;
  }

  console.log('✅ 加油包添加成功!');
  console.log('记录:', data);
}

addCreditPackage().then(() => {
  console.log('\n✅ 完成');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 错误:', error);
  process.exit(1);
});
