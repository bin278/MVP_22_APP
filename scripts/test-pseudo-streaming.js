#!/usr/bin/env node

/**
 * 测试伪流式代码生成系统
 * 用于验证CloudBase数据库集成和API接口是否正常工作
 */

const https = require('https');
const http = require('http');

// 配置
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mornfront.mornscience.top';
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || 'your-jwt-token-here'; // 需要有效的JWT token

// 测试用例
const testPrompt = '创建一个简单的React计数器组件，使用Tailwind CSS样式';

console.log('🧪 开始测试伪流式代码生成系统');
console.log('📍 目标URL:', BASE_URL);
console.log('🎯 测试指令:', testPrompt);
console.log('');

// 辅助函数：发送HTTP请求
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;

    const req = protocol.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body)
          };
          resolve(response);
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 测试1：创建代码生成任务
async function testCreateTask() {
  console.log('1️⃣ 测试创建任务...');

  try {
    const url = `${BASE_URL}/api/create-code-task`;
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    }, {
      prompt: testPrompt
    });

    if (response.statusCode === 200 && response.body.code === 0) {
      console.log('✅ 创建任务成功');
      console.log('   TaskID:', response.body.data.taskId);
      return response.body.data.taskId;
    } else {
      console.log('❌ 创建任务失败:', response.body.msg);
      return null;
    }
  } catch (error) {
    console.log('❌ 创建任务出错:', error.message);
    return null;
  }
}

// 测试2：轮询查询任务状态
async function testPolling(taskId) {
  console.log('\n2️⃣ 测试轮询查询...');

  let attempts = 0;
  const maxAttempts = 30; // 最多轮询30次

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`   第${attempts}次轮询...`);

    try {
      const url = `${BASE_URL}/api/query-code-task?taskId=${taskId}`;
      const response = await makeRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      });

      if (response.statusCode === 200 && response.body.code === 0) {
        const { status, code, errorMsg } = response.body.data;

        console.log(`   状态: ${status}, 代码长度: ${code.length}`);

        if (status === 'success') {
          console.log('✅ 生成完成！');
          console.log('📝 生成的代码:');
          console.log(code.substring(0, 200) + (code.length > 200 ? '...' : ''));
          return true;
        } else if (status === 'failed') {
          console.log('❌ 生成失败:', errorMsg);
          return false;
        } else if (status === 'processing') {
          // 继续轮询
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒后重试
        }
      } else {
        console.log('❌ 查询失败:', response.body.msg);
        return false;
      }
    } catch (error) {
      console.log('❌ 查询出错:', error.message);
      return false;
    }
  }

  console.log('⏰ 轮询超时');
  return false;
}

// 测试3：数据隔离验证
async function testDataIsolation() {
  console.log('\n3️⃣ 测试数据隔离...');

  try {
    // 使用无效的taskId测试
    const invalidTaskId = 'invalid-task-id-12345';
    const url = `${BASE_URL}/api/query-code-task?taskId=${invalidTaskId}`;
    const response = await makeRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    });

    if (response.statusCode === 200 && response.body.code === -1) {
      console.log('✅ 数据隔离正常：无法访问不存在的任务');
      return true;
    } else {
      console.log('❌ 数据隔离异常');
      return false;
    }
  } catch (error) {
    console.log('❌ 数据隔离测试出错:', error.message);
    return false;
  }
}

// 主测试流程
async function runTests() {
  try {
    // 测试创建任务
    const taskId = await testCreateTask();
    if (!taskId) {
      console.log('\n❌ 测试失败：无法创建任务');
      return;
    }

    // 测试轮询
    const pollingSuccess = await testPolling(taskId);
    if (!pollingSuccess) {
      console.log('\n❌ 测试失败：轮询过程异常');
      return;
    }

    // 测试数据隔离
    const isolationSuccess = await testDataIsolation();
    if (!isolationSuccess) {
      console.log('\n❌ 测试失败：数据隔离异常');
      return;
    }

    console.log('\n🎉 所有测试通过！伪流式代码生成系统工作正常');

  } catch (error) {
    console.log('\n💥 测试过程中发生错误:', error.message);
  }
}

// 检查环境变量
if (!JWT_TOKEN || JWT_TOKEN === 'your-jwt-token-here') {
  console.log('⚠️  请设置有效的JWT_TOKEN环境变量');
  console.log('   运行命令: export TEST_JWT_TOKEN="your-actual-jwt-token"');
  process.exit(1);
}

runTests();





