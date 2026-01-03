// 使用Node.js内置的fetch

// 测试个人资料迁移到CloudBase
async function testProfileMigration() {
  console.log('🧪 测试个人资料迁移到CloudBase...');

  try {
    // 1. 用户登录
    console.log('\n1. 用户登录...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('登录响应:', loginData.success ? '成功' : '失败');

    if (!loginData.success || !loginData.session) {
      console.log('❌ 登录失败，无法继续测试');
      return;
    }

    const token = loginData.session.accessToken;
    console.log('获取到访问令牌');

    // 2. 测试个人资料API
    console.log('\n2. 获取个人资料...');
    const profileResponse = await fetch('http://localhost:3000/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('个人资料响应状态:', profileResponse.status);

    if (profileResponse.status === 200) {
      const profileData = await profileResponse.json();
      console.log('✅ 个人资料API成功');
      console.log('- 用户ID:', profileData.user.id);
      console.log('- 邮箱:', profileData.user.email);
      console.log('- 创建时间:', profileData.user.created_at);
      console.log('- 全名:', profileData.user.full_name || '未设置');
    } else {
      console.log('❌ 个人资料API失败');
      const errorData = await profileResponse.json();
      console.log('错误详情:', errorData);
    }

    // 3. 测试订阅API
    console.log('\n3. 获取订阅信息...');
    const subscriptionResponse = await fetch('http://localhost:3000/api/user/subscription', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('订阅信息响应状态:', subscriptionResponse.status);

    if (subscriptionResponse.status === 200) {
      const subscriptionData = await subscriptionResponse.json();
      console.log('✅ 订阅API成功');
      console.log('- 订阅等级:', subscriptionData.subscription.tier);
      console.log('- 订阅状态:', subscriptionData.subscription.status);
      console.log('- 本月请求数:', subscriptionData.usageStats.requestsThisMonth);
    } else {
      console.log('❌ 订阅API失败');
      const errorData = await subscriptionResponse.json();
      console.log('错误详情:', errorData);
    }

    console.log('\n✅ 个人资料迁移测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testProfileMigration().catch(console.error);
