#!/usr/bin/env node

/**
 * CloudBase 配置调试脚本
 */

console.log('🔍 CloudBase 配置调试');
console.log('=====================\n');

// 检查配置文件
console.log('📄 配置文件检查：');
console.log('================');

const fs = require('fs');
const path = require('path');

function checkFile(filePath, description) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      console.log(`✅ ${description}: ${filePath}`);
      console.log(`   路径: ${fullPath}`);
      console.log(`   大小: ${content.length} 字符`);

      // 尝试解析 JSON
      try {
        const json = JSON.parse(content);
        console.log(`   有效 JSON: ✅`);

        // 检查关键配置
        if (json.envId) {
          console.log(`   环境ID: ${json.envId}`);
        }
        if (json.framework?.plugins?.run?.inputs) {
          const inputs = json.framework.plugins.run.inputs;
          console.log(`   服务名: ${inputs.serviceName || '未设置'}`);
          console.log(`   超时时间: ${inputs.timeout || '未设置'}秒`);
          console.log(`   端口: ${inputs.port || '未设置'}`);
        }
        if (json.version) {
          console.log(`   版本: ${json.version}`);
        }
      } catch (jsonError) {
        console.log(`   有效 JSON: ❌ ${jsonError.message}`);
      }
    } else {
      console.log(`❌ ${description}: ${filePath} (文件不存在)`);
    }
  } catch (error) {
    console.log(`❌ ${description}: ${filePath} (读取失败: ${error.message})`);
  }
  console.log('');
}

checkFile('cloudbaserc.json', '主配置文件');
checkFile('.cloudbaserc.json', '隐藏配置文件');

// 检查环境变量
console.log('🔐 环境变量检查：');
console.log('================');

const requiredEnvVars = [
  'NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID',
  'TENCENT_CLOUD_ENV_ID',
  'JWT_SECRET',
  'DEEPSEEK_API_KEY',
  'NEXT_PUBLIC_APP_URL'
];

console.log('必需的环境变量：');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    const masked = value.length > 20 ? value.substring(0, 10) + '...' + value.substring(value.length - 5) : value;
    console.log(`✅ ${envVar}: ${masked}`);
  } else {
    console.log(`❌ ${envVar}: 未设置`);
  }
});

console.log('\n📋 CloudBase 优先级说明：');
console.log('========================');
console.log('1. 如果同时存在 cloudbaserc.json 和 .cloudbaserc.json：');
console.log('   • GitHub 部署通常使用 .cloudbaserc.json');
console.log('   • CLI 部署通常使用 cloudbaserc.json');
console.log('');
console.log('2. 超时设置位置：');
console.log('   • cloudbaserc.json: framework.plugins.run.inputs.timeout');
console.log('   • .cloudbaserc.json: functions[].timeout (云函数)');
console.log('');

console.log('🔧 建议解决方案：');
console.log('================');

if (fs.existsSync('.cloudbaserc.json') && fs.existsSync('cloudbaserc.json')) {
  console.log('⚠️ 发现两个配置文件，可能存在冲突！');
  console.log('');
  console.log('方案1：统一使用 .cloudbaserc.json（GitHub 部署推荐）');
  console.log('   • 修改 .cloudbaserc.json 添加超时配置');
  console.log('   • 删除或重命名 cloudbaserc.json');
  console.log('');
  console.log('方案2：统一使用 cloudbaserc.json（CLI 部署推荐）');
  console.log('   • 删除 .cloudbaserc.json');
  console.log('   • 确保 cloudbaserc.json 配置正确');
  console.log('');
}

console.log('方案3：添加云托管超时配置');
console.log('   • 在 CloudBase 控制台手动设置超时时间');
console.log('   • 云托管 → 服务 → 设置 → 超时时间: 300秒');
console.log('');

console.log('🎯 立即修复：');
console.log('============');

console.log('运行以下命令检查当前配置：');
console.log('node scripts/cloudbase-deployment-guide.js');
console.log('');
console.log('验证超时设置是否生效：');
console.log('node scripts/verify-cloudbase-timeout.js');
console.log('');

// 检查可能的解决方案
console.log('💡 可能的问题：');
console.log('==============');

if (!fs.existsSync('.cloudbaserc.json') && !fs.existsSync('cloudbaserc.json')) {
  console.log('❌ 没有找到任何 CloudBase 配置文件');
  console.log('   解决方案：创建 cloudbaserc.json 文件');
}

if (fs.existsSync('.cloudbaserc.json') && !fs.existsSync('cloudbaserc.json')) {
  console.log('ℹ️ 只找到 .cloudbaserc.json，可能缺少超时配置');
  console.log('   检查 .cloudbaserc.json 是否有超时设置');
}

if (!fs.existsSync('.cloudbaserc.json') && fs.existsSync('cloudbaserc.json')) {
  console.log('ℹ️ 只找到 cloudbaserc.json，GitHub 部署可能不识别');
  console.log('   建议创建 .cloudbaserc.json 或检查部署方式');
}

console.log('\n🚀 下一步操作：');
console.log('==============');

console.log('1. 确认使用哪种部署方式（GitHub vs CLI）');
console.log('2. 相应地配置正确的配置文件');
console.log('3. 重新部署应用');
console.log('4. 测试 AI 代码生成是否不再超时');

console.log('');






