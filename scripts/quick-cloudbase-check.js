#!/usr/bin/env node

/**
 * CloudBase 配置快速检查
 */

console.log('🔍 CloudBase 配置快速检查');
console.log('=========================\n');

console.log('📋 检查清单：');
console.log('============\n');

// 检查本地环境变量
console.log('1️⃣ 本地环境变量检查：');
console.log('-------------------');

const requiredEnvVars = [
  'JWT_SECRET',
  'DEEPSEEK_API_KEY',
  'DEEPSEEK_BASE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID'
];

const optionalEnvVars = [
  'WECHAT_APP_ID',
  'WECHAT_APP_SECRET'
];

console.log('必需变量：');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ${value.length > 20 ? value.substring(0, 20) + '...' : value}`);
  } else {
    console.log(`   ❌ ${envVar}: 未设置`);
  }
});

console.log('\n可选变量：');
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ${value.length > 20 ? value.substring(0, 20) + '...' : value}`);
  } else {
    console.log(`   ⚠️  ${envVar}: 未设置（可选）`);
  }
});

console.log('\n2️⃣ CloudBase 配置要求：');
console.log('----------------------');

console.log('控制台设置：');
console.log('   🌐 https://console.cloud.tencent.com/tcb/');
console.log('');

console.log('环境变量配置：');
console.log('   - JWT_SECRET: [必需] 64位随机字符串');
console.log('   - DEEPSEEK_API_KEY: [必需] AI API密钥');
console.log('   - DEEPSEEK_BASE_URL: [必需] https://api.deepseek.com/v1');
console.log('   - NEXT_PUBLIC_APP_URL: [必需] 生产域名');
console.log('   - NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: [必需] 环境ID');
console.log('');

console.log('超时设置：');
console.log('   - 云托管 → 设置 → 超时时间: 300秒');
console.log('');

console.log('构建配置：');
console.log('   - 构建命令: pnpm build');
console.log('   - 输出目录: .next');
console.log('   - Node.js版本: 18');
console.log('');

console.log('3️⃣ 生成 JWT_SECRET：');
console.log('-------------------');

console.log('运行命令：');
console.log('   node scripts/generate-jwt-secret.js');
console.log('');

console.log('4️⃣ 部署检查：');
console.log('-------------');

console.log('部署前确认：');
console.log('   ✅ 代码已提交到GitHub');
console.log('   ✅ 本地构建测试通过 (npm run build)');
console.log('   ✅ 所有环境变量已配置');
console.log('   ✅ 超时时间设置为300秒');
console.log('   ✅ GitHub仓库已关联');
console.log('');

console.log('5️⃣ 故障排除：');
console.log('-------------');

console.log('如果部署失败：');
console.log('   - 检查 CloudBase 控制台的部署日志');
console.log('   - 确认环境变量名称和值正确');
console.log('   - 验证GitHub仓库权限');
console.log('');

console.log('如果生成超时：');
console.log('   - 确认超时时间为300秒');
console.log('   - 检查AI API密钥是否有效');
console.log('   - 查看CloudBase运行日志');
console.log('');

console.log('6️⃣ 验证部署：');
console.log('-------------');

console.log('部署后测试：');
console.log('   - 访问生产环境域名');
console.log('   - 测试用户登录');
console.log('   - 生成简单代码（验证流式效果）');
console.log('   - 生成复杂代码（验证异步切换）');
console.log('');

console.log('🎯 快速部署命令：');
console.log('================');

console.log('# 1. 生成JWT密钥');
console.log('node scripts/generate-jwt-secret.js');
console.log('');

console.log('# 2. 本地测试构建');
console.log('npm run build');
console.log('');

console.log('# 3. 提交代码');
console.log('git add . && git commit -m "deploy: 更新CloudBase配置" && git push');
console.log('');

console.log('# 4. CloudBase 控制台配置');
console.log('# - 设置超时时间: 300秒');
console.log('# - 配置环境变量');
console.log('# - 部署应用');
console.log('');

console.log('🚀 现在就开始配置吧！\n');

console.log('💡 提示：');
console.log('========');
console.log('如果还有问题，运行以下诊断脚本：');
console.log('   node scripts/diagnose-production-auth.js');
console.log('   node scripts/verify-cloudbase-timeout.js');
console.log('   node scripts/deploy-to-cloudbase.js');
console.log('');






