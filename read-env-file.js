#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local 文件不存在');
  process.exit(1);
}

console.log('📄 .env.local 文件内容 (70-93行):\n');

try {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');

  for (let i = 69; i < Math.min(93, lines.length); i++) {
    const line = lines[i];
    const lineNum = (i + 1).toString().padStart(2, ' ');
    console.log(`${lineNum}: ${line}`);
  }

  console.log(`\n📊 总行数: ${lines.length}`);

  // 检查微信支付配置
  const wechatLines = lines.filter(line => line.includes('WECHAT_PAY'));
  console.log(`📱 微信支付配置行数: ${wechatLines.length}`);

  if (wechatLines.length > 0) {
    console.log('\n微信支付配置:');
    wechatLines.forEach(line => {
      const [key] = line.split('=');
      console.log(`  ✅ ${key}`);
    });
  }

} catch (error) {
  console.log(`❌ 读取文件失败: ${error.message}`);
}




