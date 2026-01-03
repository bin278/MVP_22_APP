#!/usr/bin/env node

/**
 * 紧急修复生产环境认证问题的脚本
 */

console.log('🚨 生产环境认证问题紧急修复');
console.log('=============================\n');

console.log('🔍 问题诊断：');
console.log('   - 历史记录API返回401 Unauthorized');
console.log('   - 认证失败，token可能过期');
console.log('   - 最可能原因是JWT_SECRET未在生产环境配置\n');

console.log('🎯 解决方案：');
console.log('=============\n');

// 生成JWT密钥
const crypto = require('crypto');
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('📝 步骤1：复制以下JWT密钥');
console.log('===========================');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('');

console.log('📝 步骤2：配置到CloudBase环境变量');
console.log('==================================');

console.log('🔹 操作步骤：');
console.log('   1. 登录腾讯云控制台');
console.log('   2. 进入 CloudBase → 云托管');
console.log('   3. 点击你的应用服务');
console.log('   4. 进入 "环境变量" 标签页');
console.log('   5. 点击 "添加环境变量"');
console.log('   6. 填写信息：');
console.log('      - 变量名: JWT_SECRET');
console.log('      - 变量值: [上面生成的密钥]');
console.log('      - 环境: 生产环境');
console.log('   7. 点击 "保存"');
console.log('');

console.log('📝 步骤3：重新部署应用');
console.log('=======================');

console.log('🔹 操作步骤：');
console.log('   1. 在CloudBase控制台');
console.log('   2. 进入 "部署管理" 标签页');
console.log('   3. 点击 "重新部署"');
console.log('   4. 等待部署完成（大约2-3分钟）');
console.log('');

console.log('📝 步骤4：验证修复');
console.log('==================');

console.log('🔹 验证方法：');
console.log('   1. 访问你的生产环境应用');
console.log('   2. 尝试登录（邮箱或微信）');
console.log('   3. 尝试生成代码并查看历史记录');
console.log('   4. 检查是否还有401错误');
console.log('');

console.log('🔧 备用方案：');
console.log('============');

console.log('如果上述方法不工作，尝试：');
console.log('   1. 检查其他必需的环境变量是否都已配置');
console.log('   2. 确认数据库连接正常');
console.log('   3. 检查CloudBase服务状态');
console.log('');

console.log('📞 获取帮助：');
console.log('============');

console.log('如果问题持续存在：');
console.log('   1. 运行诊断脚本：node scripts/diagnose-production-auth.js');
console.log('   2. 检查浏览器开发者工具的Network标签');
console.log('   3. 查看CloudBase日志');
console.log('');

console.log('🎯 预期结果：');
console.log('============');

console.log('修复后应该能够：');
console.log('   ✅ 正常登录（邮箱和微信）');
console.log('   ✅ 正常生成代码');
console.log('   ✅ 正常查看历史记录');
console.log('   ✅ API不再返回401错误');
console.log('');

console.log('🚀 现在开始修复吧！\n');

// 额外输出生成的密钥，方便复制
console.log('📋 再次提供JWT密钥（方便复制）：');
console.log('=====================================');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('');

// 保存到文件
const fs = require('fs');
const envFile = '.env.production.jwt';
fs.writeFileSync(envFile, `JWT_SECRET=${jwtSecret}\n`);
console.log(`💾 JWT密钥已保存到 ${envFile} 文件`);
console.log('   你可以直接复制此文件的内容到CloudBase环境变量中\n');

console.log('✨ 修复完成，祝你好运！\n');






