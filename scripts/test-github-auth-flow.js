// 使用Node.js内置的fetch

// 测试完整的GitHub认证流程
async function testGitHubAuthFlow() {
  console.log('🧪 测试GitHub认证流程...');

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

    // 2. 测试GitHub认证发起
    console.log('\n2. 发起GitHub认证...');
    const authResponse = await fetch('http://localhost:3000/api/github/auth', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('GitHub认证响应状态:', authResponse.status);

    if (authResponse.status === 500) {
      console.log('❌ GitHub认证配置问题');
      const errorData = await authResponse.json();
      console.log('错误详情:', errorData);
      return;
    }

    if (!authResponse.ok) {
      console.log('❌ GitHub认证失败');
      const errorData = await authResponse.json();
      console.log('错误详情:', errorData);
      return;
    }

    const authData = await authResponse.json();
    console.log('GitHub认证响应:', authData.authUrl ? '成功生成OAuth URL' : '失败');

    if (authData.authUrl) {
      console.log('OAuth URL长度:', authData.authUrl.length);
      console.log('OAuth URL预览:', authData.authUrl.substring(0, 100) + '...');
    }

    // 3. 测试GitHub状态检查
    console.log('\n3. 检查GitHub连接状态...');
    const statusResponse = await fetch('http://localhost:3000/api/github/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('状态检查响应状态:', statusResponse.status);
    const statusText = await statusResponse.text();
    console.log('状态响应内容:', statusText);

    if (statusResponse.headers.get('content-type')?.includes('application/json')) {
      try {
        const statusData = JSON.parse(statusText);
        console.log('GitHub连接状态:', statusData.connected ? '已连接' : '未连接');
        if (statusData.connected) {
          console.log('- 用户名:', statusData.username);
        }
      } catch (parseError) {
        console.log('❌ JSON解析失败:', parseError.message);
      }
    } else {
      console.log('❌ 响应不是JSON格式');
    }

    console.log('\n✅ GitHub认证流程测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testGitHubAuthFlow().catch(console.error);
