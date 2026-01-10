/**
 * 测试 PayPal 配置
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testPayPalConfig() {
  console.log('🔍 测试 PayPal 配置...\n');

  // 1. 检查环境变量
  console.log('📋 环境变量检查:');
  console.log('  PAYPAL_CLIENT_ID:', process.env.PAYPAL_CLIENT_ID ? '✅ 已配置' : '❌ 未配置');
  console.log('  PAYPAL_CLIENT_SECRET:', process.env.PAYPAL_CLIENT_SECRET ? '✅ 已配置' : '❌ 未配置');
  console.log('  PAYPAL_ENVIRONMENT:', process.env.PAYPAL_ENVIRONMENT || '❌ 未配置');
  console.log('  PAYPAL_WEBHOOK_ID:', process.env.PAYPAL_WEBHOOK_ID || '❌ 未配置（可选）');
  console.log('');

  // 2. 测试 PayPal API 连接
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    console.error('❌ PayPal 凭证未配置，无法测试');
    return;
  }

  try {
    // 获取 Access Token
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    console.log(`🌐 测试 PayPal API 连接: ${baseUrl}\n`);

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      console.error('❌ PayPal API 连接失败:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('错误详情:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ PayPal API 连接成功!');
    console.log('  Access Token:', data.access_type ? data.access_type : 'N/A');
    console.log('  Expires In:', data.expires_in ? `${data.expires_in}秒` : 'N/A');
    console.log('  App ID:', data.app_id || 'N/A');
    console.log('');

    // 3. 测试创建订单
    console.log('🧪 测试创建订单...\n');

    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: 'test_user_123',
            description: 'Test Credit Package',
            amount: {
              currency_code: 'USD',
              value: '4.00',
            },
          },
        ],
        application_context: {
          brand_name: 'Test App',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: 'http://localhost:3000/api/payment/intl/paypal/return',
          cancel_url: 'http://localhost:3000/pricing?canceled=true',
        },
      }),
    });

    if (!orderResponse.ok) {
      console.error('❌ 创建订单失败:', orderResponse.status, orderResponse.statusText);
      const errorText = await orderResponse.text();
      console.error('错误详情:', errorText);
      return;
    }

    const order = await orderResponse.json();
    console.log('✅ 订单创建成功!');
    console.log('  Order ID:', order.id);
    console.log('  Status:', order.status);
    console.log('  Approval URL:', order.links?.find(l => l.rel === 'approve')?.href || 'N/A');
    console.log('');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testPayPalConfig().then(() => {
  console.log('\n✅ 测试完成');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 错误:', error);
  process.exit(1);
});
