// 数据迁移脚本: 同步 Supabase Auth 用户到 users 表
// 运行方式: npx tsx scripts/migrate-supabase-users.ts

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// 加载环境变量
config({ path: resolve(__dirname, '../.env.local') });

async function migrateUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少 Supabase 配置');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('🔍 获取 Supabase Auth 中的所有用户...');

  // 获取所有认证用户
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ 获取用户失败:', authError);
    process.exit(1);
  }

  console.log(`📊 找到 ${authUsers.length} 个认证用户`);

  // 获取已存在的用户
  const { data: existingUsers } = await supabase.from('users').select('id');
  const existingIds = new Set(existingUsers?.map(u => u.id) || []);

  let synced = 0;
  let skipped = 0;

  for (const authUser of authUsers) {
    if (existingIds.has(authUser.id)) {
      console.log(`⏭️  跳过已存在用户: ${authUser.email}`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from('users').insert({
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
      avatar_url: authUser.user_metadata?.avatar_url,
      subscription_plan: 'free',
      subscription_status: 'active',
      created_at: authUser.created_at,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`❌ 同步用户失败 ${authUser.email}:`, error.message);
    } else {
      console.log(`✅ 同步用户: ${authUser.email}`);
      synced++;
    }
  }

  console.log('\n📈 迁移完成:');
  console.log(`  - 同步: ${synced} 个用户`);
  console.log(`  - 跳过: ${skipped} 个用户`);
  console.log(`  - 总计: ${authUsers.length} 个用户`);
}

migrateUsers().catch(console.error);
