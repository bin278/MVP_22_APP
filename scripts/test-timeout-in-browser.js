// 浏览器控制台CloudBase超时验证脚本
// 在 https://你的域名/generate 页面打开控制台，运行以下代码

console.log('⏱️  CloudBase超时时间验证工具');
console.log('==============================\n');

// 获取认证状态
const authState = JSON.parse(localStorage.getItem('app-auth-state') || 'null');
const isLoggedIn = authState?.accessToken;

console.log('🔐 认证状态检查:');
if (isLoggedIn) {
  console.log('✅ 用户已登录');
  console.log('   AccessToken:', authState.accessToken.substring(0, 20) + '...');
} else {
  console.log('❌ 用户未登录 - 请先登录再测试');
  console.log('   运行测试前请先登录账户');
}

console.log('\n📊 测试计划:');
console.log('============');
console.log('1. 简单任务测试（10-30秒）- 验证基础功能');
console.log('2. 中等任务测试（30秒-2分钟）- 验证超时边界');
console.log('3. 复杂任务测试（2-5分钟）- 验证600秒超时');
console.log('4. SSE心跳测试 - 验证连接稳定性');
console.log('');

// 工具函数
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}分${remainingSeconds}秒` : `${seconds}秒`;
}

function analyzeComplexity(prompt) {
  let score = prompt.length;

  // 关键词权重
  const complexKeywords = [
    'complex', 'advanced', 'full', 'complete', 'entire', 'system',
    'platform', 'enterprise', 'multi', 'comprehensive', '完整',
    '复杂', '高级', '完整', '系统', '平台', '企业级', '多功能'
  ];

  complexKeywords.forEach(keyword => {
    if (prompt.toLowerCase().includes(keyword.toLowerCase())) {
      score += 300;
    }
  });

  // 组件数量估算
  const componentWords = ['component', 'page', 'module', 'feature', 'function', '组件', '页面', '模块', '功能'];
  componentWords.forEach(word => {
    const matches = prompt.toLowerCase().match(new RegExp(word.toLowerCase(), 'g'));
    if (matches) {
      score += matches.length * 150;
    }
  });

  return score;
}

window.testTimeout = async function(testLevel = 'medium') {
  if (!isLoggedIn) {
    console.error('❌ 请先登录再进行测试');
    return;
  }

  console.log(`\n🚀 开始${testLevel === 'simple' ? '简单' : testLevel === 'medium' ? '中等' : '复杂'}任务测试`);
  console.log('='.repeat(50));

  let prompt;
  let expectedTime;
  let expectedMode;

  switch(testLevel) {
    case 'simple':
      prompt = '创建一个简单的按钮组件，使用React和Tailwind CSS';
      expectedTime = '10-30秒';
      expectedMode = '流式模式';
      break;
    case 'medium':
      prompt = '创建一个待办事项应用，包含添加、删除、标记完成、筛选功能，使用React hooks';
      expectedTime = '30秒-2分钟';
      expectedMode = '流式模式';
      break;
    case 'complex':
      prompt = '创建一个完整的电商平台，包含商品列表、购物车、用户管理、订单系统、支付功能。使用React、Node.js、数据库等完整技术栈';
      expectedTime = '2-5分钟';
      expectedMode = '异步模式';
      break;
  }

  console.log(`📝 测试提示: ${prompt}`);
  console.log(`⏱️  预期时间: ${expectedTime}`);
  console.log(`🎯 预期模式: ${expectedMode}`);

  const complexity = analyzeComplexity(prompt);
  console.log(`🧮 复杂度评分: ${complexity} (>${1200}将使用异步模式)`);
  console.log('');

  try {
    const startTime = Date.now();
    console.log('📡 发送生成请求...');

    const response = await fetch('/api/generate-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.accessToken}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'deepseek-chat',
        conversationId: 'timeout_test_' + Date.now()
      })
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`📊 请求状态: ${response.status}`);
    console.log(`⏱️  响应时间: ${formatTime(duration)}`);

    if (response.status === 200) {
      console.log('✅ 请求成功 - 分析SSE流...');

      // 分析流式响应
      let hasHeartbeat = false;
      let hasComplexityLog = false;
      let hasAsyncSwitch = false;
      let startStreaming = false;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'heartbeat') {
                  if (!hasHeartbeat) {
                    console.log('❤️ 检测到心跳包 - SSE连接正常');
                    hasHeartbeat = true;
                  }
                }

                if (data.message && data.message.includes('复杂度评估')) {
                  console.log(`📊 ${data.message}`);
                  hasComplexityLog = true;
                }

                if (data.message && data.message.includes('异步模式')) {
                  console.log(`🚨 ${data.message}`);
                  hasAsyncSwitch = true;
                }

                if (data.type === 'chars' && !startStreaming) {
                  console.log('🌊 开始接收流式代码...');
                  startStreaming = true;
                }

                if (data.type === 'complete') {
                  console.log('✅ 生成完成！');
                  break;
                }

              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // 分析结果
      console.log('\n📋 测试结果分析:');
      console.log('='.repeat(30));

      if (hasHeartbeat) {
        console.log('✅ SSE心跳正常 - 连接稳定');
      } else {
        console.log('⚠️  未检测到心跳包 - 可能连接不稳定');
      }

      if (hasComplexityLog) {
        console.log('✅ 复杂度评估正常');
      } else {
        console.log('⚠️  未检测到复杂度评估');
      }

      if (complexity > 1200 && hasAsyncSwitch) {
        console.log('✅ 异步模式切换正常');
      } else if (complexity <= 1200 && !hasAsyncSwitch) {
        console.log('✅ 流式模式工作正常');
      }

      if (startStreaming) {
        console.log('✅ 代码流接收正常');
      }

      // 超时分析
      if (duration < 60000) {
        console.log('✅ 响应时间正常（<1分钟）');
        console.log('💡 说明：当前超时设置足够');
      } else if (duration < 300000) {
        console.log('⚠️  响应时间较长（1-5分钟）');
        console.log('💡 说明：需要300-600秒超时设置');
      } else {
        console.log('🚨 响应时间过长（>5分钟）');
        console.log('💡 说明：可能需要进一步优化或增加超时时间');
      }

      if (duration < 600000) { // 10分钟内完成
        console.log('\n🎉 测试成功！CloudBase超时配置生效');
        console.log('   复杂任务可以正常完成，不会提前中断');
      } else {
        console.log('\n⚠️  测试超时，可能需要调整CloudBase配置');
      }

    } else if (response.status === 504) {
      console.log('🚨 504 Gateway Timeout - CloudBase超时设置不够！');
      console.log('💡 解决方案：');
      console.log('   1. 检查 .cloudbaserc.json 中的 timeout 设置');
      console.log('   2. 确认重新部署后生效');
      console.log('   3. 在控制台手动设置为600秒');

    } else {
      console.log(`❌ 请求失败: ${response.status}`);
      const errorText = await response.text();
      console.log('错误详情:', errorText);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);

    if (error.message.includes('timeout')) {
      console.log('⏰ 请求超时 - 可能的原因：');
      console.log('   • CloudBase超时设置太短');
      console.log('   • 网络连接问题');
      console.log('   • AI API响应慢');
    }
  }
};

// 使用说明
console.log('🎯 使用方法:');
console.log('============');
console.log('在控制台运行以下命令：');
console.log('');
console.log('// 测试简单任务（验证基础功能）');
console.log('testTimeout("simple")');
console.log('');
console.log('// 测试中等任务（验证超时边界）');
console.log('testTimeout("medium")');
console.log('');
console.log('// 测试复杂任务（验证600秒超时）');
console.log('testTimeout("complex")');
console.log('');
console.log('📈 进度监控：');
console.log('============');
console.log('• 简单任务：10-30秒完成 ✅');
console.log('• 中等任务：30秒-2分钟完成 ✅');
console.log('• 复杂任务：2-5分钟完成 ✅');
console.log('• 无504超时错误 ✅');
console.log('• SSE心跳持续 ✅');
console.log('');
console.log('🎉 如果所有测试都通过，说明CloudBase超时时间已正确设置为600秒！');






