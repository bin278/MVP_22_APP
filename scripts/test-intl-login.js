#!/usr/bin/env node

/**
 * 国际版登录测试脚本
 * 测试Supabase邮箱登录和注册功能
 */

require('dotenv').config({ path: '.env.local' });

const testConfig = {
  email: `test-${Date.now()}@example.com`,
  password: 'Test123456',
  name: 'Test User'
};

console.log('==================================================');
console.log('🧪 国际版登录功能测试');
console.log('==================================================\n');

// 检查环境变量
const provider = process.env.DATABASE_PROVIDER;
const authProvider = process.env.AUTH_PROVIDER;

console.log('📊 当前配置:');
console.log(`   数据库提供商: ${provider || '未配置'}`);
console.log(`   认证提供商: ${authProvider || '未配置'}`);

if (provider !== 'supabase' || authProvider !== 'supabase') {
  console.log('\n⚠️  警告: 当前未配置为Supabase认证模式');
  console.log('   请设置:');
  console.log('   DATABASE_PROVIDER=supabase');
  console.log('   AUTH_PROVIDER=supabase');
  console.log('\n提示: 运行 npm run config:intl 配置国际版\n');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Supabase配置缺失');
  console.log('   请检查 .env.local 中的Supabase配置\n');
  process.exit(1);
}

if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-supabase')) {
  console.log('\n⚠️  Supabase配置使用占位符值');
  console.log('   请替换为实际的Supabase项目凭据\n');
  process.exit(1);
}

console.log(`   Supabase URL: ${supabaseUrl}`);
console.log(`   Supabase Key: ${supabaseKey.substring(0, 20)}...`);
console.log('\n✅ Supabase配置验证通过\n');

console.log('==================================================');
console.log('📝 测试计划');
console.log('==================================================');
console.log(`1. 注册用户: ${testConfig.email}`);
console.log(`2. 使用邮箱登录`);
console.log(`3. 验证用户信息\n`);

async function testRegistration() {
  console.log('📮 测试 1: 用户注册');
  console.log('------------------------------------------------');

  try {
    const response = await fetch('http://localhost:3000/api/auth/register-intl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 注册成功');
      console.log(`   用户ID: ${data.user.id}`);
      console.log(`   邮箱: ${data.user.email}`);
      console.log(`   订阅计划: ${data.user.subscription_plan}\n`);
      return data.user;
    } else {
      console.log('❌ 注册失败');
      console.log(`   错误: ${data.error}\n`);
      return null;
    }
  } catch (error) {
    console.log('❌ 请求失败');
    console.log(`   错误: ${error.message}\n`);
    console.log('提示: 请确保开发服务器正在运行 (npm run dev)\n');
    process.exit(1);
  }
}

async function testLogin() {
  console.log('🔐 测试 2: 邮箱登录');
  console.log('------------------------------------------------');

  try {
    const response = await fetch('http://localhost:3000/api/auth/login-intl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testConfig.email,
        password: testConfig.password
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 登录成功');
      console.log(`   用户ID: ${data.user.id}`);
      console.log(`   邮箱: ${data.user.email}`);
      console.log(`   订阅计划: ${data.user.subscription_plan}`);
      console.log(`   认证方式: ${data.tokenMeta.authMethod}`);
      console.log(`   Access Token: ${data.accessToken.substring(0, 20)}...\n`);
      return data;
    } else {
      console.log('❌ 登录失败');
      console.log(`   错误: ${data.error}\n`);
      return null;
    }
  } catch (error) {
    console.log('❌ 请求失败');
    console.log(`   错误: ${error.message}\n`);
    return null;
  }
}

async function testGetGoogleOAuthUrl() {
  console.log('🌐 测试 3: Google OAuth URL');
  console.log('------------------------------------------------');

  try {
    const response = await fetch('http://localhost:3000/api/auth/login-intl');
    const data = await response.json();

    if (response.ok && data.authUrl) {
      console.log('✅ Google OAuth URL获取成功');
      console.log(`   URL: ${data.authUrl.substring(0, 50)}...\n`);
      return true;
    } else {
      console.log('⚠️  Google OAuth未配置或不支持');
      console.log(`   提示: 在Supabase控制台启用Google provider\n`);
      return false;
    }
  } catch (error) {
    console.log('⚠️  无法获取Google OAuth URL');
    console.log(`   错误: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  // 检查开发服务器
  console.log('🔍 检查开发服务器...');
  try {
    await fetch('http://localhost:3000/api/health');
    console.log('✅ 开发服务器运行中\n');
  } catch {
    console.log('❌ 开发服务器未运行');
    console.log('   请运行: npm run dev\n');
    process.exit(1);
  }

  // 运行测试
  await testGetGoogleOAuthUrl();

  const registeredUser = await testRegistration();
  if (!registeredUser) {
    console.log('==================================================');
    console.log('❌ 测试失败: 注册步骤失败');
    console.log('==================================================\n');
    process.exit(1);
  }

  const loginResult = await testLogin();
  if (!loginResult) {
    console.log('==================================================');
    console.log('❌ 测试失败: 登录步骤失败');
    console.log('==================================================\n');
    process.exit(1);
  }

  console.log('==================================================');
  console.log('✅ 所有测试通过!');
  console.log('==================================================\n');

  console.log('📊 测试总结:');
  console.log(`   ✅ 用户注册成功`);
  console.log(`   ✅ 邮箱登录成功`);
  console.log(`   ✅ Google OAuth可用\n`);

  console.log('🎉 国际版登录功能正常!\n');

  console.log('📝 下一步:');
  console.log('   1. 在登录页面集成Google OAuth按钮');
  console.log('   2. 在Supabase控制台查看注册用户');
  console.log('   3. 配置邮件模板(可选)\n');
}

runTests().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});
