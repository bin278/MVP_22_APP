// 创建CloudBase云函数用于发送邮箱验证码
const fs = require('fs');
const path = require('path');

// 云函数代码
const functionCode = `'use strict';

const cloudbase = require('@cloudbase/node-sdk');

exports.main = async (event, context) => {
  try {
    console.log('收到发送验证码请求:', event);

    const { email } = event;

    if (!email) {
      return {
        success: false,
        error: '邮箱地址不能为空'
      };
    }

    // 初始化CloudBase
    const app = cloudbase.init({
      env: process.env.TENCENT_CLOUD_ENV_ID,
      secretId: process.env.TENCENT_CLOUD_SECRET_ID,
      secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
    });

    const auth = app.auth();

    // 发送验证码
    try {
      await auth.sendEmailCode(email);
      console.log('验证码发送成功:', email);

      return {
        success: true,
        message: '验证码发送成功'
      };
    } catch (sendError) {
      console.error('发送验证码失败:', sendError);

      return {
        success: false,
        error: sendError.message || '发送验证码失败'
      };
    }

  } catch (error) {
    console.error('云函数执行失败:', error);

    return {
      success: false,
      error: error.message || '云函数执行失败'
    };
  }
};
`;

// 包配置文件
const packageJson = `{
  "name": "send-email-verification",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@cloudbase/node-sdk": "^2.23.1"
  }
}
`;

// 创建云函数目录
const functionDir = path.join(__dirname, '..', 'cloud-functions', 'sendEmailVerification');

if (!fs.existsSync(functionDir)) {
  fs.mkdirSync(functionDir, { recursive: true });
}

// 写入文件
fs.writeFileSync(path.join(functionDir, 'index.js'), functionCode);
fs.writeFileSync(path.join(functionDir, 'package.json'), packageJson);

// 创建部署配置
const deployConfig = `{
  "name": "sendEmailVerification",
  "runtime": "Nodejs10",
  "handler": "index.main",
  "timeout": 60
}
`;

fs.writeFileSync(path.join(functionDir, 'cloudbaserc.json'), deployConfig);

console.log('✅ CloudBase云函数创建完成！');
console.log('📁 云函数位置:', functionDir);
console.log('');
console.log('🚀 部署步骤:');
console.log('1. 复制整个 sendEmailVerification 文件夹到您的CloudBase项目');
console.log('2. 在CloudBase控制台部署此云函数');
console.log('3. 或者使用 CloudBase CLI 部署:');
console.log('   cloudbase functions:deploy sendEmailVerification');
console.log('');
console.log('📧 云函数功能:');
console.log('- 接收邮箱地址参数');
console.log('- 调用CloudBase auth.sendEmailCode() 发送验证码');
console.log('- 返回发送结果');
console.log('');
console.log('🔧 前端调用示例:');
console.log(`const result = await app.callFunction({
  name: 'sendEmailVerification',
  data: { email: 'user@example.com' }
});`);




