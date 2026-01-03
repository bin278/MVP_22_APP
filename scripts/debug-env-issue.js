// 调试环境变量加载问题
const fs = require('fs');
const path = require('path');

console.log('🔍 调试环境变量加载问题...\n');

// 1. 检查文件是否存在
const envFile = path.join(process.cwd(), '.env.local');
console.log('📁 检查 .env.local 文件:');
console.log(`  路径: ${envFile}`);
console.log(`  存在: ${fs.existsSync(envFile) ? '✅' : '❌'}`);

if (!fs.existsSync(envFile)) {
  console.log('❌ .env.local 文件不存在！');
  process.exit(1);
}

// 2. 读取文件内容
console.log('\n📄 读取文件内容:');
const content = fs.readFileSync(envFile, 'utf8');
const lines = content.split('\n');
console.log(`  总行数: ${lines.length}`);

// 3. 解析环境变量
console.log('\n🔍 解析环境变量:');
const envVars = {};
let currentVar = null;
let currentValue = [];

lines.forEach((line, index) => {
  const trimmed = line.trim();

  // 跳过注释和空行
  if (trimmed.startsWith('#') || trimmed === '') {
    return;
  }

  // 检查是否是变量定义
  const equalIndex = trimmed.indexOf('=');
  if (equalIndex > 0) {
    // 保存之前的变量
    if (currentVar) {
      envVars[currentVar] = currentValue.join('\n');
    }

    // 开始新变量
    currentVar = trimmed.substring(0, equalIndex);
    const initialValue = trimmed.substring(equalIndex + 1);

    // 检查是否是多行值（以引号开头）
    if (initialValue.startsWith('"')) {
      if (initialValue.endsWith('"') && !initialValue.endsWith('\\"')) {
        // 单行完整值
        currentValue = [initialValue.slice(1, -1)];
      } else {
        // 多行值开始
        currentValue = [initialValue.slice(1)];
      }
    } else {
      // 单行值
      currentValue = [initialValue];
    }
  } else if (currentVar && currentValue.length > 0) {
    // 继续多行值
    if (trimmed.endsWith('"')) {
      // 多行值结束
      currentValue.push(trimmed.slice(0, -1));
      envVars[currentVar] = currentValue.join('\n');
      currentVar = null;
      currentValue = [];
    } else {
      // 多行值继续
      currentValue.push(trimmed);
    }
  }
});

// 保存最后一个变量
if (currentVar) {
  envVars[currentVar] = currentValue.join('\n');
}

// 4. 检查支付宝变量
console.log('\n💰 检查支付宝配置:');
const alipayVars = ['ALIPAY_APP_ID', 'ALIPAY_PRIVATE_KEY', 'ALIPAY_PUBLIC_KEY', 'ALIPAY_GATEWAY_URL'];

alipayVars.forEach(varName => {
  const fileValue = envVars[varName];
  const processValue = process.env[varName];

  console.log(`\n${varName}:`);
  console.log(`  文件中的值: ${fileValue ? '✅' : '❌'}`);
  console.log(`  长度: ${fileValue ? fileValue.length : 0}`);
  console.log(`  process.env中的值: ${processValue ? '✅' : '❌'}`);
  console.log(`  匹配: ${fileValue === processValue ? '✅' : '❌'}`);

  if (fileValue && varName.includes('KEY')) {
    const hasBegin = fileValue.includes('BEGIN');
    const hasEnd = fileValue.includes('END');
    const lineCount = fileValue.split('\n').length;
    console.log(`  PEM格式: ${hasBegin && hasEnd ? '✅' : '❌'}`);
    console.log(`  行数: ${lineCount}`);
  }
});

// 5. 总结
console.log('\n🎯 问题诊断:');
const fileHasAll = alipayVars.every(v => envVars[v]);
const processHasAll = alipayVars.every(v => process.env[v]);

if (fileHasAll && !processHasAll) {
  console.log('❌ 文件中有配置，但Next.js没有加载环境变量');
  console.log('💡 解决方案:');
  console.log('1. 检查 Next.js 版本是否支持 .env.local');
  console.log('2. 确保开发服务器完全重启');
  console.log('3. 检查是否有语法错误阻止环境变量加载');

} else if (!fileHasAll) {
  console.log('❌ 文件中缺少配置');

} else {
  console.log('✅ 配置正确，环境变量正常加载');
  console.log('🎉 支付宝应该可以正常工作了！');
}


