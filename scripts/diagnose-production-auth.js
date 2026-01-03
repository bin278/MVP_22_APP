#!/usr/bin/env node

/**
 * 诊断生产环境认证问题的脚本
 */

const https = require('https');
const http = require('http');

const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 15000
};

const isLocalhost = TEST_CONFIG.baseUrl.includes('localhost');
const client = isLocalhost ? http : https;

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      headers: {
        'User-Agent': 'Production-Auth-Diagnostic/1.0',
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

async function diagnoseProductionAuth() {
  console.log('🔐 生产环境认证诊断工具');
  console.log('========================\n');

  console.log('📍 检查环境：', TEST_CONFIG.baseUrl);
  console.log('');

  try {
    // 1. 检查基础API连接
    console.log('1️⃣ 检查API连接...');
    const healthResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/health`);
    if (healthResponse.status === 200) {
      console.log('✅ API服务正常');
    } else {
      console.log('❌ API服务异常，状态码:', healthResponse.status);
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
        console.log('   2. 在CloudBase控制台添加JWT_SECRET环境变量');
      }
    } else {
      console.log('⚠️  无法检查JWT配置');
    }

    // 3. 检查数据库连接
    console.log('\n3️⃣ 检查数据库连接...');
    const dbResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/debug/database`);
    if (dbResponse.status === 200) {
      console.log('✅ 数据库连接正常');
    } else {
      console.log('❌ 数据库连接异常');
    }

    // 4. 检查环境变量配置
    console.log('\n4️⃣ 检查环境变量配置...');
    const envCheckResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/env-check-all`);
    if (envCheckResponse.status === 200 && envCheckResponse.data) {
      const { critical } = envCheckResponse.data;
      if (critical && critical.length > 0) {
        console.log('❌ 缺少关键环境变量：');
        critical.forEach(item => console.log(`   - ${item}`));

        if (critical.includes('JWT_SECRET')) {
          console.log('\n🚨 问题确认：JWT_SECRET未配置');
          console.log('📝 解决步骤：');
          console.log('   1. 运行：node scripts/generate-jwt-secret.js');
          console.log('   2. 复制生成的JWT_SECRET值');
          console.log('   3. 登录腾讯云CloudBase控制台');
          console.log('   4. 进入 云托管 → 环境变量');
          console.log('   5. 添加环境变量：JWT_SECRET = [复制的值]');
          console.log('   6. 保存并重新部署应用');
        }
      } else {
        console.log('✅ 关键环境变量配置完整');
      }
    }

    // 5. 模拟认证测试（如果有token的话）
    console.log('\n5️⃣ 认证机制说明...');
    console.log('🔐 支持的认证方式：');
    console.log('   📧 Session Token（邮箱登录）：session_${userId}_${timestamp}');
    console.log('   🔐 JWT Token（微信登录）：标准JWT格式');
    console.log('');
    console.log('🔄 认证流程：');
    console.log('   1. 从Authorization header提取Bearer token');
    console.log('   2. 优先验证Session token格式');
    console.log('   3. 如果失败，验证JWT token');
    console.log('   4. 从数据库查询用户信息');
    console.log('   5. 返回用户身份给API');

  } catch (error) {
    console.log('❌ 诊断过程中发生错误:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 连接错误：');
      console.log('   - 检查应用是否已启动');
      console.log('   - 检查域名和端口是否正确');
      console.log('   - 检查防火墙设置');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 超时错误：');
      console.log('   - 检查网络连接');
      console.log('   - 检查服务器响应时间');
    }
  }

  console.log('\n📋 问题排查指南：');
  console.log('==================');

  console.log('\n❌ 如果看到401 Unauthorized错误：');
  console.log('   原因：认证失败，token无效或过期');
  console.log('   解决：检查JWT_SECRET环境变量配置');

  console.log('\n❌ 如果本地正常但生产环境失败：');
  console.log('   原因：生产环境缺少JWT_SECRET');
  console.log('   解决：在CloudBase控制台配置JWT_SECRET');

  console.log('\n❌ 如果微信登录失败：');
  console.log('   原因：JWT token无法验证');
  console.log('   解决：重新配置JWT_SECRET');

  console.log('\n🎯 快速修复：');
  console.log('============');

  console.log('\n# 1. 生成JWT密钥');
  console.log('node scripts/generate-jwt-secret.js');

  console.log('\n# 2. CloudBase控制台配置');
  console.log('云托管 → 环境变量 → 添加JWT_SECRET');

  console.log('\n# 3. 重新部署应用');
  console.log('云托管 → 部署管理 → 重新部署');

  console.log('\n# 4. 验证修复');
  console.log('node scripts/check-jwt-config.js');

  console.log('\n================\n');
}

// 运行诊断
diagnoseProductionAuth().catch(error => {
  console.error('诊断脚本执行失败:', error);
  process.exit(1);
});






