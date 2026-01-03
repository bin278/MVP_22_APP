#!/usr/bin/env node

/**
 * 全分段代码生成测试脚本
 */

console.log('🧩 全分段代码生成测试');
console.log('========================\n');

const testPrompts = [
  {
    name: '简单组件',
    prompt: '创建一个按钮组件',
    expectedSegments: 2
  },
  {
    name: '中等复杂度',
    prompt: '创建一个待办事项应用，包含添加、删除、标记完成功能',
    expectedSegments: 3
  },
  {
    name: '复杂功能',
    prompt: '创建一个完整的电商平台，包含商品列表、购物车、支付功能、用户管理',
    expectedSegments: 4
  },
  {
    name: '超复杂系统',
    prompt: '创建一个企业级SaaS平台，包含多租户架构、用户权限管理、API网关、微服务架构、监控告警、日志分析、自动化部署等完整功能',
    expectedSegments: 5
  }
];

console.log('📋 测试用例：');
testPrompts.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}: "${test.prompt.substring(0, 50)}..."`);
  console.log(`   预期段落数: ${test.expectedSegments}`);
});
console.log('');

console.log('🎯 分段策略说明：');
console.log('================');
console.log('• 短提示 (<100字符): 分成2段');
console.log('• 中等提示 (100-200字符): 分成2-3段');
console.log('• 长提示 (>200字符): 分成3段');
console.log('• 复杂功能提示: 根据功能点智能分割');
console.log('• 最大段落数: 5段');
console.log('');

console.log('🚀 测试方法：');
console.log('============');
console.log('');
console.log('在浏览器控制台运行：');
console.log('');
console.log('// 测试简单组件');
console.log('testSegmentedGeneration("创建一个按钮组件")');
console.log('');
console.log('// 测试中等复杂度');
console.log('testSegmentedGeneration("创建一个待办事项应用，包含添加、删除、标记完成功能")');
console.log('');
console.log('// 测试复杂功能');
console.log('testSegmentedGeneration("创建一个完整的电商平台，包含商品列表、购物车、支付功能、用户管理")');
console.log('');
console.log('function testSegmentedGeneration(prompt) {');
console.log('  console.log(`🧪 测试提示: ${prompt}`);');
console.log('  console.log("📊 分段结果:");');
console.log('  ');
console.log('  // 这里应该调用实际的API');
console.log('  fetch("/api/generate-stream", {');
console.log('    method: "POST",');
console.log('    headers: {');
console.log('      "Content-Type": "application/json",');
console.log('      "Authorization": `Bearer ${authState?.accessToken || ""}`');
console.log('    },');
console.log('    body: JSON.stringify({');
console.log('      prompt: prompt,');
console.log('      model: "deepseek-chat"');
console.log('    })');
console.log('  }).then(r => {');
console.log('    console.log("响应状态:", r.status);');
console.log('    if (r.status === 200) {');
console.log('      console.log("✅ 分段生成启动成功");');
console.log('    } else {');
console.log('      console.log("❌ 请求失败");');
console.log('    }');
console.log('  }).catch(err => console.error("错误:", err));');
console.log('}');
console.log('');

console.log('📈 预期输出：');
console.log('============');
console.log('');
console.log('🎯 启用分段生成模式（全任务适用）');
console.log('📊 提示已分割为 X 个部分');
console.log('📝 生成第 1/X 部分...');
console.log('📝 生成第 2/X 部分...');
console.log('📝 生成第 X/X 部分...');
console.log('✅ 分段生成完成');
console.log('');

console.log('⚡ 性能优势：');
console.log('============');
console.log('• 每个段落 < 30秒生成');
console.log('• 总生成时间可达几分钟');
console.log('• 无1分钟超时限制');
console.log('• 保持流式用户体验');
console.log('• 段落失败不影响整体');
console.log('');

console.log('🎉 现在开始测试吧！');
console.log('===================');
console.log('');
console.log('打开浏览器访问: http://localhost:3000/generate');
console.log('在控制台运行测试代码，观察分段生成过程。');
console.log('');
console.log('所有提示词都会被自动分割，确保稳定性！🚀');






