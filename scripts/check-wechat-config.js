#!/usr/bin/env node

/**
 * 微信配置诊断脚本
 * 用于检查腾讯云 CloudBase 环境中的微信登录配置
 */

console.log('🔍 微信登录配置诊断工具');
console.log('================================\n');

// 1. 检查基本环境变量
console.log('1. 环境变量检查:');
console.log('   NODE_ENV:', process.env.NODE_ENV || '未设置');

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
console.log('   NEXT_PUBLIC_APP_URL:', appUrl ? appUrl : '❌ 未设置');

const wechatAppId = process.env.WECHAT_APP_ID;
console.log('   WECHAT_APP_ID:', wechatAppId ? '✅ 已设置' : '❌ 未设置');

const wechatAppSecret = process.env.WECHAT_APP_SECRET;
console.log('   WECHAT_APP_SECRET:', wechatAppSecret ? '✅ 已设置' : '❌ 未设置');

console.log();

// 2. 域名配置分析
console.log('2. 域名配置分析:');
if (!appUrl) {
  console.log('❌ NEXT_PUBLIC_APP_URL 未设置');
  console.log('   这将导致微信回调URL指向 http://localhost:3000/auth/callback');
  console.log();
  console.log('🛠️ 修复方法:');
  console.log('   在腾讯云 CloudBase 控制台的环境变量中设置:');
  console.log('   NEXT_PUBLIC_APP_URL=https://你的域名.cloudbaseapp.cn');
} else if (appUrl.includes('localhost')) {
  console.log('⚠️  NEXT_PUBLIC_APP_URL 指向本地开发环境');
  console.log('   当前值:', appUrl);
  console.log('   生产环境应该使用实际域名');
  console.log();
  console.log('🛠️ 修复方法:');
  console.log('   1. 获取你的 CloudBase 域名:');
  console.log('      - 登录腾讯云 CloudBase 控制台');
  console.log('      - 进入云托管 → 域名管理');
  console.log('      - 复制域名 (类似: https://abc123.cloudbaseapp.cn)');
  console.log('   2. 设置环境变量:');
  console.log('      NEXT_PUBLIC_APP_URL=https://你的域名.cloudbaseapp.cn');
} else {
  console.log('✅ NEXT_PUBLIC_APP_URL 配置正确:', appUrl);
}

console.log();

// 3. 微信配置完整性检查
console.log('3. 微信配置完整性检查:');
let wechatConfigComplete = true;

if (!wechatAppId) {
  console.log('❌ WECHAT_APP_ID 未设置');
  wechatConfigComplete = false;
}

if (!wechatAppSecret) {
  console.log('❌ WECHAT_APP_SECRET 未设置');
  wechatConfigComplete = false;
}

if (!appUrl || appUrl.includes('localhost')) {
  console.log('❌ 回调域名配置不正确');
  wechatConfigComplete = false;
}

if (wechatConfigComplete) {
  console.log('✅ 微信配置完整');
} else {
  console.log('❌ 微信配置不完整');
}

console.log();

// 4. 微信测试URL生成
console.log('4. 微信测试URL预览:');
if (wechatAppId && appUrl && !appUrl.includes('localhost')) {
  const testRedirectUri = encodeURIComponent(`${appUrl.replace(/\/$/, '')}/auth/callback`);
  const testUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${wechatAppId}&redirect_uri=${testRedirectUri}&response_type=code&scope=snsapi_login&state=test#wechat_redirect`;

  console.log('✅ 测试URL生成成功:');
  console.log('   完整URL:', testUrl);
  console.log('   回调地址:', decodeURIComponent(testRedirectUri));
} else {
  console.log('❌ 无法生成测试URL，配置不完整');
}

console.log();

// 5. 总结和建议
console.log('5. 配置建议:');
if (wechatConfigComplete && appUrl && !appUrl.includes('localhost')) {
  console.log('🎉 微信登录配置正确！可以正常使用。');
} else {
  console.log('⚠️  需要修复以下问题:');
  if (!appUrl) {
    console.log('   - 设置 NEXT_PUBLIC_APP_URL 环境变量');
  } else if (appUrl.includes('localhost')) {
    console.log('   - 将 NEXT_PUBLIC_APP_URL 更改为生产域名');
  }
  if (!wechatAppId) {
    console.log('   - 设置 WECHAT_APP_ID 环境变量');
  }
  if (!wechatAppSecret) {
    console.log('   - 设置 WECHAT_APP_SECRET 环境变量');
  }
}

console.log();
console.log('📞 获取 CloudBase 域名的步骤:');
console.log('   1. 登录腾讯云 CloudBase 控制台: https://console.cloud.tencent.com/tcb');
console.log('   2. 选择你的环境');
console.log('   3. 点击左侧"云托管"');
console.log('   4. 点击"域名管理"');
console.log('   5. 复制域名 (类似: abc123.cloudbaseapp.cn)');
console.log('   6. 设置 NEXT_PUBLIC_APP_URL=https://你的域名.cloudbaseapp.cn');

console.log('\n================================\n');






