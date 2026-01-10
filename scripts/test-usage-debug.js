/**
 * 测试使用次数扣除 - 详细调试版本
 */

const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取配置
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testUserId = '16759c96-dd3a-4b14-a952-77bf5b798236';

console.log('\n' + '='.repeat(80));
console.log('🧪 测试使用次数扣除 - 详细调试版本');
console.log('='.repeat(80) + '\n');

console.log('📋 配置检查:');
console.log('  Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING');
console.log('  Service Role Key:', supabaseServiceKey ? 'EXISTS' : 'MISSING');
console.log('  Test User ID:', testUserId);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ 缺少必要的配置！');
  console.error('请检查 .env.local 文件中的以下配置:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  try {
    // 1. 检查用户订阅
    console.log('\n1️⃣ 检查用户订阅...');
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', testUserId);

    if (subError) {
      console.error('❌ 查询订阅失败:', subError);
      throw subError;
    }

    console.log('✅ 找到', subscriptions?.length || 0, '条订阅记录');
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        console.log(`  ${index + 1}. Plan: ${sub.plan_type}, Status: ${sub.status}`);
      });
    }

    // 2. 检查现有使用记录
    console.log('\n2️⃣ 检查现有使用记录...');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    console.log('  查询时间范围:', {
      start: startOfMonth.toISOString(),
      end: endOfMonth.toISOString()
    });

    const { data: existingUsage, error: usageError } = await supabase
      .from('recommendation_usage')
      .select('*')
      .eq('user_id', testUserId)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())
      .order('created_at', { ascending: false });

    if (usageError) {
      console.error('❌ 查询使用记录失败:', usageError);
      throw usageError;
    }

    console.log('✅ 本月已使用次数:', existingUsage?.length || 0);

    // 3. 尝试插入使用记录
    console.log('\n3️⃣ 插入使用记录...');
    const testRecord = {
      user_id: testUserId,
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'debug_script'
      },
      created_at: new Date().toISOString()
    };

    console.log('  准备插入的记录:', testRecord);

    const { data: insertedRecord, error: insertError } = await supabase
      .from('recommendation_usage')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      console.error('❌ 插入使用记录失败:', insertError);
      console.error('  错误代码:', insertError.code);
      console.error('  错误信息:', insertError.message);
      console.error('  错误详情:', insertError.hint);
      throw insertError;
    }

    console.log('✅ 成功插入使用记录!');
    console.log('  记录 ID:', insertedRecord.id);
    console.log('  创建时间:', insertedRecord.created_at);

    // 4. 再次查询使用记录
    console.log('\n4️⃣ 再次查询使用记录...');
    const { data: newUsage, error: newUsageError } = await supabase
      .from('recommendation_usage')
      .select('*')
      .eq('user_id', testUserId)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());

    if (newUsageError) {
      console.error('❌ 查询使用记录失败:', newUsageError);
      throw newUsageError;
    }

    console.log('✅ 本月已使用次数:', newUsage?.length || 0);

    // 5. 总结
    console.log('\n5️⃣ 测试总结:');
    console.log('  ✅ 使用次数已成功记录');
    console.log('  ✅ 使用次数增加:', (newUsage?.length || 0) - (existingUsage?.length || 0));
    console.log('\n' + '='.repeat(80));
    console.log('✅ 测试完成 - 使用次数扣除功能正常');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.error('\n可能的原因:');
    console.error('  1. 表不存在或表结构不正确');
    console.error('  2. RLS 策略阻止了插入操作');
    console.error('  3. Service Role Key 权限不足');
    console.error('  4. 网络连接问题');
    console.error('\n建议:');
    console.error('  - 在 Supabase Dashboard 中检查表结构');
    console.error('  - 检查 RLS 策略是否允许 service_role 插入数据');
    console.error('  - 重新运行 fix-intl-usage-tables.sql 脚本');
    process.exit(1);
  }
}

test();
