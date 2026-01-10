/**
 * 检查 recommendation_usage 表结构
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  console.log('检查 recommendation_usage 表结构...\n');

  // 查询表结构
  const { data, error } = await supabase
    .rpc('get_table_columns', { table_name: 'recommendation_usage' });

  if (error) {
    console.error('查询失败，尝试使用 SQL 查询...\n');

    // 使用 PostgreSQL 系统表查询
    const { data: columns, error: queryError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'recommendation_usage')
      .order('ordinal_position');

    if (queryError) {
      console.error('查询失败:', queryError);
      return;
    }

    console.log('recommendation_usage 表结构:');
    console.log('列名'.padEnd(25), '类型'.padEnd(20), '可空', '默认值');
    console.log('-'.repeat(80));

    columns.forEach(col => {
      console.log(
        col.column_name.padEnd(25),
        col.data_type.padEnd(20),
        col.is_nullable.padEnd(8),
        col.column_default || '(null)'
      );
    });
  } else {
    console.log('表结构:', data);
  }

  // 测试插入一条记录，看看需要哪些字段
  console.log('\n\n尝试插入测试记录以检查必需字段...');

  const testRecord = {
    user_id: '16759c96-dd3a-4b14-a952-77bf5b798236',
    created_at: new Date().toISOString()
  };

  const { data: insertData, error: insertError } = await supabase
    .from('recommendation_usage')
    .insert(testRecord)
    .select();

  if (insertError) {
    console.log('\n❌ 插入失败:', insertError.message);

    // 解析错误信息，找出缺失的必需字段
    const match = insertError.message.match(/null value in column "(\w+)"/);
    if (match) {
      console.log(`\n⚠️  缺少必需字段: ${match[1]}`);
    }
  } else {
    console.log('\n✅ 插入成功! 刚才的字段都足够了');

    // 删除测试记录
    await supabase
      .from('recommendation_usage')
      .delete()
      .eq('id', insertData[0].id);
  }
}

checkTableStructure();
