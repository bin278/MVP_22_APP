// 通过HTTP请求测试各个API端点
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data.substring(0, 200) });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
  });
}

async function testEndpoint(name, url, expectedStatus = 200) {
  try {
    console.log(`🧪 测试: ${name}`);
    console.log(`   URL: ${url}`);

    const response = await makeRequest(url);

    if (response.status === expectedStatus) {
      console.log(`   ✅ 状态码: ${response.status} (期望: ${expectedStatus})`);
      console.log(`   📄 响应: ${typeof response.data === 'object' ? 'JSON对象' : response.data.substring(0, 100) + '...'}`);
      return { success: true, response };
    } else {
      console.log(`   ❌ 状态码: ${response.status} (期望: ${expectedStatus})`);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runApiTests() {
  console.log('🚀 开始API功能测试...\n');

  const tests = [
    { name: '应用首页', url: `${BASE_URL}/`, expectedStatus: 200 },
    { name: '环境变量API', url: `${BASE_URL}/api/test-env`, expectedStatus: 200 },
    { name: '数据库测试API', url: `${BASE_URL}/api/test-db`, expectedStatus: 200 },
    { name: '支付测试API', url: `${BASE_URL}/api/test-payments`, expectedStatus: 200 },
    { name: '登录页面', url: `${BASE_URL}/login`, expectedStatus: 200 },
    { name: '支付页面', url: `${BASE_URL}/payment`, expectedStatus: 200 },
    { name: '个人资料页面', url: `${BASE_URL}/profile`, expectedStatus: 200 },
    { name: '代码生成页面', url: `${BASE_URL}/generate`, expectedStatus: 200 },
  ];

  let passed = 0;
  let failed = 0;

  console.log('📋 API端点测试:');
  console.log('='.repeat(60));

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, test.expectedStatus);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('📊 API测试结果:');
  console.log(`✅ 通过: ${passed} 个`);
  console.log(`❌ 失败: ${failed} 个`);
  console.log(`📈 总计: ${tests.length} 个`);

  const successRate = ((passed / tests.length) * 100).toFixed(1);
  console.log(`🎯 成功率: ${successRate}%`);

  if (failed === 0) {
    console.log('\n🎉 所有API测试通过！应用运行正常！');
    console.log('\n🌐 现在可以访问应用:');
    console.log(`   ${BASE_URL}`);
    console.log('\n🧪 建议测试的功能:');
    console.log('   • 用户注册和登录');
    console.log('   • AI对话功能');
    console.log('   • 支付功能');
    console.log('   • GitHub集成');
    console.log('   • 代码生成功能');
  } else {
    console.log('\n⚠️ 部分API测试失败，请检查应用是否正在运行。');
    console.log('\n🔧 启动应用:');
    console.log('   npm run dev');
  }

  // 特别测试关键功能
  console.log('\n🔍 关键功能状态检查:');

  try {
    const envResponse = await makeRequest(`${BASE_URL}/api/test-env`);
    if (envResponse.status === 200 && envResponse.data?.envVars) {
      console.log('✅ 环境变量配置正常');

      const envVars = envResponse.data.envVars;
      const checks = [
        { name: 'CloudBase配置', vars: ['TENCENT_CLOUD_SECRET_ID', 'TENCENT_CLOUD_SECRET_KEY', 'TENCENT_CLOUD_ENV_ID'] },
        { name: '支付宝配置', vars: ['ALIPAY_APP_ID', 'ALIPAY_PRIVATE_KEY', 'ALIPAY_PUBLIC_KEY'] },
        { name: 'AI配置', vars: ['DEEPSEEK_API_KEY'] },
        { name: 'GitHub配置', vars: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'] },
      ];

      checks.forEach(check => {
        const configured = check.vars.every(varName => envVars[varName] === '✅ 已加载');
        console.log(`${configured ? '✅' : '❌'} ${check.name}: ${configured ? '已配置' : '未配置'}`);
      });
    }
  } catch (error) {
    console.log('❌ 环境变量检查失败');
  }

  try {
    const dbResponse = await makeRequest(`${BASE_URL}/api/test-db`);
    if (dbResponse.status === 200) {
      console.log('✅ CloudBase数据库连接正常');
    }
  } catch (error) {
    console.log('❌ CloudBase数据库连接异常');
  }
}

// 运行测试
runApiTests().catch(error => {
  console.error('API测试执行失败:', error);
  console.log('\n💡 请确保应用正在运行:');
  console.log('   npm run dev');
  console.log('   然后重新运行此测试');
});


