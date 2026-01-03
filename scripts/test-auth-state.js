#!/usr/bin/env node

/**
 * 认证状态测试脚本
 * 用于测试微信登录后的认证状态同步
 */

console.log('🔍 认证状态测试');
console.log('================\n');

// 模拟登录状态检查
function checkAuthState() {
  console.log('1. 检查localStorage中的认证状态...');

  try {
    // 检查新的认证状态存储
    const newAuthState = localStorage.getItem('app-auth-state');
    if (newAuthState) {
      console.log('✅ 发现新的认证状态 (app-auth-state)');
      const authData = JSON.parse(newAuthState);
      console.log('   用户ID:', authData.user?.id);
      console.log('   用户名:', authData.user?.name);
      console.log('   邮箱:', authData.user?.email);
      console.log('   AccessToken过期:', new Date(authData.savedAt + authData.tokenMeta.accessTokenExpiresIn * 1000));
      console.log('   RefreshToken过期:', new Date(authData.savedAt + authData.tokenMeta.refreshTokenExpiresIn * 1000));
    } else {
      console.log('❌ 未发现新的认证状态');
    }

    // 检查旧的认证状态存储（应该已经被清理）
    const oldUser = localStorage.getItem('cloudbase_user');
    const oldSession = localStorage.getItem('cloudbase_session');

    if (oldUser || oldSession) {
      console.log('⚠️  发现旧的认证状态（应该已被清理）');
      console.log('   cloudbase_user:', !!oldUser);
      console.log('   cloudbase_session:', !!oldSession);
    } else {
      console.log('✅ 旧的认证状态已被清理');
    }

  } catch (error) {
    console.error('❌ 检查认证状态失败:', error);
  }

  console.log();
}

// 模拟API调用测试
async function testAPI() {
  console.log('2. 测试认证相关API...');

  try {
    // 测试环境变量API
    console.log('   测试 /api/env...');
    const envResponse = await fetch('/api/env');
    if (envResponse.ok) {
      const envData = await envResponse.json();
      console.log('   ✅ /api/env 正常');
      console.log('   WECHAT_APP_ID:', envData.env?.WECHAT_APP_ID || '未设置');
    } else {
      console.log('   ❌ /api/env 失败:', envResponse.status);
    }

    // 测试微信二维码API
    console.log('   测试 /api/auth/wechat/qrcode...');
    const qrResponse = await fetch('/api/auth/wechat/qrcode?next=/');
    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      console.log('   ✅ 微信二维码API正常');
      console.log('   回调地址:', qrData.redirectUri);
    } else {
      console.log('   ❌ 微信二维码API失败:', qrResponse.status);
    }

  } catch (error) {
    console.error('❌ API测试失败:', error);
  }

  console.log();
}

// 给出建议
function giveRecommendations() {
  console.log('3. 故障排除建议:');

  console.log('   如果微信登录后首页仍显示未登录：');
  console.log('   1. 检查浏览器控制台是否有认证状态保存的日志');
  console.log('   2. 确认 localStorage 中有 "app-auth-state" 键');
  console.log('   3. 检查回调页面是否正确跳转');
  console.log('   4. 确认 CloudBase 环境变量已正确设置');

  console.log('\n   如果认证状态不一致：');
  console.log('   1. 清除浏览器缓存和localStorage');
  console.log('   2. 重新登录测试');
  console.log('   3. 检查网络请求是否成功');

  console.log('\n   调试命令：');
  console.log('   - 检查认证状态: localStorage.getItem("app-auth-state")');
  console.log('   - 检查环境变量: fetch("/api/env").then(r=>r.json()).then(d=>console.log(d))');
  console.log('   - 检查微信配置: fetch("/api/wechat/config").then(r=>r.json()).then(d=>console.log(d))');

  console.log('\n================\n');
}

// 在浏览器环境中运行
if (typeof window !== 'undefined') {
  console.log('🌐 在浏览器环境中运行测试...\n');
  checkAuthState();
  testAPI().then(() => {
    giveRecommendations();
  });
} else {
  console.log('💻 在Node.js环境中，请在浏览器控制台运行此脚本\n');
  console.log('复制以下代码到浏览器控制台：\n');
  console.log(`
(function() {
  console.log('🔍 认证状态测试');
  console.log('================');

  // 检查认证状态
  const authState = localStorage.getItem('app-auth-state');
  if (authState) {
    console.log('✅ 发现认证状态');
    const data = JSON.parse(authState);
    console.log('用户:', data.user.name || data.user.email);
  } else {
    console.log('❌ 未发现认证状态');
  }

  // 测试API
  fetch('/api/env').then(r => r.json()).then(d => {
    console.log('环境变量:', d.env.WECHAT_APP_ID ? '已设置' : '未设置');
  });

  fetch('/api/wechat/config').then(r => r.json()).then(d => {
    console.log('微信配置:', d.config.status.allConfigured ? '完整' : '不完整');
  });
})();
  `);
}






