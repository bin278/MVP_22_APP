#!/usr/bin/env node

/**
 * CloudBase 云托管部署指南
 * 解决复杂代码生成中断问题
 */

console.log('🚀 CloudBase 云托管完整部署指南');
console.log('================================\n');

console.log('🎯 目标：解决复杂代码生成只能生成1分钟的问题');
console.log('✅ 方案：配置超时时间 + 智能流式生成\n');

console.log('📋 部署步骤：');
console.log('============\n');

console.log('🔹 步骤1：准备代码');
console.log('================');

console.log('1. 确保所有代码已提交到GitHub：');
console.log('   git add .');
console.log('   git commit -m "feat: 智能流式生成优化"');
console.log('   git push origin main');
console.log('');

console.log('2. 验证本地构建：');
console.log('   npm run build  # 确保编译通过');
console.log('');

console.log('🔹 步骤2：CloudBase 控制台配置');
console.log('==============================');

console.log('1. 登录腾讯云控制台：');
console.log('   https://console.cloud.tencent.com/tcb/');
console.log('');

console.log('2. 选择项目和环境：');
console.log('   - 选择你的项目');
console.log('   - 进入云托管页面');
console.log('');

console.log('3. 配置环境变量（重要！）：');
console.log('   进入 "环境变量" 标签页，点击 "添加环境变量"');
console.log('');

console.log('   必需的环境变量：');
console.log('   ================');
console.log('');
console.log('   🔑 JWT_SECRET（必需）：');
console.log('   - 变量名: JWT_SECRET');
console.log('   - 变量值: [运行 node scripts/generate-jwt-secret.js 生成]');
console.log('   - 环境: 生产环境');
console.log('');

console.log('   🤖 AI API配置：');
console.log('   - 变量名: DEEPSEEK_API_KEY');
console.log('   - 变量值: [你的DeepSeek API Key]');
console.log('   - 变量名: DEEPSEEK_BASE_URL');
console.log('   - 变量值: https://api.deepseek.com/v1');
console.log('');

console.log('   🌐 应用配置：');
console.log('   - 变量名: NEXT_PUBLIC_APP_URL');
console.log('   - 变量值: https://你的域名.com （生产环境域名）');
console.log('   - 变量名: NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID');
console.log('   - 变量值: [你的CloudBase环境ID]');
console.log('');

console.log('   💳 支付配置（可选）：');
console.log('   - 变量名: WECHAT_APP_ID');
console.log('   - 变量值: [微信应用ID]');
console.log('   - 变量名: WECHAT_APP_SECRET');
console.log('   - 变量值: [微信应用Secret]');
console.log('');

console.log('4. 配置超时时间（关键！）：');
console.log('   - 进入 "设置" 标签页');
console.log('   - 找到 "超时时间" 设置');
console.log('   - 设置为: 300秒 (5分钟)');
console.log('   - 点击 "保存"');
console.log('');

console.log('🔹 步骤3：连接GitHub仓库');
console.log('========================');

console.log('1. 在云托管页面，点击 "部署管理"');
console.log('2. 点击 "关联仓库" 或 "绑定代码源"');
console.log('3. 选择 GitHub 作为代码源');
console.log('4. 授权腾讯云访问你的GitHub仓库');
console.log('5. 选择你的仓库和分支（main/master）');
console.log('');

console.log('🔹 步骤4：配置构建');
console.log('==================');

console.log('1. 构建命令：');
console.log('   pnpm build  # 或者 npm run build');
console.log('');

console.log('2. 输出目录：');
console.log('   .next  # Next.js 构建输出目录');
console.log('');

console.log('3. Node.js 版本：');
console.log('   18 或 20  # 推荐使用 18');
console.log('');

console.log('🔹 步骤5：部署和验证');
console.log('====================');

console.log('1. 点击 "立即部署"');
console.log('2. 等待部署完成（大约3-5分钟）');
console.log('3. 查看部署日志，确认无错误');
console.log('');

console.log('2. 验证部署结果：');
console.log('   - 访问你的域名');
console.log('   - 测试登录功能');
console.log('   - 测试简单代码生成（应该有流式效果）');
console.log('   - 测试复杂代码生成（应该自动切换到异步模式）');
console.log('');

console.log('🔧 故障排除：');
console.log('============');

console.log('❌ 如果部署失败：');
console.log('   - 检查构建日志');
console.log('   - 确认所有环境变量正确');
console.log('   - 检查GitHub仓库权限');
console.log('');

console.log('❌ 如果生成还是超时：');
console.log('   - 确认超时时间设置为300秒');
console.log('   - 检查AI API密钥是否有效');
console.log('   - 查看CloudBase日志中的错误');
console.log('');

console.log('❌ 如果没有流式效果：');
console.log('   - 检查JWT_SECRET是否正确配置');
console.log('   - 确认WebSocket连接正常');
console.log('   - 查看浏览器开发者工具');
console.log('');

console.log('📞 获取帮助：');
console.log('============');

console.log('🔍 诊断脚本：');
console.log('   node scripts/diagnose-production-auth.js');
console.log('   node scripts/verify-cloudbase-timeout.js');
console.log('');

console.log('📊 监控工具：');
console.log('   - CloudBase 控制台 → 云托管 → 日志');
console.log('   - 浏览器开发者工具 → Network → WS/WebSocket');
console.log('');

console.log('🎯 预期效果：');
console.log('============');

console.log('✅ 部署成功：应用正常运行');
console.log('✅ 简单生成：实时流式效果');
console.log('✅ 复杂生成：自动切换异步模式');
console.log('✅ 超时解决：支持长时间生成');
console.log('✅ 用户体验：无缝的生成体验');

console.log('\n🚀 开始部署吧！\n');

// 生成配置检查清单
console.log('📋 部署前检查清单：');
console.log('==================');

console.log('✅ 代码已提交到GitHub');
console.log('✅ 本地构建测试通过');
console.log('✅ JWT_SECRET 已生成');
console.log('✅ CloudBase 环境变量已配置');
console.log('✅ 超时时间设置为300秒');
console.log('✅ GitHub 仓库已关联');
console.log('✅ 构建配置正确');

console.log('\n🎉 祝部署顺利！\n');






