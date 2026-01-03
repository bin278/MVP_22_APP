#!/usr/bin/env node

/**
 * 微信登录功能测试脚本
 * 用于全面测试微信登录功能的各个组件
 */

const https = require('https');

console.log('🔍 微信登录功能全面测试');
console.log('================================\n');

// 测试配置
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://mornfront.mornscience.top',
  timeout: 10000
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      headers: {
        'User-Agent': 'WeChat-Test-Script/1.0',
        ...options.headers
      },
      timeout: TEST_CONFIG.timeout,
      ...options
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.method === 'POST' && options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function runTests() {
  let allTestsPassed = true;

  // 1. 测试环境变量API
  console.log('1. 测试环境变量API (/api/env)');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/env`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ 环境变量API正常');
      console.log('   APP_URL:', response.data.env?.NEXT_PUBLIC_APP_URL || '未设置');
      console.log('   WECHAT_APP_ID:', response.data.env?.WECHAT_APP_ID || '未设置');

      if (!response.data.env?.NEXT_PUBLIC_APP_URL) {
        console.log('❌ NEXT_PUBLIC_APP_URL 未设置');
        allTestsPassed = false;
      }
    } else {
      console.log('❌ 环境变量API异常:', response.status);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ 环境变量API请求失败:', error.message);
    allTestsPassed = false;
  }

  console.log();

  // 2. 测试微信二维码生成API
  console.log('2. 测试微信二维码生成API (/api/auth/wechat/qrcode)');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/auth/wechat/qrcode?next=/`);

    if (response.status === 200 && response.data.supported) {
      console.log('✅ 微信二维码API正常');
      console.log('   二维码URL已生成:', !!response.data.qrcodeUrl);
      console.log('   回调地址:', response.data.redirectUri);

      if (response.data.redirectUri && response.data.redirectUri.includes('localhost')) {
        console.log('❌ 回调地址还是localhost，需要修复域名配置');
        allTestsPassed = false;
      } else if (response.data.redirectUri && response.data.redirectUri.includes(TEST_CONFIG.baseUrl.replace('https://', ''))) {
        console.log('✅ 回调地址正确');
      }
    } else {
      console.log('❌ 微信二维码API异常:', response.status);
      console.log('   响应:', response.data);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ 微信二维码API请求失败:', error.message);
    allTestsPassed = false;
  }

  console.log();

  // 3. 测试微信配置检查API
  console.log('3. 测试微信配置检查API (/api/wechat/config)');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/wechat/config`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ 微信配置检查API正常');
      const config = response.data.config;
      console.log('   环境:', config.environment.NODE_ENV);
      console.log('   域名配置:', config.status.appUrlConfigured ? '✅' : '❌');
      console.log('   微信AppID:', config.status.wechatAppIdConfigured ? '✅' : '❌');
      console.log('   微信Secret:', config.status.wechatAppSecretConfigured ? '✅' : '❌');
      console.log('   整体配置:', config.status.allConfigured ? '✅' : '❌');

      if (!config.status.allConfigured) {
        console.log('\n📋 修复建议:');
        response.data.recommendations.forEach((rec, i) => {
          console.log(`${i+1}. ${rec.issue}`);
          console.log(`   ${rec.solution}`);
        });
        allTestsPassed = false;
      }
    } else {
      console.log('❌ 微信配置检查API异常:', response.status);
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ 微信配置检查API请求失败:', error.message);
    allTestsPassed = false;
  }

  console.log();

  // 4. 总结
  console.log('================================');
  if (allTestsPassed) {
    console.log('🎉 所有测试通过！微信登录功能正常');
    console.log('\n🚀 您可以开始使用微信登录功能了！');
  } else {
    console.log('⚠️ 部分测试失败，需要修复配置问题');
    console.log('\n🔧 主要问题：');
    console.log('1. NEXT_PUBLIC_APP_URL 环境变量未设置');
    console.log('2. 微信相关的环境变量可能未设置');
    console.log('\n📋 解决步骤：');
    console.log('1. 登录腾讯云 CloudBase 控制台');
    console.log('2. 进入云托管 → 环境变量');
    console.log('3. 设置以下变量：');
    console.log('   - NEXT_PUBLIC_APP_URL=https://mornfront.mornscience.top');
    console.log('   - NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=cloud1-3gn61ziydcfe6a57');
    console.log('   - WECHAT_APP_ID=你的微信应用ID');
    console.log('   - WECHAT_APP_SECRET=你的微信应用密钥');
    console.log('4. 保存并重新部署');
  }
  console.log('================================\n');
}

// 运行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
