// 检查 users 表的实际结构
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(__dirname, '../.env.local') });

async function checkSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 配置');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 获取一个现有用户来查看表结构
  const { data, error } = await supabase.from('users').select('*').limit(1);

  if (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('📋 users 表的列名:');
    console.log(Object.keys(data[0]));
    console.log('\n📄 示例数据:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('⚠️  users 表为空');
  }
}

checkSchema().catch(console.error);
