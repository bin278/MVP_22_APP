#!/usr/bin/env node

/**
 * 生产环境环境变量诊断脚本
 * 用于检查腾讯云CloudBase中的环境变量配置
 */

// 配置
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://mornfront.mornscience.top',
  timeout: 10000
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const requestOptions = {
      headers: {
        'User-Agent': 'Env-Diagnostic-Script/1.0',
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

async function checkEnvironmentVariables() {
  console.log('🔍 生产环境环境变量诊断');
  console.log('================================\n');

  console.log('1. 检查环境变量API (/api/env)');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/env`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ 环境变量API正常');
      console.log('   环境变量详情:');

      const env = response.data.env;
      console.log(`   - NEXT_PUBLIC_APP_URL: ${env.NEXT_PUBLIC_APP_URL || '❌ 未设置'}`);
      console.log(`   - NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: ${env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || '❌ 未设置'}`);
      console.log(`   - WECHAT_APP_ID: ${env.WECHAT_APP_ID || '❌ 未设置'}`);
      console.log(`   - DEPLOYMENT_REGION: ${env.DEPLOYMENT_REGION || '未设置'}`);
      console.log(`   - NODE_ENV: ${env.NODE_ENV || '未设置'}`);

      // 诊断结果
      console.log('\n   📊 诊断结果:');
      if (!env.NEXT_PUBLIC_APP_URL) {
        console.log('   ❌ NEXT_PUBLIC_APP_URL 未设置 - 影响微信回调URL');
      } else if (!env.NEXT_PUBLIC_APP_URL.includes('mornfront.mornscience.top')) {
        console.log('   ⚠️  NEXT_PUBLIC_APP_URL 与域名不匹配');
      } else {
        console.log('   ✅ NEXT_PUBLIC_APP_URL 配置正确');
      }

      if (!env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID) {
        console.log('   ❌ NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID 未设置 - CloudBase无法初始化');
        console.log('   💡 请在腾讯云控制台设置: NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=cloud1-3gn61ziydcfe6a57');
      } else if (env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID !== 'cloud1-3gn61ziydcfe6a57') {
        console.log(`   ⚠️  NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID 值可能不正确: ${env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID}`);
      } else {
        console.log('   ✅ NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID 配置正确');
      }

      if (!env.WECHAT_APP_ID) {
        console.log('   ❌ WECHAT_APP_ID 未设置 - 微信登录无法工作');
      } else if (env.WECHAT_APP_ID !== 'wxdcd6dda48f3245e1') {
        console.log(`   ⚠️  WECHAT_APP_ID 值可能不正确: ${env.WECHAT_APP_ID}`);
      } else {
        console.log('   ✅ WECHAT_APP_ID 配置正确');
      }

    } else {
      console.log('❌ 环境变量API异常:', response.status);
      console.log('   响应:', response.data);
    }
  } catch (error) {
    console.log('❌ 环境变量API请求失败:', error.message);
  }

  console.log('\n2. 检查微信配置API (/api/wechat/config)');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/wechat/config`);

    if (response.status === 200 && response.data.success) {
      console.log('✅ 微信配置API正常');
      const config = response.data.config;
      console.log('   配置状态:');
      console.log(`   - 应用URL配置: ${config.status.appUrlConfigured ? '✅' : '❌'}`);
      console.log(`   - CloudBase环境ID配置: ${config.status.appUrlConfigured ? '✅' : '❌'}`);
      console.log(`   - 微信AppID配置: ${config.status.wechatAppIdConfigured ? '✅' : '❌'}`);
      console.log(`   - 微信Secret配置: ${config.status.wechatAppSecretConfigured ? '✅' : '❌'}`);
      console.log(`   - 整体配置: ${config.status.allConfigured ? '✅ 完整' : '❌ 不完整'}`);
    } else {
      console.log('❌ 微信配置API异常:', response.status);
    }
  } catch (error) {
    console.log('❌ 微信配置API请求失败:', error.message);
  }

  console.log('\n3. 诊断建议');
  console.log('================');

  console.log('如果仍有问题，请检查腾讯云CloudBase控制台的环境变量设置:');
  console.log('https://console.cloud.tencent.com/tcb');
  console.log('');
  console.log('必需的环境变量:');
  console.log('- NEXT_PUBLIC_APP_URL=https://mornfront.mornscience.top');
  console.log('- NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=cloud1-3gn61ziydcfe6a57');
  console.log('- WECHAT_APP_ID=wxdcd6dda48f3245e1');
  console.log('- WECHAT_APP_SECRET=[你的微信应用密钥]');
  console.log('- JWT_SECRET=[随机生成的密钥]');
  console.log('');
  console.log('注意: 变量名区分大小写，设置后需要重新部署才能生效！');

  console.log('\n================================\n');
}

// 运行诊断
checkEnvironmentVariables().catch(error => {
  console.error('诊断过程中发生错误:', error);
  process.exit(1);
});






