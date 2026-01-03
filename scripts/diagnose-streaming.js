#!/usr/bin/env node

/**
 * 诊断流式响应问题的脚本
 */

const https = require('https');
const http = require('http');

const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 60000 // 60秒超时，用于复杂代码生成
};

const isLocalhost = TEST_CONFIG.baseUrl.includes('localhost');
const client = isLocalhost ? http : https;

async function makeStreamingRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      headers: {
        'User-Agent': 'Streaming-Diagnostic/1.0',
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

async function testSimpleStreaming() {
  console.log('🧪 测试简单流式响应');
  console.log('====================\n');

  const testPrompt = 'Create a simple button component';

  try {
    console.log('📤 发送简单请求:', testPrompt);

    const response = await makeStreamingRequest(`${TEST_CONFIG.baseUrl}/api/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：这里没有Authorization header，所以会使用开发环境默认用户
      },
      body: JSON.stringify({
        prompt: testPrompt,
        model: 'deepseek-chat'
      })
    });

    console.log('📥 响应状态:', response.status);
    console.log('📏 响应大小:', response.size, 'bytes');
    console.log('📦 数据块数:', response.chunks);

    if (response.status === 200) {
      // 解析SSE响应
      const lines = response.response.split('\n');
      let dataLines = 0;
      let completeReceived = false;
      let errorReceived = false;

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          dataLines++;
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('✅ 收到完成信号 [DONE]');
            break;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'complete') {
              completeReceived = true;
              console.log('✅ 收到完整响应');
            } else if (parsed.type === 'error') {
              errorReceived = true;
              console.log('❌ 收到错误响应:', parsed.error);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      console.log('📊 统计信息:');
      console.log('   - 数据行数:', dataLines);
      console.log('   - 完整响应:', completeReceived ? '✅' : '❌');
      console.log('   - 错误响应:', errorReceived ? '❌' : '✅');

      return response.status === 200 && completeReceived && !errorReceived;
    } else {
      console.log('❌ 请求失败，状态码:', response.status);
      console.log('📄 错误响应:', response.response.slice(0, 500));
      return false;
    }

  } catch (error) {
    console.log('❌ 请求异常:', error.message);
    return false;
  }
}

async function testComplexStreaming() {
  console.log('\n🏗️ 测试复杂流式响应');
  console.log('===================\n');

  const testPrompt = `Create a complex dashboard with multiple components:
- Navigation sidebar
- Main content area with charts
- User profile section
- Settings panel
- Data table with sorting and filtering
- Modal dialogs
- Responsive design

Use React hooks, Tailwind CSS, and make it fully functional.`;

  try {
    console.log('📤 发送复杂请求...');
    console.log('💡 提示长度:', testPrompt.length, '字符');

    const startTime = Date.now();

    const response = await makeStreamingRequest(`${TEST_CONFIG.baseUrl}/api/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：这里没有Authorization header，所以会使用开发环境默认用户
      },
      body: JSON.stringify({
        prompt: testPrompt,
        model: 'deepseek-chat'
      })
    });

    const duration = Date.now() - startTime;

    console.log('⏱️ 总耗时:', duration, 'ms');
    console.log('📥 响应状态:', response.status);
    console.log('📏 响应大小:', response.size, 'bytes');
    console.log('📦 数据块数:', response.chunks);

    if (response.status === 200) {
      // 分析响应内容
      const lines = response.response.split('\n');
      let dataLines = 0;
      let charCount = 0;
      let completeReceived = false;
      let errorReceived = false;
      let lastDataTime = 0;

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          dataLines++;
          const data = line.slice(6);
          lastDataTime = Date.now();

          if (data === '[DONE]') {
            console.log('✅ 收到完成信号 [DONE]');
            break;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'char') {
              charCount++;
            } else if (parsed.type === 'complete') {
              completeReceived = true;
              console.log('✅ 收到完整响应');
            } else if (parsed.type === 'error') {
              errorReceived = true;
              console.log('❌ 收到错误响应:', parsed.error);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      console.log('📊 详细统计:');
      console.log('   - 数据行数:', dataLines);
      console.log('   - 字符数:', charCount);
      console.log('   - 完整响应:', completeReceived ? '✅' : '❌');
      console.log('   - 错误响应:', errorReceived ? '❌' : '✅');
      console.log('   - 平均速度:', charCount > 0 ? (duration / charCount).toFixed(2) + 'ms/字符' : 'N/A');

      // 检查是否可能存在网络中断
      if (!completeReceived && dataLines > 0) {
        console.log('\n⚠️  警告: 响应可能被截断');
        console.log('   - 收到数据行数:', dataLines);
        console.log('   - 但未收到完整响应');
        console.log('   - 可能是网络超时或服务器中断');
      }

      return response.status === 200 && completeReceived && !errorReceived;
    } else {
      console.log('❌ 请求失败，状态码:', response.status);
      console.log('📄 错误响应:', response.response.slice(0, 500));
      return false;
    }

  } catch (error) {
    console.log('❌ 请求异常:', error.message);
    if (error.message.includes('timeout')) {
      console.log('⏰ 可能是超时问题，建议检查：');
      console.log('   - 服务器超时设置');
      console.log('   - 网络代理配置');
      console.log('   - AI API响应时间');
    }
    return false;
  }
}

