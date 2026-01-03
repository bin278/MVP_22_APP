#!/usr/bin/env node

/**
 * 测试智能混合流式生成
 */

const https = require('https');
const http = require('http');

const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 120000 // 2分钟测试超时
};

const isLocalhost = TEST_CONFIG.baseUrl.includes('localhost');
const client = isLocalhost ? http : https;

async function testSmartStreaming() {
  console.log('🧠 智能混合流式生成测试');
  console.log('========================\n');

  console.log('🎯 测试场景：');
  console.log('   1. 简单提示词 → 流式生成');
  console.log('   2. 复杂提示词 → 智能切换到异步');
  console.log('   3. 验证切换逻辑和后备处理');
  console.log('');

  try {
    // 测试1: 简单提示词（应该保持流式）
    console.log('🧪 测试1：简单提示词（期望流式生成）');
    console.log('-----------------------------------');

    const simplePrompt = 'Create a simple button component';
    console.log(`提示：${simplePrompt}`);
    console.log(`复杂度：${simplePrompt.length} 字符`);

    await testGeneration(simplePrompt, 'expected_streaming');

    // 测试2: 复杂提示词（应该切换到异步）
    console.log('\n🧪 测试2：复杂提示词（期望切换到异步）');
    console.log('-----------------------------------');

    const complexPrompt = `Create a complete dashboard application with:
- Navigation sidebar with menu items
- Main content area with multiple charts and graphs
- User profile section with avatar and settings
- Data table with sorting, filtering, and pagination
- Modal dialogs for forms and confirmations
- Responsive design for mobile and desktop
- Dark mode toggle
- Real-time data updates
- Export functionality
- Search and filter capabilities

Use React hooks, Context API, Tailwind CSS, and make it production-ready.`;

    console.log(`提示长度：${complexPrompt.length} 字符`);
    console.log(`复杂度：高（预期切换到异步模式）`);

    await testGeneration(complexPrompt, 'expected_async_switch');

  } catch (error) {
    console.log('❌ 测试过程中发生错误:', error.message);
  }

  console.log('\n📋 测试结果说明：');
  console.log('================');

  console.log('✅ 简单提示词应该看到：');
  console.log('   - 实时流式字符显示');
  console.log('   - 打字机效果');
  console.log('   - 快速完成');

  console.log('\n✅ 复杂提示词应该看到：');
  console.log('   - 开始流式显示');
  console.log('   - 检测到风险后切换提示');
  console.log('   - 异步进度条');
  console.log('   - 最终完成生成');

  console.log('\n🎯 智能切换逻辑：');
  console.log('================');

  console.log('📊 风险评估条件：');
  console.log('   - 提示词长度 > 800字符');
  console.log('   - 使用复杂模型（GPT-4、Claude）');
  console.log('   - 生成时间 > 30秒');
  console.log('   - 内容增长缓慢');

  console.log('\n🔄 切换时机：');
  console.log('   - 初始评估（请求开始时）');
  console.log('   - 实时监控（生成过程中）');

  console.log('\n🛠️ 如果测试失败：');
  console.log('================');

  console.log('1. 检查JWT_SECRET配置');
  console.log('2. 验证AI API连接');
  console.log('3. 查看服务器日志');
  console.log('4. 确认CloudBase超时设置');

  console.log('\n================\n');
}

async function testGeneration(prompt, expectedMode) {
  const startTime = Date.now();

  try {
    const response = await makeStreamingRequest(`${TEST_CONFIG.baseUrl}/api/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：这里没有Authorization header，所以会使用开发环境默认用户
      },
      body: JSON.stringify({
        prompt,
        model: 'deepseek-chat'
      })
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ 响应时间：${(duration / 1000).toFixed(1)}秒`);

    if (response.status === 401) {
      console.log('❌ 认证失败（需要有效的token测试）');
      return;
    }

    if (response.status !== 200) {
      console.log(`❌ 请求失败，状态码：${response.status}`);
      console.log(`📄 错误信息：${response.response.slice(0, 200)}`);
      return;
    }

    // 分析SSE响应
    const lines = response.response.split('\n');
    let modeSwitched = false;
    let switchReason = '';
    let charsReceived = 0;
    let dataLines = 0;
    let completed = false;

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        dataLines++;
        const data = line.slice(6);

        if (data === '[DONE]') {
          break;
        }

        try {
          const parsed = JSON.parse(data);

          if (parsed.type === 'mode_switch') {
            modeSwitched = true;
            switchReason = parsed.reason || 'unknown';
            console.log(`🔄 检测到模式切换：${parsed.mode}（原因：${switchReason}）`);

          } else if (parsed.type === 'chars') {
            charsReceived += parsed.chars?.length || 0;

          } else if (parsed.type === 'complete') {
            completed = true;
            console.log('✅ 生成完成');

          } else if (parsed.type === 'async_started') {
            console.log('📋 异步任务已启动');
          }

        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    console.log(`📊 统计信息：`);
    console.log(`   - 数据行数：${dataLines}`);
    console.log(`   - 字符数：${charsReceived}`);
    console.log(`   - 模式切换：${modeSwitched ? '是' : '否'}`);
    if (modeSwitched) {
      console.log(`   - 切换原因：${switchReason}`);
    }
    console.log(`   - 完成状态：${completed ? '成功' : '未完成'}`);

    // 评估结果
    if (expectedMode === 'expected_streaming' && !modeSwitched && completed) {
      console.log('✅ 简单任务正确使用流式模式');
    } else if (expectedMode === 'expected_async_switch' && modeSwitched && !completed) {
      console.log('✅ 复杂任务正确切换到异步模式');
    } else {
      console.log('⚠️ 行为与预期不符，可能需要调整逻辑');
    }

  } catch (error) {
    console.log('❌ 测试异常:', error.message);
  }
}

async function makeStreamingRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      headers: {
        'User-Agent': 'Smart-Streaming-Test/1.0',
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

// 运行测试
testSmartStreaming().catch(error => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});






