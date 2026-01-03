// 检查腾讯云CloudBase连接和配置
console.log('🔍 腾讯云CloudBase连接和配置检查...\n');

// 1. 检查环境变量
console.log('📋 环境变量配置:');
const envVars = [
  'TENCENT_CLOUD_SECRET_ID',
  'TENCENT_CLOUD_SECRET_KEY',
  'TENCENT_CLOUD_ENV_ID'
];

let envComplete = true;
envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: 已设置 (${value.length} 字符)`);
  } else {
    console.log(`❌ ${varName}: 未设置`);
    envComplete = false;
  }
});

if (!envComplete) {
  console.log('\n❌ 环境变量不完整，请检查 .env.local 文件');
  process.exit(1);
}

console.log('\n✅ 环境变量配置完整');

// 2. 测试网络连接
console.log('\n🌐 网络连接测试...');

const https = require('https');

function testNetworkConnection(url, name) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: url,
      path: '/ping',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log(`✅ ${name}连接: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ ${name}连接失败: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${name}连接超时`);
      req.abort();
      resolve(false);
    });

    req.end();
  });
}

// 测试多个腾讯云服务
async function testConnections() {
  const tests = [
    { url: 'tcb.tencentcloudapi.com', name: '腾讯云API' },
    { url: 'servicewechat.com', name: '微信服务' }
  ];

  for (const test of tests) {
    await testNetworkConnection(test.url, test.name);
  }

  console.log('\n💡 网络连接检查完成');
}

testConnections();


