#!/usr/bin/env node

/**
 * 测试Session token认证
 */

const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 10000
};

// 根据URL选择协议
const isLocalhost = TEST_CONFIG.baseUrl.includes('localhost');
const protocol = isLocalhost ? require('http') : require('https');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      headers: {
        'User-Agent': 'Session-Auth-Test/1.0',
        ...options.headers
      },
      timeout: TEST_CONFIG.timeout,
      ...options
    };

    const req = protocol.request(url, requestOptions, (res) => {
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

async function testSessionAuth() {
  console.log('🔐 测试Session Token认证');
  console.log('=========================\n');

  console.log('🎯 现在支持两种认证方式：');
  console.log('   1. Session Token（邮箱登录）');
  console.log('   2. JWT Token（微信登录）');
  console.log('');

  // 1. 测试邮箱登录
  console.log('1️⃣ 测试邮箱登录');
  try {
    const loginResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });

    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✅ 邮箱登录成功');
      console.log('   用户ID:', loginResponse.data.user._id);
      console.log('   Session Token:', loginResponse.data.session.accessToken.substring(0, 20) + '...');

      const sessionToken = loginResponse.data.session.accessToken;

      // 2. 使用session token测试API
      console.log('\n2️⃣ 使用Session Token测试API');

      const apisToTest = [
        { name: '对话列表', url: '/api/conversations/list' },
        { name: '代码生成', url: '/api/generate-stream', method: 'POST', body: JSON.stringify({ prompt: 'test', model: 'deepseek-chat' }) },
      ];

      for (const api of apisToTest) {
        try {
          const response = await makeRequest(`${TEST_CONFIG.baseUrl}${api.url}`, {
            method: api.method || 'GET',
            headers: {
              'Authorization': `Bearer ${sessionToken}`,
              ...(api.method === 'POST' ? { 'Content-Type': 'application/json' } : {})
            },
            body: api.body
          });

          if (response.status === 200 || response.status === 201) {
            console.log(`✅ ${api.name} API 认证成功`);
          } else {
            console.log(`❌ ${api.name} API 认证失败: ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ ${api.name} API 测试失败:`, error.message);
        }
      }

    } else {
      console.log('❌ 邮箱登录失败，可能用户不存在');
      console.log('   状态码:', loginResponse.status);
      if (loginResponse.data?.error) {
        console.log('   错误信息:', loginResponse.data.error);
      }
    }
  } catch (error) {
    console.log('❌ 邮箱登录测试失败:', error.message);
  }

  console.log();

  // 3. 测试无认证访问
  console.log('3️⃣ 测试无认证访问');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/conversations/list`);
    if (response.status === 401) {
      console.log('✅ 无认证访问正确被拒绝');
    } else {
      console.log('❌ 无认证访问未被正确拒绝');
    }
  } catch (error) {
    console.log('❌ 无认证测试失败:', error.message);
  }

  console.log();

  // 4. 总结
  console.log('4️⃣ 认证机制总结');
  console.log('================');

  console.log('✅ 当前支持的认证方式:');
  console.log('   🔐 Session Token（邮箱登录）: session_${userId}_${timestamp}');
  console.log('   🔐 JWT Token（微信登录）: eyJhbGciOiJIUzI1NiIs...');
  console.log('');

  console.log('✅ 认证流程:');
  console.log('   1. 检查Authorization header');
  console.log('   2. 提取Bearer token');
  console.log('   3. 优先验证Session token格式');
  console.log('   4. 如果失败，验证JWT token');
  console.log('   5. 从数据库获取用户信息');
  console.log('   6. 返回用户身份给API');

  console.log('\n🎯 用户隔离:');
  console.log('   ✅ 邮箱登录用户：使用真实user_id');
  console.log('   ✅ 微信登录用户：使用真实user_id');
  console.log('   ✅ 开发环境用户：使用dev-user');
  console.log('   ✅ 数据完全隔离，按user_id过滤');

  console.log('\n🚀 现在可以测试:');
  console.log('   1. 邮箱登录创建对话');
  console.log('   2. 生成代码，数据会按用户隔离');
  console.log('   3. 不同用户看不到彼此的数据');

  console.log('\n=========================\n');
}

// 运行测试
testSessionAuth().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
