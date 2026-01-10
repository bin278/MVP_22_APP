/**
 * 测试 Webhook 路由是否正确
 */

async function testWebhookRoute() {
  const baseUrl = 'http://localhost:3000';
  const webhookUrl = `${baseUrl}/api/payment/intl/webhook/stripe`;

  console.log('🔍 测试 Webhook 路由...');
  console.log('URL:', webhookUrl);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify({
        id: 'evt_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test',
            client_reference_id: '16759c96-dd3a-4b14-a952-77bf5b798236',
            metadata: {
              userId: '16759c96-dd3a-4b14-a952-77bf5b798236',
              payment_type: 'credit_package',
              packageType: 'basic',
              credits: '100',
              validity: '30',
            },
          },
        },
      }),
    });

    console.log('✅ 响应状态:', response.status);
    console.log('✅ 响应文本:', await response.text());
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

testWebhookRoute();
