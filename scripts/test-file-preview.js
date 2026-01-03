#!/usr/bin/env node

/**
 * 测试文件预览功能
 * 检查历史文件的保存和加载
 */

const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 15000
};

// 模拟用户认证token（在实际测试中需要真实的token）
const MOCK_TOKENS = {
  userA: 'mock-token-user-a',
  userB: 'mock-token-user-b'
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const http = require('http');
    const isLocalhost = TEST_CONFIG.baseUrl.includes('localhost');
    const client = isLocalhost ? http : https;

    const requestOptions = {
      headers: {
        'User-Agent': 'File-Preview-Test/1.0',
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

async function testFilePreview() {
  console.log('📁 测试文件预览功能');
  console.log('====================\n');

  console.log('🎯 测试场景：');
  console.log('   1. 创建对话');
  console.log('   2. 保存文件到对话');
  console.log('   3. 加载对话文件');
  console.log('   4. 验证文件内容');
  console.log('   5. 测试预览功能');
  console.log('');

  // 注意：这个测试需要真实的认证token才能完全工作
  console.log('⚠️  注意：需要有效的用户认证token');
  console.log('📋 建议手动测试步骤：');
  console.log('');

  console.log('🔍 手动测试步骤：');

  console.log('\n1️⃣ 登录并创建对话');
  console.log('   - 访问应用并登录');
  console.log('   - 在generate页面输入提示："创建一个简单的按钮组件"');
  console.log('   - 点击生成，等待代码生成完成');

  console.log('\n2️⃣ 检查文件保存');
  console.log('   - 打开浏览器开发者工具 -> Network标签');
  console.log('   - 查看 /api/conversations/[id]/files 的POST请求');
  console.log('   - 确认请求成功 (200状态码)');
  console.log('   - 确认请求体包含正确的文件数据');

  console.log('\n3️⃣ 检查对话侧边栏');
  console.log('   - 刷新页面');
  console.log('   - 点击侧边栏图标，查看对话列表');
  console.log('   - 确认新创建的对话出现在列表中');
  console.log('   - 点击该对话');

  console.log('\n4️⃣ 检查文件加载');
  console.log('   - 查看Network标签中的 /api/conversations/[id] 请求');
  console.log('   - 确认响应包含files数组');
  console.log('   - 确认files包含正确的file_path和file_content');

  console.log('\n5️⃣ 检查文件显示');
  console.log('   - 确认文件树显示正确的文件');
  console.log('   - 点击文件查看内容');
  console.log('   - 确认代码内容正确显示');

  console.log('\n6️⃣ 测试预览功能');
  console.log('   - 点击"View Preview"按钮');
  console.log('   - 查看Network标签中的 /api/preview-code 请求');
  console.log('   - 确认预览窗口正确打开');
  console.log('   - 确认生成的组件能正常显示');

  console.log('\n🔧 如果预览不工作：');

  console.log('\n❌ 问题：文件没有保存');
  console.log('✅ 解决：检查generate-stream API是否正确调用saveFilesToConversation');

  console.log('\n❌ 问题：文件保存了但加载失败');
  console.log('✅ 解决：检查对话详情API是否正确返回files');

  console.log('\n❌ 问题：文件内容不完整');
  console.log('✅ 解决：检查AI生成的文件是否完整，是否有语法错误');

  console.log('\n❌ 问题：预览API失败');
  console.log('✅ 解决：检查preview-code API的代码处理逻辑');

  console.log('\n📊 常见文件问题：');

  console.log('\n🔸 文件路径问题：');
  console.log('   - 确保file_path正确（如src/App.tsx）');
  console.log('   - 检查路径分隔符（使用正斜杠/）');

  console.log('\n🔸 文件内容问题：');
  console.log('   - 检查代码是否有语法错误');
  console.log('   - 确认import语句被正确处理');
  console.log('   - 验证React hooks使用正确');

  console.log('\n🔸 数据库问题：');
  console.log('   - 确认conversation_files集合存在');
  console.log('   - 检查user_id字段正确设置');
  console.log('   - 验证查询条件正确');

  console.log('\n🎯 诊断命令：');

  console.log('\n# 检查文件保存日志');
  console.log('tail -f logs/app.log | grep -i "save.*file"');

  console.log('\n# 检查对话加载日志');
  console.log('tail -f logs/app.log | grep -i "load.*conversation"');

  console.log('\n# 检查预览API日志');
  console.log('tail -f logs/app.log | grep -i "preview"');

  console.log('\n================\n');
}

// 运行测试
testFilePreview().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});






