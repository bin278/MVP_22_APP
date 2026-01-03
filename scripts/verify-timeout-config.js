#!/usr/bin/env node

/**
 * CloudBase超时配置验证脚本
 */

console.log('⏱️  CloudBase超时配置验证');
console.log('=========================\n');

// 检查本地配置文件
console.log('1️⃣ 检查本地配置文件...');

const fs = require('fs');
const path = require('path');

// 检查 .cloudbaserc.json (GitHub部署)
const githubConfigPath = path.join(__dirname, '..', '.cloudbaserc.json');
if (fs.existsSync(githubConfigPath)) {
  const githubConfig = JSON.parse(fs.readFileSync(githubConfigPath, 'utf8'));
  const githubTimeout = githubConfig.framework?.timeout;

  console.log('📄 .cloudbaserc.json (GitHub部署):');
  if (githubTimeout === 600) {
    console.log('   ✅ 超时时间: 600秒 ✓');
  } else {
    console.log(`   ❌ 超时时间: ${githubTimeout || '未设置'} (期望: 600)`);
  }
} else {
  console.log('   ⚠️  .cloudbaserc.json 文件不存在');
}

// 检查 cloudbaserc.json (CLI部署)
const cliConfigPath = path.join(__dirname, '..', 'cloudbaserc.json');
if (fs.existsSync(cliConfigPath)) {
  const cliConfig = JSON.parse(fs.readFileSync(cliConfigPath, 'utf8'));
  const cliTimeout = cliConfig.framework?.plugins?.run?.inputs?.timeout;

  console.log('📄 cloudbaserc.json (CLI部署):');
  if (cliTimeout === 600) {
    console.log('   ✅ 超时时间: 600秒 ✓');
  } else {
    console.log(`   ❌ 超时时间: ${cliTimeout || '未设置'} (期望: 600)`);
  }
} else {
  console.log('   ⚠️  cloudbaserc.json 文件不存在');
}

console.log('\n2️⃣ 部署状态检查建议:');
console.log('---------------------');
console.log('🔍 检查CloudBase控制台:');
console.log('   https://console.cloud.tencent.com/tcb/');
console.log('   → 选择你的环境');
console.log('   → 云托管 → 设置');
console.log('   → 查看"超时时间"是否为600秒');
console.log('');

console.log('3️⃣ 功能验证测试:');
console.log('----------------');
console.log('🧪 运行以下测试验证超时是否生效:');
console.log('');

console.log('方法A: 浏览器控制台测试');
console.log('```javascript');
console.log('// 在浏览器控制台运行');
console.log('console.log("🧪 开始10分钟超时测试...");');
console.log('');
console.log('// 创建一个需要长时间处理的复杂提示');
console.log('const complexPrompt = "创建一个完整的电商平台，包含用户管理、商品管理、购物车、订单系统、支付集成、管理员后台、数据统计、搜索功能、评论系统、优惠券系统、物流跟踪、退换货处理、多语言支持、移动端适配、SEO优化、性能监控、安全防护等完整功能";');
console.log('');
console.log('// 发送生成请求');
console.log('fetch("/api/generate-stream", {');
console.log('  method: "POST",');
console.log('  headers: {');
console.log('    "Content-Type": "application/json",');
console.log('    "Authorization": `Bearer ${JSON.parse(localStorage.getItem("app-auth-state") || "{}")?.accessToken || ""}`');
console.log('  },');
console.log('  body: JSON.stringify({');
console.log('    prompt: complexPrompt,');
console.log('    model: "deepseek-chat"');
console.log('  })');
console.log('}).then(r => {');
console.log('  if (r.ok) {');
console.log('    console.log("✅ 请求发送成功，开始流式接收...");');
console.log('    return r.body.getReader();');
console.log('  } else {');
console.log('    return r.text().then(t => console.log("❌ 请求失败:", t));');
console.log('  }');
console.log('}).then(reader => {');
console.log('  if (!reader) return;');
console.log('  ');
console.log('  let startTime = Date.now();');
console.log('  let lastHeartbeat = Date.now();');
console.log('  ');
console.log('  function readStream() {');
console.log('    reader.read().then(({done, value}) => {');
console.log('      if (done) {');
console.log('        let duration = (Date.now() - startTime) / 1000;');
console.log('        console.log(`🎉 流式生成完成！总耗时: ${duration}秒`);');
console.log('        return;');
console.log('      }');
console.log('      ');
console.log('      const chunk = new TextDecoder().decode(value);');
console.log('      const lines = chunk.split("\\n");');
console.log('      ');
console.log('      lines.forEach(line => {');
console.log('        if (line.startsWith("data: ")) {');
console.log('          try {');
console.log('            const data = JSON.parse(line.slice(6));');
console.log('            if (data.type === "heartbeat") {');
console.log('              lastHeartbeat = Date.now();');
console.log('              console.log(`❤️ 心跳包 ${new Date().toLocaleTimeString()}`);');
console.log('            } else if (data.type === "chars") {');
console.log('              console.log(`📝 收到代码片段 (${data.chars?.length || 0}字符)`);');
console.log('            } else if (data.type === "complete") {');
console.log('              console.log("✅ 代码生成完成！");');
console.log('            } else if (data.type === "error") {');
console.log('              console.log("❌ 生成出错:", data.error);');
console.log('            }');
console.log('          } catch (e) {}');
console.log('        }');
console.log('      });');
console.log('      ');
console.log('      // 检查是否超时 (超过11分钟)  ');
console.log('      let elapsed = (Date.now() - startTime) / 1000;');
console.log('      if (elapsed > 660) { // 11分钟');
console.log('        console.log(`⏰ 运行时间: ${elapsed}秒 - 如果还没完成，说明超时配置生效但任务可能太复杂`);');
console.log('      } else {');
console.log('        readStream();');
console.log('      }');
console.log('    });');
console.log('  }');
console.log('  ');
console.log('  readStream();');
console.log('});');
console.log('```');
console.log('');

console.log('方法B: API直接测试');
console.log('```bash');
console.log('# 或者在终端运行简单的超时测试');
console.log('curl -X POST http://localhost:3000/api/generate-stream \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -d \'{"prompt":"创建一个简单的按钮组件","model":"deepseek-chat"}\'');
console.log('```');
console.log('');

console.log('4️⃣ 验证成功标志:');
console.log('-----------------');
console.log('✅ 配置文件显示600秒');
console.log('✅ CloudBase控制台显示600秒');
console.log('✅ 复杂任务能运行超过1分钟');
console.log('✅ 心跳包持续发送');
console.log('✅ 无"1分钟超时"错误');
console.log('✅ 任务最终完成或智能切换到异步模式');
console.log('');

console.log('5️⃣ 故障排除:');
console.log('------------');
console.log('❌ 如果仍然超时:');
console.log('   • 检查是否重新部署了应用');
console.log('   • 确认使用的是正确的配置文件');
console.log('   • 在CloudBase控制台手动设置超时时间');
console.log('');
console.log('❌ 如果心跳包停止:');
console.log('   • 检查网络连接');
console.log('   • 查看CloudBase日志');
console.log('   • 可能需要重新部署');
console.log('');

console.log('🎯 总结:');
console.log('=======');
console.log('如果您能看到心跳包持续发送超过2分钟，');
console.log('并且复杂任务最终完成，那么超时配置就生效了！');
console.log('');
console.log('🚀 现在可以运行上面的测试代码验证了！');
