#!/usr/bin/env node

/**
 * 检查 CloudBase 部署状态和配置
 */

console.log('🔍 CloudBase 部署状态检查');
console.log('==========================\n');

console.log('📊 从浏览器日志分析：');
console.log('===================\n');

console.log('✅ CloudBase 初始化成功');
console.log('✅ 环境变量获取正常：');
console.log('   • NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: cloud1-3gn61ziydcfe6a57');
console.log('   • NEXT_PUBLIC_APP_URL: https://mornfront.mornscience.top');
console.log('   • WECHAT_APP_ID: wxdcd6dda48f3245e1');
console.log('');

console.log('✅ 用户认证正常');
console.log('✅ API 连接正常');
console.log('✅ 心跳包接收正常');
console.log('');

console.log('⚠️ 当前状态：代码生成仍限制在1分钟');
console.log('');

console.log('🔧 需要检查的项目：');
console.log('===================\n');

console.log('1️⃣ CloudBase 控制台超时设置');
console.log('----------------------------');
console.log('访问：https://console.cloud.tencent.com/tcb/');
console.log('路径：云托管 → [你的服务] → 设置');
console.log('检查：超时时间是否设置为 600 秒');
console.log('');

console.log('2️⃣ 环境变量配置');
console.log('----------------');
console.log('路径：云托管 → [你的服务] → 环境变量');
console.log('必需变量：');
console.log('• JWT_SECRET: [64位密钥]');
console.log('• DEEPSEEK_API_KEY: [你的API密钥]');
console.log('• NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: cloud1-3gn61ziydcfe6a57');
console.log('• NEXT_PUBLIC_APP_URL: https://mornfront.mornscience.top');
console.log('');

console.log('3️⃣ 应用重新部署状态');
console.log('--------------------');
console.log('检查是否应用了最新的 .cloudbaserc.json 配置');
console.log('确认超时时间已更新到 600 秒');
console.log('');

console.log('📝 立即操作步骤：');
console.log('================\n');

console.log('步骤1：检查 CloudBase 控制台');
console.log('---------------------------');
console.log('1. 登录 CloudBase 控制台');
console.log('2. 进入云托管服务');
console.log('3. 检查超时时间设置（应为 600 秒）');
console.log('4. 检查环境变量是否正确配置');
console.log('');

console.log('步骤2：如果超时时间不对');
console.log('----------------------');
console.log('1. 在设置页面修改超时时间为 600 秒');
console.log('2. 保存设置');
console.log('3. 重新部署应用');
console.log('');

console.log('步骤3：验证配置');
console.log('----------------');
console.log('1. 访问应用');
console.log('2. 尝试生成复杂代码');
console.log('3. 观察是否超过1分钟');
console.log('');

console.log('🔍 调试信息：');
console.log('============\n');

console.log('从你的日志可以看到：');
console.log('• 应用已成功部署');
console.log('• CloudBase SDK 初始化成功');
console.log('• 环境变量正确获取');
console.log('• 用户认证正常工作');
console.log('• API 请求发送成功');
console.log('• 心跳机制正常');
console.log('');

console.log('这意味着应用本身运行正常，主要问题是超时限制。');
console.log('');

console.log('🎯 最可能的原因：');
console.log('================\n');

console.log('1️⃣ CloudBase 控制台超时设置未更新');
console.log('   解决方案：手动在控制台设置为 600 秒');
console.log('');

console.log('2️⃣ .cloudbaserc.json 配置未生效');
console.log('   解决方案：重新部署应用应用新配置');
console.log('');

console.log('3️⃣ AI API 调用本身超时');
console.log('   解决方案：检查 DEEPSEEK_API_KEY 是否有效');
console.log('');

console.log('🚀 立即执行：');
console.log('============\n');

console.log('1. 检查 CloudBase 控制台超时设置');
console.log('2. 如果不是 600 秒，修改为 600 秒');
console.log('3. 重新部署应用');
console.log('4. 测试代码生成');
console.log('');

console.log('💡 如果问题持续存在，可以查看 CloudBase 的应用日志获取更详细的错误信息。\n');






