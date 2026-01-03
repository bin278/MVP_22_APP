#!/usr/bin/env node

/**
 * 诊断文件预览问题的脚本
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
        'User-Agent': 'File-Preview-Diagnostic/1.0',
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

async function checkEnvironment() {
  console.log('🔍 检查环境配置');
  console.log('================');

  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/health`);
    if (response.status === 200) {
      console.log('✅ API服务正常');
    } else {
      console.log('❌ API服务异常');
      return false;
    }
  } catch (error) {
    console.log('❌ 无法连接到API:', error.message);
    return false;
  }

  // 检查环境变量API
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/env`);
    if (response.status === 200) {
      console.log('✅ 环境变量API正常');
    } else {
      console.log('⚠️  环境变量API不可用');
    }
  } catch (error) {
    console.log('⚠️  环境变量API不可用');
  }

  return true;
}

async function checkDatabaseCollections() {
  console.log('\n📊 检查数据库集合');
  console.log('==================');

  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/debug/database`);
    if (response.status === 200) {
      console.log('✅ 数据库连接正常');
      console.log('   集合信息:', response.data.collections || '未知');
    } else {
      console.log('❌ 数据库连接异常');
      return false;
    }
  } catch (error) {
    console.log('❌ 数据库检查失败:', error.message);
    return false;
  }

  return true;
}

async function analyzeFilePreviewIssue() {
  console.log('\n🔧 文件预览问题分析');
  console.log('==================');

  console.log('\n🎯 可能的原因：');

  console.log('\n1️⃣ 用户隔离问题（已修复）');
  console.log('   ✅ 文件保存API现在包含user_id验证');
  console.log('   ✅ 查询时只返回当前用户的文件');
  console.log('   ✅ 防止跨用户数据访问');

  console.log('\n2️⃣ 文件保存问题');
  console.log('   🔍 检查点：');
  console.log('   - generate-stream API是否调用了saveFilesToConversation');
  console.log('   - 文件数据是否正确传递');
  console.log('   - 数据库写入是否成功');

  console.log('\n3️⃣ 文件加载问题');
  console.log('   🔍 检查点：');
  console.log('   - 对话详情API是否返回files数组');
  console.log('   - 文件内容是否完整');
  console.log('   - 前端是否正确解析文件数据');

  console.log('\n4️⃣ 文件内容问题');
  console.log('   🔍 检查点：');
  console.log('   - AI生成代码是否有语法错误');
  console.log('   - React组件结构是否正确');
  console.log('   - import语句是否被预览API正确处理');

  console.log('\n5️⃣ 预览API问题');
  console.log('   🔍 检查点：');
  console.log('   - preview-code API是否正常工作');
  console.log('   - 代码清理逻辑是否正确');
  console.log('   - HTML生成是否成功');

  console.log('\n🛠️  调试步骤：');

  console.log('\n📝 步骤1：检查文件保存');
  console.log('   1. 在generate页面生成代码');
  console.log('   2. 打开浏览器Network标签');
  console.log('   3. 查看POST /api/conversations/[id]/files请求');
  console.log('   4. 确认响应状态为200');
  console.log('   5. 确认请求体包含files数组');

  console.log('\n📝 步骤2：检查文件加载');
  console.log('   1. 刷新页面');
  console.log('   2. 点击对话列表中的对话');
  console.log('   3. 查看GET /api/conversations/[id]请求');
  console.log('   4. 确认响应包含files数组');
  console.log('   5. 检查files数组的结构');

  console.log('\n📝 步骤3：检查文件显示');
  console.log('   1. 确认文件树显示正确的文件');
  console.log('   2. 点击文件查看代码内容');
  console.log('   3. 确认代码完整且无明显错误');

  console.log('\n📝 步骤4：检查预览功能');
  console.log('   1. 点击"View Preview"按钮');
  console.log('   2. 查看POST /api/preview-code请求');
  console.log('   3. 确认响应为HTML内容');
  console.log('   4. 检查预览窗口是否正确打开');

  console.log('\n🔍 常见问题及解决方案：');

  console.log('\n❌ 问题：文件没有保存');
  console.log('✅ 解决：检查generate-stream API的saveFilesToConversation调用');

  console.log('\n❌ 问题：文件保存但不显示');
  console.log('✅ 解决：检查对话详情API的files查询和返回');

  console.log('\n❌ 问题：文件内容不完整');
  console.log('✅ 解决：检查AI生成的代码是否有语法错误');

  console.log('\n❌ 问题：预览空白或报错');
  console.log('✅ 解决：检查preview-code API的代码处理逻辑');

  console.log('\n📊 数据库检查：');

  console.log('\n🔍 检查conversation_files集合：');
  console.log('   - 确认集合存在');
  console.log('   - 检查user_id字段');
  console.log('   - 验证conversation_id关联');

  console.log('\n🔍 检查conversations集合：');
  console.log('   - 确认对话存在');
  console.log('   - 检查user_id字段');
  console.log('   - 验证用户权限');

  console.log('\n🎯 快速诊断：');

  console.log('\n# 运行以下命令检查日志：');
  console.log('tail -f logs/app.log | grep -E "(save.*file|load.*conversation|preview)"');

  console.log('\n# 检查数据库中的文件记录：');
  console.log('db.conversation_files.find({user_id: "YOUR_USER_ID"}).limit(5)');

  console.log('\n# 测试预览API：');
  console.log('curl -X POST http://localhost:3000/api/preview-code \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"code": "function App() { return <div>Hello</div>; }", "files": {}}\'');

  console.log('\n================\n');
}

// 主函数
async function runDiagnostic() {
  console.log('🔧 文件预览问题诊断工具');
  console.log('=========================\n');

  // 环境检查
  if (!await checkEnvironment()) {
    console.log('❌ 环境检查失败，请检查应用是否正常运行');
    return;
  }

  // 数据库检查
  if (!await checkDatabaseCollections()) {
    console.log('❌ 数据库检查失败，请检查数据库连接');
    return;
  }

  // 问题分析
  await analyzeFilePreviewIssue();

  console.log('🎯 诊断完成！');
  console.log('   请按照上述步骤排查问题。');
  console.log('   如果问题持续存在，请提供具体的错误信息。');
}

// 运行诊断
runDiagnostic().catch(error => {
  console.error('诊断过程中发生错误:', error);
  process.exit(1);
});






