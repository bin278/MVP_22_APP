'use strict';

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
