// 检查数据库连接和集合状态
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
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
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('请求超时'));
    });
  });
}

async function checkDatabaseConnection() {
  try {
    console.log('🔍 检查CloudBase数据库连接...\n');

    const response = await makeRequest('http://localhost:3000/api/test-db');

    console.log('📊 数据库连接测试结果:');
    console.log('='.repeat(50));

    if (response.success) {
      console.log('✅ 数据库连接成功');

      console.log('\n📋 环境变量配置:');
      if (response.envCheck) {
        Object.entries(response.envCheck).forEach(([key, value]) => {
          console.log(`   ${key}: ${value ? '✅' : '❌'}`);
        });
      }

      console.log('\n📊 Payments集合状态:');
      if (response.paymentsQuery) {
        if (response.paymentsQuery.success) {
          console.log('   ✅ 查询成功');
          console.log(`   📈 记录总数: ${response.paymentsQuery.total || 0}`);
          console.log(`   📄 是否有数据: ${response.paymentsQuery.hasData ? '是' : '否'}`);
        } else {
          console.log('   ❌ 查询失败');
          console.log(`   🔍 错误信息: ${response.paymentsQuery.error}`);

          if (response.paymentsQuery.error.includes('Db or Table not exist') ||
              response.paymentsQuery.error.includes('DATABASE_COLLECTION_NOT_EXIST')) {
            console.log('\n💡 解决方案:');
            console.log('   1. 登录腾讯云CloudBase控制台');
            console.log('   2. 进入数据库管理页面');
            console.log('   3. 创建名为 "payments" 的集合');
            console.log('   4. 设置集合权限为: 读取-true, 写入-true');
          }
        }
      }

      console.log('\n📝 测试记录添加:');
      if (response.addTest) {
        if (response.addTest.success) {
          console.log('   ✅ 添加成功');
          console.log(`   🆔 测试ID: ${response.addTest.testId}`);
        } else {
          console.log('   ❌ 添加失败');
          console.log(`   🔍 错误信息: ${response.addTest.error}`);
        }
      }

    } else {
      console.log('❌ 数据库连接失败');
      console.log(`🔍 错误信息: ${response.error}`);

      if (response.error.includes('缺少CloudBase环境变量')) {
        console.log('\n💡 解决方案:');
        console.log('   1. 检查 .env.local 文件');
        console.log('   2. 确保包含以下变量:');
        console.log('      - TENCENT_CLOUD_SECRET_ID');
        console.log('      - TENCENT_CLOUD_SECRET_KEY');
        console.log('      - TENCENT_CLOUD_ENV_ID');
      }
    }

    console.log('\n⏰ 测试时间:', response.timestamp);

  } catch (error) {
    console.log('❌ 检查失败:', error.message);
    console.log('\n💡 请确保应用正在运行: npm run dev');
  }
}

checkDatabaseConnection();


