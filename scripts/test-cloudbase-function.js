// 测试CloudBase云函数
const cloudbase = require('@cloudbase/node-sdk');
const fs = require('fs');
const path = require('path');

// 手动加载环境变量
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');

      envLines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      });
      return true;
    }
  } catch (error) {
    console.log('读取环境变量文件失败:', error.message);
  }
  return false;
}

async function testCloudBaseFunction() {
  try {
    console.log('🔍 测试CloudBase云函数调用...\n');

    // 加载环境变量
    const envLoaded = loadEnvFile();
    console.log('📋 环境变量加载:', envLoaded ? '✅' : '❌');

    // 检查环境变量
    console.log('📋 环境变量检查:');
    console.log('TENCENT_CLOUD_ENV_ID:', process.env.TENCENT_CLOUD_ENV_ID ? '✅' : '❌');
    console.log('TENCENT_CLOUD_SECRET_ID:', process.env.TENCENT_CLOUD_SECRET_ID ? '✅' : '❌');
    console.log('TENCENT_CLOUD_SECRET_KEY:', process.env.TENCENT_CLOUD_SECRET_KEY ? '✅' : '❌');

    if (!process.env.TENCENT_CLOUD_ENV_ID ||
        !process.env.TENCENT_CLOUD_SECRET_ID ||
        !process.env.TENCENT_CLOUD_SECRET_KEY) {
      console.log('\n❌ 环境变量未配置，请检查 .env.local 文件');
      console.log('📖 配置方法: 复制 CLOUDBASE_ENV_EXAMPLE.env 为 .env.local 并填入正确的值');
      return;
    }

    // 初始化CloudBase
    console.log('\n🔧 初始化CloudBase...');
    const app = cloudbase.init({
      env: process.env.TENCENT_CLOUD_ENV_ID,
      secretId: process.env.TENCENT_CLOUD_SECRET_ID,
      secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
    });

    console.log('✅ CloudBase初始化成功');

    // 测试云函数调用
    console.log('\n📤 测试调用 sendEmailVerification 云函数...');
    try {
      const result = await app.callFunction({
        name: 'sendEmailVerification',
        data: {
          email: 'test@example.com' // 请替换为真实邮箱进行测试
        }
      });

      console.log('✅ 云函数调用成功');
      console.log('📧 返回结果:', result);

      if (result.result && result.result.success) {
        console.log('🎉 验证码邮件发送成功！');
        console.log('📮 请检查邮箱: test@example.com');
      } else {
        console.log('⚠️ 云函数返回错误:', result.result);
      }

    } catch (functionError) {
      console.log('❌ 云函数调用失败');
      console.log('🔍 错误详情:', functionError.message);

      if (functionError.message.includes('not found')) {
        console.log('\n💡 解决方案: 请先部署 sendEmailVerification 云函数');
        console.log('📋 部署步骤:');
        console.log('1. 复制 cloud-functions/sendEmailVerification 到CloudBase项目');
        console.log('2. 在控制台部署云函数');
        console.log('3. 或运行: cloudbase functions:deploy sendEmailVerification');
      } else if (functionError.message.includes('signature')) {
        console.log('\n🔐 签名验证失败，请检查:');
        console.log('1. ✅ SecretId 和 SecretKey 是否正确');
        console.log('2. ✅ 环境ID 是否正确');
        console.log('3. ✅ CloudBase账户权限是否足够');
        console.log('4. ✅ 时钟是否同步');
      }
    }

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('🔍 完整错误:', error);
  }
}

if (require.main === module) {
  testCloudBaseFunction();
}

module.exports = { testCloudBaseFunction };
