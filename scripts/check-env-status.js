// 检查环境变量状态
const http = require('http');

function getEnvStatus() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/test-env', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          reject(new Error('解析响应失败'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('请求超时'));
    });
  });
}

async function main() {
  try {
    console.log('🔍 获取环境变量状态...\n');
    const response = await getEnvStatus();

    console.log('📋 环境变量配置状态:');
    console.log('='.repeat(60));

    if (response.envVars) {
      Object.entries(response.envVars).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }

    console.log('\n🔧 关键配置检查:');
    console.log('='.repeat(40));

    const critical = [
      'DEEPSEEK_API_KEY',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'ALIPAY_APP_ID',
      'ALIPAY_PRIVATE_KEY',
      'ALIPAY_PUBLIC_KEY',
      'TENCENT_CLOUD_SECRET_ID',
      'TENCENT_CLOUD_SECRET_KEY',
      'TENCENT_CLOUD_ENV_ID'
    ];

    let allConfigured = true;
    critical.forEach(key => {
      const status = response.envVars[key] === '✅ 已加载' ? '✅' : '❌';
      const message = response.envVars[key] || '未设置';
      console.log(`${status} ${key}: ${message}`);
      if (status === '❌') allConfigured = false;
    });

    console.log('\n📊 配置总结:');
    console.log(allConfigured ? '✅ 所有关键配置已正确设置' : '❌ 部分配置缺失或未设置');

    if (response.keyFormats) {
      console.log('\n🔐 密钥格式检查:');
      Object.entries(response.keyFormats).forEach(([key, value]) => {
        const status = value === '✅ 正确' ? '✅' : '❌';
        console.log(`${status} ${key}: ${value}`);
      });
    }

    console.log('\n🚀 应用状态: 正在运行 ✅');
    console.log(`🌐 访问地址: http://localhost:3000`);

  } catch (error) {
    console.log('❌ 获取环境变量状态失败:', error.message);
    console.log('\n💡 请确保应用正在运行:');
    console.log('   npm run dev');
  }
}

main();
