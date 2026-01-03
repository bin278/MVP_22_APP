#!/usr/bin/env node

/**
 * 检查JWT配置的脚本
 */

const https = require('https');
const http = require('http');

const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 10000
};

const isLocalhost = TEST_CONFIG.baseUrl.includes('localhost');
const client = isLocalhost ? http : https;

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      headers: {
        'User-Agent': 'JWT-Config-Checker/1.0',
        ...options.headers
      },
      timeout: TEST_CONFIG.timeout,
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
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

async function checkJWTConfig() {
  console.log('🔐 JWT配置检查工具');
  console.log('==================\n');

  console.log('📍 检查位置：', TEST_CONFIG.baseUrl);
  console.log('');

  try {
    // 1. 检查环境变量API
    console.log('1️⃣ 检查环境变量API...');
    const envResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/env`);
    if (envResponse.status === 200) {
      console.log('✅ 环境变量API正常');
    } else {
      console.log('❌ 环境变量API异常');
      return;
    }

    // 2. 检查JWT_SECRET配置
    console.log('\n2️⃣ 检查JWT_SECRET配置...');
    const debugResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/debug-generate`);
    if (debugResponse.status === 200 && debugResponse.data) {
      const jwtStatus = debugResponse.data.JWT_SECRET;
      if (jwtStatus === '✅') {
        console.log('✅ JWT_SECRET 已正确配置');
      } else {
        console.log('❌ JWT_SECRET 未配置或配置错误');
        console.log('🔧 修复方法：');
        console.log('   1. 生成JWT密钥：node scripts/generate-jwt-secret.js');
        console.log('   2. 本地开发：在.env.local中添加JWT_SECRET');
        console.log('   3. CloudBase：在云托管环境变量中添加JWT_SECRET');
      }
    } else {
      console.log('❌ 无法获取JWT配置状态');
    }

    // 3. 检查微信登录API
    console.log('\n3️⃣ 检查微信登录相关API...');
    const wechatResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/wechat/config`);
    if (wechatResponse.status === 200) {
      console.log('✅ 微信配置API正常');
      if (wechatResponse.data && wechatResponse.data.recommendations) {
        const jwtRecommendation = wechatResponse.data.recommendations.find(r =>
          r.message && r.message.includes('JWT')
        );
        if (jwtRecommendation) {
          console.log('⚠️  JWT配置问题：', jwtRecommendation.message);
          console.log('🔧 解决建议：', jwtRecommendation.solution);
        }
      }
    } else if (wechatResponse.status === 404) {
      console.log('⚠️  微信配置API不存在（可选功能）');
    } else {
      console.log('❌ 微信配置API异常');
    }

    // 4. 检查环境变量完整性
    console.log('\n4️⃣ 检查环境变量完整性...');
    const envCheckResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/env-check-all`);
    if (envCheckResponse.status === 200 && envCheckResponse.data) {
      const { critical, optional, recommendations } = envCheckResponse.data;

      if (critical && critical.length > 0) {
        console.log('❌ 缺少关键环境变量：');
        critical.forEach(item => console.log(`   - ${item}`));
      }

      if (recommendations && recommendations.length > 0) {
        console.log('⚠️  配置建议：');
        recommendations.forEach(rec => console.log(`   - ${rec.message}: ${rec.solution}`));
      }

      if ((!critical || critical.length === 0) && (!recommendations || recommendations.length === 0)) {
        console.log('✅ 环境变量配置完整');
      }
    }

  } catch (error) {
    console.log('❌ 检查过程中发生错误:', error.message);
    console.log('\n🔧 常见错误原因：');
    console.log('   - 应用未启动：请先启动开发服务器 (npm run dev)');
    console.log('   - 网络问题：检查网络连接');
    console.log('   - 配置错误：检查环境变量文件');
  }

  console.log('\n📋 JWT配置总结：');
  console.log('================');

  console.log('\n🔹 JWT_SECRET 用途：');
  console.log('   - 微信登录JWT token签名和验证');
  console.log('   - 保护用户认证信息安全');

  console.log('\n🔹 JWT_SECRET 生成：');
  console.log('   node scripts/generate-jwt-secret.js');

  console.log('\n🔹 JWT_SECRET 配置位置：');
  console.log('   📁 本地开发：.env.local');
  console.log('   ☁️  CloudBase：云托管 → 环境变量');
  console.log('   ☁️  腾讯云：云函数 → 环境变量');

  console.log('\n🔹 JWT_SECRET 要求：');
  console.log('   - 至少32位随机字符串');
  console.log('   - 推荐64位以上');
  console.log('   - 使用强随机数生成');

  console.log('\n🎯 现在可以测试微信登录了！');

  console.log('\n================\n');
}

// 运行检查
checkJWTConfig().catch(error => {
  console.error('检查脚本执行失败:', error);
  process.exit(1);
});






