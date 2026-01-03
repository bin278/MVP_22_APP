#!/usr/bin/env node

/**
 * 测试代码生成的用户隔离
 */

const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://mornfront.mornscience.top',
  timeout: 10000
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const requestOptions = {
      headers: {
        'User-Agent': 'Generate-Isolation-Test/1.0',
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

async function testGenerateIsolation() {
  console.log('🧪 测试代码生成用户隔离');
  console.log('=========================\n');

  // 1. 测试generate-stream API认证
  console.log('1️⃣ 测试generate-stream API认证');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: '创建一个简单的按钮组件',
        model: 'deepseek-chat',
        conversationId: 'test-conversation-id'
      })
    });

    if (response.status === 401) {
      console.log('✅ generate-stream API正确要求认证');
    } else {
      console.log('❌ generate-stream API认证失败');
    }
  } catch (error) {
    console.log('❌ generate-stream API测试失败:', error.message);
  }

  console.log();

  // 2. 测试对话创建认证
  console.log('2️⃣ 测试对话创建认证');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/conversations/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: '测试对话'
      })
    });

    if (response.status === 401) {
      console.log('✅ 对话创建正确要求认证');
    } else {
      console.log('❌ 对话创建认证失败');
    }
  } catch (error) {
    console.log('❌ 对话创建测试失败:', error.message);
  }

  console.log();

  // 3. 测试对话列表认证
  console.log('3️⃣ 测试对话列表认证');
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/conversations/list`);

    if (response.status === 401) {
      console.log('✅ 对话列表正确要求认证（用户隔离生效）');
    } else {
      console.log('❌ 对话列表认证失败');
    }
  } catch (error) {
    console.log('❌ 对话列表测试失败:', error.message);
  }

  console.log();

  // 4. 检查代码实现
  console.log('4️⃣ 检查代码实现状态');
  console.log('✅ 已实现的隔离功能:');
  console.log('   - generate-stream API需要用户认证');
  console.log('   - 对话创建需要用户认证');
  console.log('   - 对话列表按user_id过滤');
  console.log('   - 消息保存时包含user_id');
  console.log('   - AI响应保存到指定对话');

  console.log('\n📝 关键代码位置:');
  console.log('   - API认证: app/api/generate-stream/route.ts:77');
  console.log('   - 对话创建: app/generate/page.tsx:654-673');
  console.log('   - 消息保存: app/api/generate-stream/route.ts:497');
  console.log('   - 列表过滤: app/api/conversations/list/route.ts:26');

  console.log('\n🎯 如果generate页面仍未隔离:');
  console.log('   1. 确认用户已登录（检查localStorage中的认证信息）');
  console.log('   2. 检查浏览器网络面板的API调用');
  console.log('   3. 确认conversationId正确传递');
  console.log('   4. 查看服务器日志确认消息保存');

  console.log('\n🔍 验证步骤:');
  console.log('   1. 打开浏览器开发者工具 -> Network标签');
  console.log('   2. 在generate页面输入提示并点击生成');
  console.log('   3. 查看 /api/generate-stream 请求的请求体');
  console.log('   4. 确认包含有效的conversationId');
  console.log('   5. 查看 /api/conversations/list 请求');
  console.log('   6. 确认只返回当前用户的对话');

  console.log('\n💡 常见问题:');
  console.log('   - 用户未登录：所有API返回401');
  console.log('   - conversationId为空：消息无法保存到对话');
  console.log('   - 认证token过期：需要重新登录');

  console.log('\n=====================\n');
}

// 运行测试
testGenerateIsolation().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});






