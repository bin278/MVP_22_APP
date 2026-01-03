// 使用Node.js内置的fetch

// 测试GitHub API迁移
async function testGitHubAPI() {
  console.log('🧪 测试GitHub API迁移...');

  try {
    // 先登录获取token
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

    if (loginData.success && loginData.session) {
      const token = loginData.session.accessToken;
      console.log('获取到访问令牌');

      // 测试GitHub状态检查
      console.log('\n2. 检查GitHub连接状态...');
      const statusResponse = await fetch('http://localhost:3000/api/github/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('状态检查响应状态:', statusResponse.status);
      console.log('响应类型:', statusResponse.headers.get('content-type'));

      const statusText = await statusResponse.text();
      console.log('响应内容:', statusText);

      if (statusResponse.headers.get('content-type')?.includes('application/json')) {
        try {
          const statusData = JSON.parse(statusText);
          console.log('GitHub状态:', statusData.connected ? '已连接' : '未连接');
          if (statusData.connected) {
            console.log('- 用户名:', statusData.username);
          }
        } catch (parseError) {
          console.log('JSON解析失败:', parseError.message);
        }
      } else {
        console.log('❌ 响应不是JSON格式');
      }

      console.log('\n✅ GitHub API测试完成！');
      console.log('注意：GitHub OAuth需要实际的GitHub应用配置才能完全测试');

    } else {
      console.log('❌ 登录失败');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testGitHubAPI().catch(console.error);
