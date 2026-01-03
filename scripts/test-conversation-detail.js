// 使用Node.js内置的fetch

// 测试单个对话详情API
async function testConversationDetail() {
  console.log('🧪 测试单个对话详情API...');

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

      // 获取对话列表
      console.log('\n2. 获取对话列表...');
      const listResponse = await fetch('http://localhost:3000/api/conversations/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const listData = await listResponse.json();
      console.log('对话列表响应:', listData.success ? '成功' : '失败');

      if (listData.success && listData.conversations.length > 0) {
        const conversationId = listData.conversations[0].id;
        console.log(`使用对话ID: ${conversationId}`);

        // 测试获取对话详情
        console.log('\n3. 获取对话详情...');
        const detailResponse = await fetch(`http://localhost:3000/api/conversations/${conversationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('响应状态:', detailResponse.status);
        console.log('响应类型:', detailResponse.headers.get('content-type'));

        const responseText = await detailResponse.text();
        console.log('响应内容长度:', responseText.length);
        console.log('响应内容前200字符:', responseText.substring(0, 200));

        if (detailResponse.headers.get('content-type')?.includes('application/json')) {
          try {
            const detailData = JSON.parse(responseText);
            console.log('对话详情响应:', detailData.success ? '成功' : '失败');
            if (detailData.success) {
              console.log('- 对话:', detailData.conversation.title);
              console.log('- 消息数量:', detailData.messages.length);
              console.log('- 文件数量:', detailData.files.length);
            }
          } catch (parseError) {
            console.log('JSON解析失败:', parseError.message);
          }
        } else {
          console.log('❌ 响应不是JSON格式');
        }
      } else {
        console.log('❌ 没有找到对话');
      }
    } else {
      console.log('❌ 登录失败');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testConversationDetail().catch(console.error);
