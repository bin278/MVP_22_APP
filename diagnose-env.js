#!/usr/bin/env node

/**
 * 全面的环境变量诊断脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔬 环境变量全面诊断\n');

// 1. 检查环境变量文件
console.log('📄 第一步：检查环境变量文件');
const envPaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env.development'),
  path.join(process.cwd(), '.env.production')
];

let foundEnvFile = false;
envPaths.forEach(envPath => {
  if (fs.existsSync(envPath)) {
    console.log(`  ✅ 找到: ${path.basename(envPath)}`);
    foundEnvFile = true;

    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');

      console.log(`     文件大小: ${content.length} 字符`);
      console.log(`     总行数: ${lines.length}`);

      // 检查微信支付变量
      const wechatVars = lines.filter(line =>
        line.includes('WECHAT_PAY_APPID=') ||
        line.includes('WECHAT_PAY_MCHID=')
      );

      if (wechatVars.length > 0) {
        console.log(`     ✅ 包含微信支付配置 (${wechatVars.length} 行)`);
        wechatVars.forEach(line => {
          const [key, value] = line.split('=');
          const displayValue = value ? value.substring(0, 20) + (value.length > 20 ? '...' : '') : '空';
          console.log(`        ${key}=${displayValue}`);
        });
      } else {
        console.log(`     ❌ 未找到微信支付配置`);
      }

    } catch (error) {
      console.log(`     ❌ 读取失败: ${error.message}`);
    }
  }
});

if (!foundEnvFile) {
  console.log('  ❌ 未找到任何环境变量文件 (.env, .env.local, .env.development, .env.production)');
}

// 2. 检查Node.js进程环境变量
console.log('\n🔍 第二步：检查Node.js进程环境变量');

const wechatEnvVars = [
  'WECHAT_PAY_APPID',
  'WECHAT_PAY_MCHID',
  'WECHAT_PAY_SERIAL_NO',
  'WECHAT_PAY_PRIVATE_KEY',
  'WECHAT_PAY_API_V3_KEY'
];

let allWechatVarsMissing = true;
wechatEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    allWechatVarsMissing = false;
    const displayValue = varName.includes('PRIVATE_KEY') || varName.includes('API_V3_KEY') ?
      `[${value.length}字符]` :
      varName.includes('SERIAL_NO') ?
      `[${value.length}字符]` :
      value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
  }
});

// 3. 检查Next.js配置
console.log('\n⚙️  第三步：检查Next.js配置');

const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  console.log('  ✅ next.config.mjs 存在');
  try {
    const configContent = fs.readFileSync(nextConfigPath, 'utf8');
    if (configContent.includes('env')) {
      console.log('  ✅ 包含环境变量配置');
    } else {
      console.log('  ⚠️  未找到环境变量配置');
    }
  } catch (error) {
    console.log(`  ❌ 读取配置失败: ${error.message}`);
  }
} else {
  console.log('  ❌ next.config.mjs 不存在');
}

// 4. 检查gitignore
console.log('\n🚫 第四步：检查.gitignore配置');

const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const envFilesInGitignore = ['.env', '.env.local', '.env.*'].filter(pattern =>
    gitignoreContent.includes(pattern)
  );

  if (envFilesInGitignore.length > 0) {
    console.log(`  ⚠️  .gitignore 排除了环境变量文件: ${envFilesInGitignore.join(', ')}`);
    console.log('     这可能会导致环境变量文件被意外忽略');
  } else {
    console.log('  ✅ .gitignore 配置正常');
  }
} else {
  console.log('  ❌ .gitignore 文件不存在');
}

// 5. 诊断结果
console.log('\n📋 第五步：诊断结果');

if (!foundEnvFile) {
  console.log('❌ 问题: 没有找到环境变量文件');
  console.log('💡 解决: 创建 .env.local 文件并添加环境变量');
} else if (allWechatVarsMissing) {
  console.log('❌ 问题: 环境变量文件存在但变量未加载到Node.js进程');
  console.log('💡 解决: 重启Next.js开发服务器');
} else {
  console.log('✅ 环境变量文件正常，但某些变量可能有格式问题');
}

console.log('\n🔧 建议解决方案:');
console.log('1. 确保 .env.local 文件在项目根目录');
console.log('2. 检查环境变量格式 (等号前后无空格)');
console.log('3. 重启Next.js开发服务器: pnpm dev');
console.log('4. 如果仍有问题，检查Next.js缓存: rm -rf .next && pnpm dev');

console.log('\n📖 环境变量配置参考: ENV_CONFIG_EXAMPLE.md');




