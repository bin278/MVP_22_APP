#!/usr/bin/env node

/**
 * 数据库切换测试脚本
 * 用于验证国内版和国际版数据库配置
 */

require('dotenv').config({ path: '.env.local' });

const provider = process.env.DATABASE_PROVIDER || 'cloudbase';

console.log('=================================================');
console.log('🔍 数据库切换测试');
console.log('=================================================\n');

// 显示当前配置
console.log('📊 当前配置:');
console.log(`   数据库提供商: ${provider}`);
console.log(`   环境变量文件: .env.local\n`);

// 验证配置
let configValid = true;

if (provider === 'cloudbase') {
  console.log('🇨🇳 国内版模式 (腾讯云 CloudBase)');
  console.log('------------------------------------------------');

  const envId = process.env.TENCENT_CLOUD_ENV_ID;
  const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
  const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;

  console.log(`   ENV_ID: ${envId ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   SECRET_ID: ${secretId ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   SECRET_KEY: ${secretKey ? '✅ 已配置' : '❌ 未配置'}`);

  if (!envId || !secretId || !secretKey) {
    configValid = false;
    console.log('\n⚠️  警告: CloudBase 配置不完整!');
    console.log('   请在 .env.local 中配置以下变量:');
    console.log('   - TENCENT_CLOUD_ENV_ID');
    console.log('   - TENCENT_CLOUD_SECRET_ID');
    console.log('   - TENCENT_CLOUD_SECRET_KEY');
  } else {
    console.log('\n✅ CloudBase 配置完整');
    console.log('   下一步: 在 CloudBase 控制台创建数据库集合');
    console.log('   https://console.cloud.tencent.com/tcb');
  }

} else if (provider === 'supabase') {
  console.log('🌍 国际版模式 (Supabase)');
  console.log('------------------------------------------------');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`   SUPABASE_URL: ${url ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   ANON_KEY: ${anonKey ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   SERVICE_ROLE_KEY: ${serviceKey ? '✅ 已配置' : '❌ 未配置'}`);

  if (!url || !anonKey) {
    configValid = false;
    console.log('\n⚠️  警告: Supabase 配置不完整!');
    console.log('   请在 .env.local 中配置以下变量:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  } else {
    // 检查是否是占位符值
    if (url.includes('your-project-id') || anonKey.includes('your-supabase')) {
      configValid = false;
      console.log('\n⚠️  警告: Supabase 配置使用占位符值!');
      console.log('   请替换为实际的 Supabase 项目凭据');
    } else {
      console.log('\n✅ Supabase 配置完整');
      console.log('   下一步: 运行数据库迁移脚本');
      console.log('   在 Supabase SQL Editor 中执行: scripts/setup-supabase-db.sql');
    }
  }

} else {
  console.log(`❌ 未知的数据库提供商: ${provider}`);
  console.log('   有效值: cloudbase, supabase');
  configValid = false;
}

// DeepSeek API 配置检查
console.log('\n\n🤖 DeepSeek AI 配置:');
console.log('------------------------------------------------');
const deepSeekKey = process.env.DEEPSEEK_API_KEY;
console.log(`   API_KEY: ${deepSeekKey ? '✅ 已配置' : '❌ 未配置'}`);

if (!deepSeekKey || deepSeekKey.includes('your-deepseek-api-key')) {
  configValid = false;
  console.log('\n⚠️  警告: DeepSeek API Key 未配置!');
  console.log('   请在 .env.local 中配置 DEEPSEEK_API_KEY');
  console.log('   获取 API Key: https://platform.deepseek.com/');
}

// 总结
console.log('\n\n=================================================');
if (configValid) {
  console.log('✅ 配置验证通过!');
  console.log('=================================================\n');
  console.log('🚀 下一步操作:');
  console.log('   1. npm install          # 安装依赖');
  console.log('   2. npm run dev          # 启动开发服务器');
  console.log('   3. 访问 http://localhost:3000\n');
  console.log('📖 更多信息请查看:');
  console.log('   docs/CN-INTL-MIGRATION-GUIDE.md\n');
} else {
  console.log('❌ 配置验证失败!');
  console.log('=================================================\n');
  console.log('请按照上述提示修复配置问题。\n');
  console.log('📖 配置指南:');
  console.log('   国内版: .env.cloudbase.example');
  console.log('   国际版: .env.supabase.example\n');
  process.exit(1);
}
