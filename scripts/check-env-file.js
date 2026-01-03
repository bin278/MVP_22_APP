// 检查.env.local文件内容
const fs = require('fs');
const path = require('path');

function checkEnvFile() {
  console.log('🔍 检查 .env.local 文件内容...\n');

  const envFilePath = path.join(process.cwd(), '.env.local');

  try {
    // 读取文件内容
    const content = fs.readFileSync(envFilePath, 'utf8');
    console.log('📄 .env.local 文件内容:');
    console.log('─'.repeat(50));
    console.log(content);
    console.log('─'.repeat(50));

    // 分析支付宝相关配置
    console.log('\n💰 支付宝配置分析:');

    const lines = content.split('\n');
    const alipayVars = ['ALIPAY_APP_ID', 'ALIPAY_PRIVATE_KEY', 'ALIPAY_PUBLIC_KEY', 'ALIPAY_GATEWAY_URL'];

    let foundVars = {};
    let hasAlipayConfig = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#') || trimmedLine === '') return;

      for (const varName of alipayVars) {
        if (trimmedLine.startsWith(varName + '=')) {
          hasAlipayConfig = true;
          const value = trimmedLine.substring(varName.length + 1);
          foundVars[varName] = value;

          console.log(`  ${varName}: ${value ? '✅ 已设置' : '❌ 为空'}`);
          if (value && varName.includes('KEY')) {
            const hasBegin = value.includes('BEGIN');
            const hasEnd = value.includes('END');
            console.log(`    🔐 格式检查: ${hasBegin && hasEnd ? '✅ PEM格式' : '❌ 格式错误'}`);
          }
          break;
        }
      }
    });

    if (!hasAlipayConfig) {
      console.log('❌ 未找到任何支付宝配置！');
      console.log('\n💡 请确保在 .env.local 中添加了支付宝配置');
    } else {
      console.log('\n🎯 配置状态总结:');
      const required = ['ALIPAY_APP_ID', 'ALIPAY_PRIVATE_KEY', 'ALIPAY_PUBLIC_KEY'];
      const allConfigured = required.every(varName => foundVars[varName] && foundVars[varName].trim() !== '');

      if (allConfigured) {
        console.log('✅ 所有必需配置都已设置！');
        console.log('\n🔄 现在测试环境变量是否被Node.js读取...');

        // 测试环境变量读取
        console.log('\n📊 Node.js环境变量读取测试:');
        required.forEach(varName => {
          const envValue = process.env[varName];
          console.log(`  ${varName}: ${envValue ? '✅ 可读取' : '❌ 无法读取'}`);
        });

        const canReadAll = required.every(varName => process.env[varName]);

        if (canReadAll) {
          console.log('\n🎉 配置完全正确！支付宝应该可以正常工作了！');
          console.log('💡 如果支付仍有问题，请重启开发服务器: npm run dev');
        } else {
          console.log('\n⚠️ 文件中有配置，但Node.js无法读取！');
          console.log('🔧 解决方案:');
          console.log('1. 停止开发服务器 (Ctrl+C)');
          console.log('2. 重启开发服务器: npm run dev');
          console.log('3. 重新测试: node scripts/verify-alipay-setup.js');
        }

      } else {
        console.log('❌ 仍有配置缺失！');
        console.log('\n📝 缺失的配置:');
        required.forEach(varName => {
          if (!foundVars[varName] || foundVars[varName].trim() === '') {
            console.log(`  - ${varName}`);
          }
        });
      }
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('❌ .env.local 文件不存在！');
      console.log('📝 创建步骤:');
      console.log('1. 在项目根目录创建 .env.local 文件');
      console.log('2. 添加支付宝配置');
    } else {
      console.log('❌ 读取文件失败:', error.message);
    }
  }

  console.log('\n🔍 相关命令:');
  console.log('• 检查文件内容: node scripts/check-env-file.js');
  console.log('• 验证配置: node scripts/verify-alipay-setup.js');
  console.log('• 测试支付: node test-alipay-debug.js');
}

// 运行检查
checkEnvFile();


