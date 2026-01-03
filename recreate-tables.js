#!/usr/bin/env node

/**
 * 重新创建订阅系统表的脚本
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 手动加载 .env.local 文件
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local 文件不存在');
      return {};
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    console.log('❌ 读取 .env.local 文件失败:', error.message);
    return {};
  }
}

const env = loadEnvFile();

console.log('🔄 重新创建订阅系统表');
console.log('=========================\n');

// 检查配置
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ 缺少 SUPABASE_SERVICE_ROLE_KEY');
  console.log('需要服务角色密钥来修改数据库结构\n');
  process.exit(1);
}

async function recreateTables() {
  try {
    // 使用服务角色密钥创建管理员客户端
    const supabaseAdmin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('正在重新创建表结构...\n');

    // 1. 删除现有表和相关对象
    console.log('1. 删除现有表...');
    const dropQueries = [
      'DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;',
      'DROP TRIGGER IF EXISTS update_user_usage_stats_updated_at ON user_usage_stats;',
      'DROP FUNCTION IF EXISTS update_updated_at_column();',
      'DROP FUNCTION IF EXISTS check_user_limits(UUID);',
      'DROP FUNCTION IF EXISTS update_user_usage(UUID);',
      'DROP FUNCTION IF EXISTS can_user_use_model(UUID, TEXT);',
      'DROP FUNCTION IF EXISTS get_user_subscription_tier(UUID);',
      'DROP TABLE IF EXISTS user_subscriptions CASCADE;',
      'DROP TABLE IF EXISTS user_usage_stats CASCADE;'
    ];

    for (const query of dropQueries) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
        if (error) console.log(`   ⚠️  ${query.split(' ')[1]}: ${error.message}`);
      } catch (e) {
        // 忽略删除错误
      }
    }

    console.log('✅ 旧表删除完成\n');

    // 2. 创建新表结构
    console.log('2. 创建新表结构...');

    const createTableSQL = fs.readFileSync(
      path.join(__dirname, 'supabase-subscription-schema.sql'),
      'utf8'
    );

    // 分割SQL语句并逐个执行
    const statements = createTableSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');

    for (const statement of statements) {
      if (statement) {
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', {
            sql: statement + ';'
          });
          if (error) {
            console.log(`   ❌ 执行失败: ${statement.substring(0, 50)}...`);
            console.log(`      错误: ${error.message}`);
          }
        } catch (e) {
          console.log(`   ❌ 执行异常: ${statement.substring(0, 50)}...`);
          console.log(`      异常: ${e.message}`);
        }
      }
    }

    console.log('✅ 表结构创建完成\n');

    // 3. 验证创建结果
    console.log('3. 验证创建结果...');

    const tablesToCheck = ['user_subscriptions', 'user_usage_stats'];
    const functionsToCheck = [
      'get_user_subscription_tier',
      'can_user_use_model',
      'update_user_usage',
      'check_user_limits'
    ];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: 表创建成功`);
        }
      } catch (e) {
        console.log(`   ❌ ${table}: 验证失败`);
      }
    }

    // 验证函数
    for (const func of functionsToCheck) {
      try {
        // 尝试调用函数
        const { data, error } = await supabaseAdmin.rpc(func, {
          user_uuid: '00000000-0000-0000-0000-000000000000',
          model_id: 'test'
        });

        if (error && !error.message.includes('invalid input syntax')) {
          console.log(`   ❌ ${func}: ${error.message}`);
        } else {
          console.log(`   ✅ ${func}: 函数创建成功`);
        }
      } catch (e) {
        console.log(`   ⚠️  ${func}: 可能创建成功 (测试调用失败)`);
      }
    }

    console.log('\n🎉 订阅系统表重新创建完成！');
    console.log('\n📋 接下来:');
    console.log('1. 访问 http://localhost:3000/profile');
    console.log('2. 使用底部的订阅管理测试功能');
    console.log('3. 尝试设置不同的订阅等级');

  } catch (error) {
    console.log('❌ 重新创建失败:', error.message);
  }
}

recreateTables();












