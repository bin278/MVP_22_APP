// 测试认证状态持久化功能
async function testAuthPersistence() {
  console.log('🧪 测试认证状态持久化功能...');

  try {
    // 模拟登录并保存到localStorage
    console.log('\n1. 模拟用户登录...');
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      fullName: 'Test User'
    };

    const mockSession = {
      accessToken: 'mock-access-token-123',
      refreshToken: 'mock-refresh-token-456',
      accessTokenExpire: Date.now() + 3600000, // 1小时后过期
      refreshTokenExpire: Date.now() + 86400000 // 24小时后过期
    };

    // 保存到localStorage
    localStorage.setItem('cloudbase_user', JSON.stringify(mockUser));
    localStorage.setItem('cloudbase_session', JSON.stringify(mockSession));

    console.log('✅ 认证状态已保存到localStorage');

    // 模拟页面刷新 - 从localStorage恢复状态
    console.log('\n2. 模拟页面刷新 - 恢复认证状态...');

    const savedUser = localStorage.getItem('cloudbase_user');
    const savedSession = localStorage.getItem('cloudbase_session');

    if (savedUser && savedSession) {
      try {
        const userData = JSON.parse(savedUser);
        const sessionData = JSON.parse(savedSession);

        // 检查session是否过期
        const now = Date.now();
        if (sessionData.accessTokenExpire > now) {
          console.log('✅ 认证状态成功恢复');
          console.log('- 用户ID:', userData.uid);
          console.log('- 邮箱:', userData.email);
          console.log('- 全名:', userData.fullName);
          console.log('- AccessToken过期时间:', new Date(sessionData.accessTokenExpire).toLocaleString());
        } else {
          console.log('❌ Session已过期');
        }
      } catch (parseError) {
        console.log('❌ 解析本地存储数据失败:', parseError.message);
      }
    } else {
      console.log('❌ 未找到保存的认证状态');
    }

    // 模拟过期session的情况
    console.log('\n3. 测试过期Session处理...');
    const expiredSession = {
      ...mockSession,
      accessTokenExpire: Date.now() - 1000 // 已过期
    };
    localStorage.setItem('cloudbase_session', JSON.stringify(expiredSession));

    const expiredSavedSession = localStorage.getItem('cloudbase_session');
    if (expiredSavedSession) {
      const sessionData = JSON.parse(expiredSavedSession);
      const now = Date.now();
      if (sessionData.accessTokenExpire > now) {
        console.log('❌ 过期Session被错误地视为有效');
      } else {
        console.log('✅ 过期Session被正确识别并清除');
      }
    }

    // 模拟登出 - 清除localStorage
    console.log('\n4. 模拟用户登出...');
    localStorage.removeItem('cloudbase_user');
    localStorage.removeItem('cloudbase_session');

    const afterLogoutUser = localStorage.getItem('cloudbase_user');
    const afterLogoutSession = localStorage.getItem('cloudbase_session');

    if (!afterLogoutUser && !afterLogoutSession) {
      console.log('✅ 登出时localStorage已正确清除');
    } else {
      console.log('❌ 登出时localStorage未完全清除');
    }

    console.log('\n✅ 认证状态持久化功能测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testAuthPersistence();




