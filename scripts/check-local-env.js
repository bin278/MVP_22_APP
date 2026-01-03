#!/usr/bin/env node

/**
 * 本地环境变量检查脚本
 */

console.log('🔍 本地环境变量检查');
console.log('==================\n');

console.log('✅ 检查本地环境变量文件...');

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

console.log(`查找文件: ${envPath}`);

// 检查 .env.local 文件
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local 文件存在');

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  console.log('\n📋 已配置的环境变量:');
  const configuredVars = [];
  const missingVars = [];

  // 检查关键变量
  const requiredVars = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID',
    'WECHAT_APP_ID',
    'JWT_SECRET',
    'DEEPSEEK_API_KEY',
    'DEEPSEEK_BASE_URL'
  ];

  requiredVars.forEach(varName => {
    const hasVar = lines.some(line => line.startsWith(`${varName}=`));
    if (hasVar) {
      configuredVars.push(varName);
      const line = lines.find(line => line.startsWith(`${varName}=`));
      const value = line.split('=')[1];
      const maskedValue = value && value.length > 10 ? value.substring(0, 8) + '...' : value || '空';
      console.log(`   ✅ ${varName}: ${maskedValue}`);
    } else {
      missingVars.push(varName);
      console.log(`   ❌ ${varName}: 未设置`);
    }
  });

  console.log(`\n📊 配置状态: ${configuredVars.length}/${requiredVars.length} 个变量已配置`);

  if (missingVars.length > 0) {
    console.log('\n⚠️  缺失的变量:');
    missingVars.forEach(varName => {
      console.log(`   • ${varName}`);
    });

    console.log('\n🔧 修复建议:');
    console.log('   1. 复制 .env.example 到 .env.local（如果存在）');
    console.log('   2. 或者手动添加缺失的环境变量');
    console.log('   3. 重启开发服务器: npm run dev');
  } else {
    console.log('\n✅ 所有关键环境变量已配置！');
  }

} else {
  console.log('❌ .env.local 文件不存在');

  // 检查是否有 .env.example 文件
  if (fs.existsSync(envExamplePath)) {
    console.log('📄 发现 .env.example 文件，建议复制为模板');
    console.log('\n🔧 修复步骤:');
    console.log(`   cp ${envExamplePath} ${envPath}`);
    console.log('   # 然后编辑 .env.local 文件，填入正确的变量值');
  } else {
    console.log('\n🔧 创建 .env.local 文件:');
    console.log('   NEXT_PUBLIC_APP_URL=http://localhost:3000');
    console.log('   NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=your_env_id');
    console.log('   WECHAT_APP_ID=your_wechat_app_id');
    console.log('   JWT_SECRET=your_jwt_secret');
    console.log('   DEEPSEEK_API_KEY=your_api_key');
    console.log('   DEEPSEEK_BASE_URL=https://api.deepseek.com');
  }
}

console.log('\n🎯 环境变量检查完成！');
console.log('===================\n');

// 提供测试建议
console.log('🧪 测试建议:');
console.log('1. 设置好环境变量后，重启开发服务器');
console.log('2. 访问 http://localhost:3000/api/env 测试API');
console.log('3. 检查浏览器控制台是否还有环境变量错误');
console.log('4. 尝试进行代码生成测试SSE系统\n');






