const fetch = require('node-fetch');

async function testCreateCodeTask() {
  console.log('🧪 测试 create-code-task API...');

  try {
    const response = await fetch('http://localhost:3000/api/create-code-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        prompt: '创建一个简单的按钮组件'
      })
    });

    console.log(`📤 响应状态: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ 错误响应: ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log(`📋 API响应:`, JSON.stringify(result, null, 2));

    if (result.code === 0) {
      console.log('✅ API测试成功!');
      console.log(`📝 生成的代码长度: ${result.data.codeLength}`);
    } else {
      console.log('❌ API业务失败:', result.msg);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testCreateCodeTask();




