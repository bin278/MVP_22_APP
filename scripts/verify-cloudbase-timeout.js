#!/usr/bin/env node

/**
 * 验证CloudBase超时设置是否生效
 */

const https = require('https');
const http = require('http');

const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 120000 // 2分钟测试超时
};

const isLocalhost = TEST_CONFIG.baseUrl.includes('localhost');
const client = isLocalhost ? http : https;

async function testTimeoutBehavior() {
  console.log('⏰ 验证CloudBase超时设置');
  console.log('=========================\n');

  console.log('📍 测试环境：', TEST_CONFIG.baseUrl);
  console.log('');

  try {
    // 测试1: 简单请求（应该快速完成）
    console.log('🧪 测试1：简单流式请求');
    console.log('---------------------');

    const simplePrompt = 'Create a simple button component';
    console.log('提示：', simplePrompt);

    const simpleStart = Date.now();

    const simpleResponse = await makeStreamingRequest(`${TEST_CONFIG.baseUrl}/api/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：这里没有Authorization header，所以会使用开发环境默认用户
      },
      body: JSON.stringify({
        prompt: simplePrompt,
        model: 'deepseek-chat'
      })
    });

    const simpleDuration = Date.now() - simpleStart;
    console.log('⏱️ 耗时：', (simpleDuration / 1000).toFixed(1), '秒');

    if (simpleResponse.status === 200) {
      console.log('✅ 简单请求成功');
    } else {
      console.log('❌ 简单请求失败，状态码：', simpleResponse.status);
    }

    // 测试2: 中等复杂度请求（测试超时边界）
    console.log('\n🧪 测试2：中等复杂度请求');
    console.log('------------------------');

    const mediumPrompt = `Create a todo app with:
- Add new todos
- Mark todos as complete
- Delete todos
- Filter by status
- Local storage persistence

Use React hooks and Tailwind CSS.`;

    console.log('提示长度：', mediumPrompt.length, '字符');

    const mediumStart = Date.now();

    const mediumResponse = await makeStreamingRequest(`${TEST_CONFIG.baseUrl}/api/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: mediumPrompt,
        model: 'deepseek-chat'
      })
    });

    const mediumDuration = Date.now() - mediumStart;
    console.log('⏱️ 耗时：', (mediumDuration / 1000).toFixed(1), '秒');

    if (mediumResponse.status === 200) {
      console.log('✅ 中等复杂度请求成功');

      // 分析响应时间
      if (mediumDuration > 30000) {
        console.log('⚠️  响应时间较长（>30秒），可能需要调整超时设置');
      } else {
        console.log('✅ 响应时间正常');
      }
    } else {
      console.log('❌ 中等复杂度请求失败，状态码：', mediumResponse.status);

      if (mediumResponse.status === 504) {
        console.log('🚨 504 Gateway Timeout - CloudBase超时设置可能不够');
        console.log('💡 建议：增加CloudBase超时时间到300秒以上');
      }
    }

    // 测试3: 检查超时设置建议
    console.log('\n📊 超时设置评估');
    console.log('================');

    if (mediumDuration < 60000) {
      console.log('✅ 当前超时设置应该足够（<60秒）');
      console.log('💡 建议：保持300秒超时设置');
    } else if (mediumDuration < 120000) {
      console.log('⚠️  生成时间较长（1-2分钟）');
      console.log('💡 建议：设置600秒超时时间');
    } else {
      console.log('🚨 生成时间过长（>2分钟）');
      console.log('💡 建议：考虑优化生成逻辑或增加超时时间');
    }

  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message);

    if (error.message.includes('timeout')) {
      console.log('⏰ 请求超时，可能的原因：');
      console.log('   - CloudBase超时设置太短');
      console.log('   - 网络连接问题');
      console.log('   - AI API响应慢');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🌐 连接被拒绝，检查：');
      console.log('   - 应用是否正在运行');
      console.log('   - 域名和端口是否正确');
    }
  }

  console.log('\n📋 配置检查清单：');
  console.log('================');

  console.log('✅ CloudBase控制台：');
  console.log('   - 登录 https://console.cloud.tencent.com/tcb/');
  console.log('   - 云托管 → 设置 → 超时时间 = 300秒');

  console.log('\n✅ 重新部署：');
  console.log('   - 部署管理 → 重新部署');
  console.log('   - 等待部署完成');

  console.log('\n✅ 功能测试：');
  console.log('   - 生成复杂代码');
  console.log('   - 检查是否完整生成');
  console.log('   - 验证无超时错误');

  console.log('\n🎯 如果仍有问题：');
  console.log('================');

  console.log('1. 增加超时时间到600秒');
  console.log('2. 检查AI API响应速度');
  console.log('3. 优化代码生成提示词');
  console.log('4. 考虑分阶段生成');

  console.log('\n================\n');
}

async function makeStreamingRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      headers: {
        'User-Agent': 'Timeout-Verification/1.0',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...options.headers
      },
      timeout: TEST_CONFIG.timeout,
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      const chunks = [];
      let totalSize = 0;

      res.on('data', (chunk) => {
        chunks.push(chunk);
        totalSize += chunk.length;
      });

      res.on('end', () => {
        const fullResponse = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          headers: res.headers,
          size: totalSize,
          response: fullResponse.toString(),
          chunks: chunks.length
        });
      });

      res.on('error', (error) => {
        reject(error);
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

// 运行验证
testTimeoutBehavior().catch(error => {
  console.error('验证脚本执行失败:', error);
  process.exit(1);
});






