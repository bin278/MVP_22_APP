#!/usr/bin/env node

/**
 * CloudBase 环境变量配置指南
 */

console.log('🔧 CloudBase 环境变量配置指南');
console.log('=============================\n');

console.log('⚠️ 当前问题：');
console.log('============');
console.log('• AI 代码生成仍然只限1分钟');
console.log('• 环境变量未正确配置');
console.log('• 超时配置可能未生效');
console.log('');

console.log('📋 必需的环境变量：');
console.log('==================\n');

const requiredVars = [
  {
    name: 'NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID',
    value: 'cloud1-3gn61ziydcfe6a57',
    description: 'CloudBase 环境ID（必需）'
  },
  {
    name: 'JWT_SECRET',
    value: '[需要生成64位随机字符串]',
    description: 'JWT 密钥（必需，用于身份验证）'
  },
  {
    name: 'DEEPSEEK_API_KEY',
    value: '[你的 DeepSeek API 密钥]',
    description: 'AI 模型 API 密钥（必需）'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    value: '[你的域名，如：https://mornfront.mornscience.top]',
    description: '应用域名（必需）'
  }
];

requiredVars.forEach((env, index) => {
  console.log(`${index + 1}. ${env.name}`);
  console.log(`   值: ${env.value}`);
  console.log(`   说明: ${env.description}`);
  console.log('');
});

console.log('🎯 CloudBase 控制台配置步骤：');
console.log('===========================\n');

console.log('步骤1：登录 CloudBase 控制台');
console.log('---------------------------');
console.log('访问：https://console.cloud.tencent.com/tcb/');
console.log('选择你的环境：cloud1-3gn61ziydcfe6a57');
console.log('');

console.log('步骤2：进入环境变量页面');
console.log('----------------------');
console.log('• 云托管 → [你的服务名]');
console.log('• 点击"环境变量"标签页');
console.log('• 点击"添加环境变量"');
console.log('');

console.log('步骤3：配置必需变量');
console.log('------------------');

requiredVars.forEach((env, index) => {
  console.log(`${index + 1}. 添加变量：${env.name}`);
  console.log(`   变量名：${env.name}`);
  console.log(`   变量值：${env.value}`);
  console.log(`   环境：生产环境`);
  console.log('');
});

console.log('步骤4：生成 JWT_SECRET');
console.log('----------------------');
console.log('运行命令生成安全密钥：');
console.log('node scripts/generate-jwt-secret.js');
console.log('');
console.log('复制生成的密钥到 CloudBase 环境变量中');
console.log('');

console.log('步骤5：验证配置');
console.log('----------------');
console.log('• 保存所有环境变量');
console.log('• 重新部署应用');
console.log('• 检查应用是否正常启动');
console.log('');

console.log('🔍 验证环境变量是否生效：');
console.log('========================\n');

console.log('方法1：检查应用日志');
console.log('在 CloudBase 控制台查看应用启动日志，确认：');
console.log('• NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID 已加载');
console.log('• JWT_SECRET 已配置');
console.log('• AI API 密钥已加载');
console.log('');

console.log('方法2：测试 API 端点');
console.log('访问应用域名测试以下端点：');
console.log('• /api/health - 健康检查');
console.log('• /api/env - 环境变量检查（如果配置了）');
console.log('');

console.log('方法3：测试 AI 功能');
console.log('• 访问应用首页');
console.log('• 尝试生成代码');
console.log('• 检查是否超过1分钟限制');
console.log('');

console.log('⚡ 立即解决步骤：');
console.log('================\n');

console.log('1. 生成 JWT 密钥：');
console.log('   node scripts/generate-jwt-secret.js');
console.log('');

console.log('2. CloudBase 控制台配置环境变量：');
console.log('   • NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID = cloud1-3gn61ziydcfe6a57');
console.log('   • JWT_SECRET = [生成的密钥]');
console.log('   • DEEPSEEK_API_KEY = [你的API密钥]');
console.log('   • NEXT_PUBLIC_APP_URL = [你的域名]');
console.log('');

console.log('3. 重新部署应用：');
console.log('   • 在 CloudBase 控制台触发重新部署');
console.log('   • 或推送代码到 GitHub 触发自动部署');
console.log('');

console.log('4. 测试结果：');
console.log('   • 访问应用');
console.log('   • 生成复杂代码');
console.log('   • 确认能生成超过1分钟');
console.log('');

console.log('🔧 备用方案：');
console.log('============\n');

console.log('如果配置后仍然超时，可以尝试：');
console.log('');

console.log('方案1：增加超时时间到 10 分钟');
console.log('已在 .cloudbaserc.json 中设置为 600 秒');
console.log('');

console.log('方案2：检查 CloudBase 服务配置');
console.log('在控制台：云托管 → 服务 → 设置 → 超时时间');
console.log('确保设置为 600 秒');
console.log('');

console.log('方案3：验证 AI API 配置');
console.log('确认 DEEPSEEK_API_KEY 有效且有足够额度');
console.log('');

console.log('📞 获取帮助：');
console.log('============\n');

console.log('运行诊断脚本：');
console.log('node scripts/diagnose-production-auth.js');
console.log('');
console.log('检查部署配置：');
console.log('node scripts/check-cloudbase-deployment.js');
console.log('');

console.log('🎯 关键检查点：');
console.log('==============');

console.log('✅ 环境变量已配置');
console.log('✅ JWT_SECRET 已生成');
console.log('✅ CloudBase 超时设置为 600 秒');
console.log('✅ 应用已重新部署');
console.log('✅ AI API 密钥有效');
console.log('');

console.log('🚀 执行完这些步骤后，AI 代码生成就能突破 1 分钟限制了！\n');






