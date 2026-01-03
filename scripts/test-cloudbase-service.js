// 测试CloudBase服务状态
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve({ error: '解析响应失败', raw: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('请求超时'));
    });

    req.end();
  });
}

async function testCloudBaseService() {
  console.log('🧪 CloudBase服务状态测试...\n');

  try {
    // 测试数据库连接
    console.log('📊 测试数据库连接...');
    const dbResult = await makeRequest('/api/test-db');

    if (dbResult.success) {
      console.log('✅ CloudBase连接成功');

      if (dbResult.paymentsQuery) {
        console.log(`📈 Payments集合查询: ${dbResult.paymentsQuery.success ? '成功' : '失败'}`);
        if (dbResult.paymentsQuery.success) {
          console.log(`   记录总数: ${dbResult.paymentsQuery.total}`);
        } else {
          console.log(`   错误: ${dbResult.paymentsQuery.error}`);
        }
      }

      if (dbResult.addTest) {
        console.log(`📝 测试集合写入: ${dbResult.addTest.success ? '成功' : '失败'}`);
        if (!dbResult.addTest.success) {
          console.log(`   错误: ${dbResult.addTest.error}`);
        }
      }
    } else {
      console.log('❌ CloudBase连接失败:', dbResult.error);
    }

    console.log('\n💡 服务状态分析:');
    const canRead = dbResult.paymentsQuery?.success;
    const canWrite = dbResult.addTest?.success;

    if (canRead && canWrite) {
      console.log('✅ CloudBase服务完全正常');
      console.log('🎉 支付记录应该可以正常保存');
    } else if (canRead && !canWrite) {
      console.log('⚠️ 数据库可读但不可写');
      console.log('💡 解决方案: 检查CloudBase控制台的集合权限设置');
      console.log('   1. 进入数据库管理');
      console.log('   2. 选择相关集合');
      console.log('   3. 设置权限: 读取=true, 写入=true');
    } else {
      console.log('❌ CloudBase服务异常');
      console.log('💡 可能原因:');
      console.log('   • 网络连接问题');
      console.log('   • 环境变量配置错误');
      console.log('   • CloudBase服务不可用');
    }

    console.log('\n🔧 建议行动:');
    if (!canWrite) {
      console.log('1. 登录CloudBase控制台: https://console.cloud.tencent.com/tcb');
      console.log('2. 选择环境: cloud1-3gn61ziydcfe6a57');
      console.log('3. 进入数据库 > 集合管理');
      console.log('4. 为以下集合设置读写权限:');
      console.log('   • payments');
      console.log('   • conversations');
      console.log('   • conversation_messages');
      console.log('   • user_subscriptions');
      console.log('   • users');
      console.log('5. 重新测试支付功能');
    } else {
      console.log('✅ 无需额外配置，服务正常');
    }

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('\n💡 请确保应用正在运行: npm run dev');
  }
}

testCloudBaseService();