async function analyzeEnvironmentDifferences() {
  console.log('\n🔍 环境差异分析');
  console.log('===============\n');

  console.log('📍 本地环境 vs 生产环境差异：\n');

  console.log('🏠 本地环境 (localhost):');
  console.log('   ✅ 直接HTTP连接');
  console.log('   ✅ 无网络代理');
  console.log('   ✅ 无CDN缓存');
  console.log('   ✅ 无负载均衡');
  console.log('   ✅ 宽松的超时设置');
  console.log('');

  console.log('☁️ 生产环境 (CloudBase):');
  console.log('   ⚠️ 可能有网络代理');
  console.log('   ⚠️ 可能有CDN缓存');
  console.log('   ⚠️ 可能有负载均衡');
  console.log('   ⚠️ 可能有严格的超时设置');
  console.log('   ⚠️ 可能有防火墙限制');
  console.log('');

  console.log('🎯 可能的原因：');
  console.log('==============');

  console.log('1️⃣ ⏰ 超时设置差异');
  console.log('   本地: 无严格超时限制');
  console.log('   生产: 可能有30秒或60秒超时');
  console.log('   解决: 检查CloudBase超时配置');

  console.log('\n2️⃣ 🌐 网络代理问题');
  console.log('   生产环境可能有反向代理或负载均衡器');
  console.log('   长连接可能被代理中断');
  console.log('   解决: 检查代理配置，启用WebSocket支持');

  console.log('\n3️⃣ 🔥 服务器资源限制');
  console.log('   生产环境可能有CPU/内存限制');
  console.log('   复杂代码生成需要更多资源');
  console.log('   解决: 升级CloudBase套餐或优化代码');

  console.log('\n4️⃣ 🚦 AI API限制');
  console.log('   DeepSeek API可能对响应时间有限制');
  console.log('   复杂提示可能触发API限制');
  console.log('   解决: 分割复杂请求或使用更快的模型');

  console.log('\n5️⃣ 📡 前端连接问题');
  console.log('   生产环境的SSE连接可能不稳定');
  console.log('   浏览器可能断开长连接');
  console.log('   解决: 实现重连机制和错误恢复');

  console.log('\n🛠️ 解决方案：');
  console.log('============');

  console.log('1️⃣ 增加超时时间：');
  console.log('   - CloudBase控制台 → 云托管 → 超时设置');
  console.log('   - 设置为300秒或更长');

  console.log('\n2️⃣ 优化流式处理：');
  console.log('   - 减少字符级别的延迟');
  console.log('   - 批量发送数据');
  console.log('   - 实现断点续传');

  console.log('\n3️⃣ 添加错误恢复：');
  console.log('   - 前端检测连接中断');
  console.log('   - 自动重试失败的请求');
  console.log('   - 显示用户友好的错误信息');

  console.log('\n4️⃣ 分割复杂请求：');
  console.log('   - 将复杂组件拆分为多个简单请求');
  console.log('   - 先生成基础结构，再逐步添加功能');

  console.log('\n5️⃣ 监控和日志：');
  console.log('   - 添加详细的流式日志');
  console.log('   - 监控响应时间和成功率');
  console.log('   - 识别性能瓶颈');
}

// 主函数
async function runDiagnostic() {
  console.log('🔧 流式响应问题诊断工具');
  console.log('========================\n');

  console.log('🎯 问题描述：生产环境生成复杂代码时生成一半就停止');
  console.log('');

  // 测试简单请求
  const simpleTest = await testSimpleStreaming();

  // 测试复杂请求
  const complexTest = await testComplexStreaming();

  // 分析环境差异
  await analyzeEnvironmentDifferences();

  console.log('\n📋 诊断结果总结：');
  console.log('================');

  console.log('🔹 简单请求测试:', simpleTest ? '✅ 通过' : '❌ 失败');
  console.log('🔹 复杂请求测试:', complexTest ? '✅ 通过' : '❌ 失败');

  if (simpleTest && !complexTest) {
    console.log('\n🎯 诊断结论: 复杂代码生成存在问题');
    console.log('💡 建议解决方案:');
    console.log('   1. 检查生产环境超时设置');
    console.log('   2. 优化流式处理逻辑');
    console.log('   3. 考虑分割复杂请求');
    console.log('   4. 增加错误恢复机制');
  } else if (!simpleTest) {
    console.log('\n🎯 诊断结论: 基本流式功能存在问题');
    console.log('💡 建议解决方案:');
    console.log('   1. 检查认证配置');
    console.log('   2. 验证AI API连接');
    console.log('   3. 检查环境变量');
  } else {
    console.log('\n🎯 诊断结论: 流式功能正常');
    console.log('💡 如果生产环境仍有问题，可能是环境特定问题');
  }

  console.log('\n================\n');
}

// 运行诊断
runDiagnostic().catch(error => {
  console.error('诊断脚本执行失败:', error);
  process.exit(1);
});






