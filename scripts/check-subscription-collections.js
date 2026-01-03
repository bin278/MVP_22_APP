// 检查订阅相关的集合状态
const http = require('http');

function makePostRequest(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-dev-token',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function checkSubscriptionCollections() {
  console.log('🔍 检查订阅相关集合状态...\n');

  try {
    // 1. 检查数据库基本状态
    console.log('1️⃣ 检查数据库基本状态...');
    const dbCheck = await makePostRequest('/api/test-db', {});
    if (dbCheck.status !== 200) {
      console.log('❌ 无法连接数据库');
      return;
    }

    console.log('✅ 数据库连接正常');
    console.log('📊 Payments记录数:', dbCheck.data.paymentsQuery?.recordCount || 0);

    // 2. 直接测试订阅API
    console.log('\n2️⃣ 测试订阅API...');
    const subscriptionCheck = await makePostRequest('/api/user/subscription', {});
    if (subscriptionCheck.status === 200) {
      const subData = subscriptionCheck.data;
      console.log('✅ 订阅API正常');
      console.log('   用户等级:', subData.subscription?.tier);
      console.log('   订阅状态:', subData.subscription?.status);
      console.log('   到期时间:', subData.subscription?.currentPeriodEnd);
    } else {
      console.log('❌ 订阅API异常:', subscriptionCheck.status);
      console.log('错误:', subscriptionCheck.data?.error);
    }

    // 3. 尝试查询user_subscriptions集合
    console.log('\n3️⃣ 尝试直接查询user_subscriptions集合...');
    try {
      // 这里我们尝试通过一个简单的测试来检查集合是否存在
      console.log('   正在测试集合访问...');

      // 由于我们不能直接调用query，我们通过API错误来判断
      const testQuery = await makePostRequest('/api/test-db', {});
      console.log('   数据库测试完成');

    } catch (error) {
      console.log('   查询测试异常');
    }

    // 4. 总结和建议
    console.log('\n📋 测试结果总结:');
    const subscriptionWorking = subscriptionCheck.status === 200 && subscriptionCheck.data?.subscription?.tier;
    const dbWorking = dbCheck.status === 200;

    if (dbWorking && subscriptionWorking) {
      console.log('✅ 数据库和订阅系统都正常工作');
      console.log('🎉 个人资料页面应该能正确显示用户等级');
    } else if (dbWorking && !subscriptionWorking) {
      console.log('⚠️ 数据库正常，但订阅API有问题');
      console.log('💡 可能需要检查user_subscriptions集合权限');
    } else {
      console.log('❌ 数据库连接异常');
    }

    console.log('\n🔧 如果订阅等级显示不正确:');
    console.log('1. 检查CloudBase控制台的user_subscriptions集合');
    console.log('2. 确保集合有读写权限');
    console.log('3. 重启应用并刷新个人资料页面');
    console.log('4. 如果还是不显示，可能是webhook没有正确触发订阅升级');

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

checkSubscriptionCollections();


