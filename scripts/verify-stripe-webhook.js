/**
 * 验证 Stripe Webhook 配置
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function verifyWebhookConfig() {
  console.log('🔍 验证 Stripe Webhook 配置...\n');

  // 1. 检查环境变量
  console.log('📋 环境变量检查:');
  console.log('  STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ 已配置' : '❌ 未配置');
  console.log('  STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ 已配置' : '❌ 未配置');

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('  Webhook Secret 前缀:', process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10) + '...');
  }

  // 2. 列出所有 webhooks
  console.log('\n🔗 检查 Stripe Webhook 端点...\n');

  try {
    const webhooks = await stripe.webhookEndpoints.list();

    if (webhooks.data.length === 0) {
      console.log('❌ 未找到任何 Webhook 端点');
      console.log('\n💡 你需要在 Stripe Dashboard 中创建 Webhook:');
      console.log('   1. 访问: https://dashboard.stripe.com/webhooks');
      console.log('   2. 点击 "添加端点"');
      console.log('   3. 输入你的 ngrok URL: https://bacterioscopic-babara-balloonike.ngrok-free.dev/api/payment/intl/webhook/stripe');
      console.log('   4. 选择事件: checkout.session.completed');
      console.log('   5. 复制 Webhook Secret 并更新到 .env.local 的 STRIPE_WEBHOOK_SECRET');
      return;
    }

    console.log(`✅ 找到 ${webhooks.data.length} 个 Webhook 端点:\n`);

    webhooks.data.forEach((webhook, index) => {
      console.log(`Webhook #${index + 1}:`);
      console.log('  ID:', webhook.id);
      console.log('  URL:', webhook.url);
      console.log('  状态:', webhook.status);
      console.log('  事件数量:', webhook.enabled_events.length);

      // 检查是否包含 checkout.session.completed
      const hasCheckoutEvent = webhook.enabled_events.includes('checkout.session.completed');
      console.log('  包含 checkout.session.completed:', hasCheckoutEvent ? '✅' : '❌');

      // 检查 URL 是否匹配 ngrok
      const isNgrokUrl = webhook.url.includes('ngrok-free.dev');
      console.log('  使用 ngrok URL:', isNgrokUrl ? '✅' : '❌');

      console.log('');
    });

    // 3. 检查是否有正确的 webhook
    console.log('📝 配置建议:\n');

    const ngrokUrl = 'https://bacterioscopic-babara-balloonike.ngrok-free.dev';
    const targetUrl = `${ngrokUrl}/api/payment/intl/webhook/stripe`;

    const hasCorrectWebhook = webhooks.data.some(wh =>
      wh.url === targetUrl &&
      wh.enabled_events.includes('checkout.session.completed')
    );

    if (!hasCorrectWebhook) {
      console.log('❌ 未找到正确的 Webhook 配置');
      console.log('\n你需要创建或更新 Webhook 端点:');
      console.log(`  URL: ${targetUrl}`);
      console.log('  事件: checkout.session.completed');
      console.log(`  当前 ngrok URL: ${ngrokUrl}`);
      console.log('\n⚠️  注意: ngrok URL 每次重启都会变化，需要更新 Stripe Dashboard 中的配置');
    } else {
      console.log('✅ Webhook 配置正确!');
    }

  } catch (error) {
    console.error('❌ 查询 Webhook 失败:', error.message);
  }
}

verifyWebhookConfig().then(() => {
  console.log('\n✅ 验证完成');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ 错误:', error);
  process.exit(1);
});
