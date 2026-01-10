/**
 * 检查 Stripe Webhook 发送记录
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkWebhookEvents() {
  console.log('🔍 检查最近的 Stripe Webhook 事件...\n');

  try {
    // 列出最近的事件
    const events = await stripe.events.list({
      limit: 10,
      type: 'checkout.session.completed',
    });

    console.log(`✅ 找到 ${events.data.length} 个 checkout.session.completed 事件:\n`);

    if (events.data.length === 0) {
      console.log('❌ 没有找到任何 checkout.session.completed 事件');
      console.log('\n可能的原因:');
      console.log('1. 测试支付没有真正完成');
      console.log('2. 使用的是测试模式，但事件还没有触发');
      console.log('3. Stripe Dashboard 中没有正确配置 webhook');
      return;
    }

    events.data.forEach((event, index) => {
      const session = event.data.object;
      console.log(`事件 #${index + 1}:`);
      console.log('  事件 ID:', event.id);
      console.log('  创建时间:', new Date(event.created * 1000).toISOString());
      console.log('  Session ID:', session.id);
      console.log('  支付状态:', session.payment_status);
      console.log('  用户 ID:', session.metadata?.userId || session.client_reference_id);
      console.log('  元数据:', JSON.stringify(session.metadata, null, 2));
      console.log('');
    });

    // 检查 webhook 端点
    console.log('📡 检查 Webhook 端点配置...\n');

    const webhooks = await stripe.webhookEndpoints.list();

    webhooks.data.forEach((webhook, index) => {
      console.log(`Webhook #${index + 1}:`);
      console.log('  URL:', webhook.url);
      console.log('  状态:', webhook.status);

      // 检查最近的发送记录
      console.log(`  最近发送的请求:`);
      if (webhook.latest_event) {
        console.log('    事件 ID:', webhook.latest_event.id);
        console.log('    状态:', webhook.latest_event.status);
        console.log('    创建时间:', new Date(webhook.latest_event.created * 1000).toISOString());
        console.log('    错误:', webhook.latest_event.error_message || '无');
      } else {
        console.log('    没有最近的发送记录');
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  }
}

checkWebhookEvents().then(() => {
  console.log('\n✅ 检查完成');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 错误:', error);
  process.exit(1);
});
