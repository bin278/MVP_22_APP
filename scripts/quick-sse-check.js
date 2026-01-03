// 快速SSE系统状态检查脚本
// 在浏览器控制台中运行以下代码

console.log('🔍 SSE异步代码生成系统快速检查');
console.log('================================\n');

// 检查1: CloudBase环境变量
console.log('1️⃣ 检查环境变量...');
fetch('/api/env')
  .then(res => res.json())
  .then(data => {
    console.log('✅ /api/env 响应:', data);
    if (data.success) {
      console.log('   • 环境变量正常');
    } else {
      console.log('   ❌ 环境变量异常:', data.error);
    }
  })
  .catch(err => {
    console.log('❌ 环境变量检查失败:', err.message);
  });

// 检查2: 用户认证状态
console.log('\n2️⃣ 检查用户认证...');
const authState = JSON.parse(localStorage.getItem('app-auth-state') || 'null');
if (authState?.accessToken) {
  console.log('✅ 用户已登录');
  console.log('   • AccessToken:', authState.accessToken.substring(0, 20) + '...');
} else {
  console.log('❌ 用户未登录');
}

// 检查3: 测试简单流式生成
console.log('\n3️⃣ 测试简单流式生成...');
setTimeout(() => {
  const testPrompt = '创建一个简单的按钮组件';
  console.log(`发送测试请求: "${testPrompt}"`);

  fetch('/api/generate-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authState?.accessToken || ''}`,
    },
    body: JSON.stringify({
      prompt: testPrompt,
      model: 'deepseek-chat',
      conversationId: 'test_' + Date.now()
    })
  }).then(response => {
    console.log('流式请求状态:', response.status);
    if (response.status === 200) {
      console.log('✅ 流式API可达');
    } else if (response.status === 401) {
      console.log('❌ 认证失败 - 检查JWT_SECRET');
    } else if (response.status === 400) {
      console.log('❌ 请求参数错误');
    } else {
      console.log('❌ 未知错误:', response.status);
    }
  }).catch(err => {
    console.log('❌ 网络错误:', err.message);
  });
}, 1000);

// 检查4: 测试异步生成
console.log('\n4️⃣ 测试异步生成...');
setTimeout(() => {
  const complexPrompt = '创建一个完整的电商平台，包含商品列表、购物车、支付功能';
  console.log(`发送复杂请求: "${complexPrompt}"`);

  fetch('/api/generate-async', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authState?.accessToken || ''}`,
    },
    body: JSON.stringify({
      prompt: complexPrompt,
      model: 'deepseek-chat',
      conversationId: 'test_' + Date.now()
    })
  }).then(response => {
    console.log('异步请求状态:', response.status);
    if (response.status === 200) {
      console.log('✅ 异步API可达');
      return response.json();
    } else if (response.status === 401) {
      console.log('❌ 认证失败 - 检查JWT_SECRET');
    } else {
      console.log('❌ 异步API错误:', response.status);
    }
  }).then(data => {
    if (data?.taskId) {
      console.log('✅ 异步任务创建成功:', data.taskId);

      // 测试SSE连接
      console.log('\n5️⃣ 测试SSE连接...');
      const eventSource = new EventSource(`/api/generate-async/${data.taskId}/stream`);
      eventSource.onopen = () => console.log('✅ SSE连接成功');
      eventSource.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        console.log('📨 SSE消息:', msg);
        if (msg.type === 'connected') {
          console.log('✅ SSE握手成功');
          eventSource.close();
        }
      };
      eventSource.onerror = (err) => {
        console.log('❌ SSE连接失败');
        eventSource.close();
      };
    }
  }).catch(err => {
    console.log('❌ 异步请求失败:', err.message);
  });
}, 2000);

console.log('\n⏳ 检查进行中，请等待几秒钟结果...');
console.log('如果看到大量✅标记，说明SSE系统工作正常！');






