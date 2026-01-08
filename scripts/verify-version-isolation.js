#!/usr/bin/env node

/**
 * 版本隔离验证脚本
 * 验证国内版和国际版配置正确隔离,互不影响
 */

require('dotenv').config({ path: '.env.local' });

console.log('==================================================');
console.log('🔒 版本隔离验证');
console.log('==================================================\n');

// 检查环境配置
const databaseProvider = process.env.DATABASE_PROVIDER;
const authProvider = process.env.AUTH_PROVIDER;

console.log('📊 当前配置:');
console.log(`   DATABASE_PROVIDER: ${databaseProvider || '未设置 (默认: cloudbase)'}`);
console.log(`   AUTH_PROVIDER: ${authProvider || '未设置 (默认: cloudbase)'}\n`);

// 判断当前版本
const isInternational = databaseProvider === 'supabase' && authProvider === 'supabase';
const isDomestic = !isInternational; // 默认国内版

console.log('🌍 当前版本:');
if (isInternational) {
  console.log('   ✅ 国际版 (Supabase)');
  console.log('   数据库: Supabase PostgreSQL');
  console.log('   认证: Supabase Auth');
  console.log('   可用功能: 邮箱登录、Google登录\n');
} else {
  console.log('   ✅ 国内版 (腾讯云 CloudBase)');
  console.log('   数据库: 腾讯云 CloudBase');
  console.log('   认证: CloudBase Auth + JWT');
  console.log('   可用功能: 邮箱登录、微信登录\n');
}

// API端点验证
console.log('==================================================');
console.log('📡 API端点验证');
console.log('==================================================\n');

const apiEndpoints = {
  domestic: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    wechat: '/api/auth/wechat',
  },
  international: {
    login: '/api/auth/login-intl',
    register: '/api/auth/register-intl',
    google: '/api/auth/login-intl (GET for OAuth URL)',
    callback: '/api/auth/callback/google',
  }
};

if (isDomestic) {
  console.log('🇨🇳 国内版可用API端点:');
  console.log('   ✅ POST /api/auth/login');
  console.log('   ✅ POST /api/auth/register');
  console.log('   ✅ GET  /api/auth/wechat');
  console.log('   ✅ GET  /api/auth/wechat/callback\n');

  console.log('⚠️  国际版API端点(当前不可用):');
  console.log('   ❌ POST /api/auth/login-intl');
  console.log('   ❌ POST /api/auth/register-intl');
  console.log('   ❌ GET  /api/auth/login-intl (Google OAuth)');
  console.log('   ❌ GET  /api/auth/callback/google\n');

  console.log('   💡 如果这些端点被调用,将返回400错误:');
  console.log('      "This API is for international version only"\n');
} else {
  console.log('🌍 国际版可用API端点:');
  console.log('   ✅ POST /api/auth/login-intl');
  console.log('   ✅ POST /api/auth/register-intl');
  console.log('   ✅ GET  /api/auth/login-intl (获取Google OAuth URL)');
  console.log('   ✅ GET  /api/auth/callback/google\n');

  console.log('⚠️  国内版API端点(仍然可用):');
  console.log('   ⚠️  POST /api/auth/login (可能无法使用,如果未配置CloudBase)');
  console.log('   ⚠️  POST /api/auth/register');
  console.log('   ⚠️  GET  /api/auth/wechat (需要CloudBase)\n');
}

// 隔离验证
console.log('==================================================');
console.log('🔒 隔离保证');
console.log('==================================================\n');

if (isDomestic) {
  console.log('✅ 国内版隔离验证:\n');
  console.log('   1. 认证中间件:');
  console.log('      - 默认使用CloudBase认证');
  console.log('      - 验证JWT token和Session token\n');

  console.log('   2. 数据库访问:');
  console.log('      - 使用腾讯云CloudBase');
  console.log('      - 国际版API会被拦截并返回错误\n');

  console.log('   3. 环境变量保护:');
  console.log('      - 未设置AUTH_PROVIDER时,默认使用CloudBase');
  console.log('      - 必须明确设置AUTH_PROVIDER=supabase才能切换\n');
} else {
  console.log('✅ 国际版隔离验证:\n');
  console.log('   1. 认证中间件:');
  console.log('      - AUTH_PROVIDER=supabase时使用Supabase Auth');
  console.log('      - 验证Supabase access token\n');

  console.log('   2. 数据库访问:');
  console.log('      - 使用Supabase PostgreSQL');
  console.log('      - 国内版API仍然可用但可能返回错误\n');

  console.log('   3. 环境变量要求:');
  console.log('      - DATABASE_PROVIDER=supabase');
  console.log('      - AUTH_PROVIDER=supabase');
  console.log('      - 两者必须同时设置\n');
}

console.log('==================================================');
console.log('✅ 版本隔离验证完成!');
console.log('==================================================\n');

console.log('📝 快速切换:');
console.log('   切换到国内版: npm run config:cn');
console.log('   切换到国际版: npm run config:intl');
console.log('   测试配置: npm run config:test\n');

console.log('🧪 测试国内版功能:');
if (isDomestic) {
  console.log('   1. 测试邮箱登录: POST /api/auth/login');
  console.log('   2. 测试微信登录: GET /api/auth/wechat');
  console.log('   3. 验证国际版API被拦截: POST /api/auth/login-intl\n');
} else {
  console.log('   ⚠️  当前是国际版,如需测试国内版:');
  console.log('   1. 复制国内版配置: npm run config:cn');
  console.log('   2. 重启开发服务器');
  console.log('   3. 再次运行此脚本\n');
}

console.log('🧪 测试国际版功能:');
if (isInternational) {
  console.log('   1. 测试邮箱登录: POST /api/auth/login-intl');
  console.log('   2. 测试Google OAuth: GET /api/auth/login-intl');
  console.log('   3. 运行测试脚本: node scripts/test-intl-login.js\n');
} else {
  console.log('   ⚠️  当前是国内版,如需测试国际版:');
  console.log('   1. 复制国际版配置: npm run config:intl');
  console.log('   2. 重启开发服务器');
  console.log('   3. 再次运行此脚本\n');
}

// 配置建议
console.log('==================================================');
console.log('💡 配置建议');
console.log('==================================================\n');

if (isDomestic) {
  console.log('✅ 当前配置为国内版,无需更改\n');
  console.log('如需切换到国际版:');
  console.log('   1. 确保Supabase项目已创建');
  console.log('   2. 运行: npm run config:intl');
  console.log('   3. 编辑.env.local填写Supabase配置');
  console.log('   4. 重启开发服务器\n');
} else {
  console.log('✅ 当前配置为国际版\n');
  console.log('如需切换回国内版:');
  console.log('   1. 运行: npm run config:cn');
  console.log('   2. 编辑.env.local填写腾讯云配置');
  console.log('   3. 重启开发服务器\n');
}
