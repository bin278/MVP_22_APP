/**
 * PayPal Webhook 配置指南
 */

console.log('📋 PayPal Webhook 配置指南\n');

console.log('🔍 当前配置检查:\n');
console.log('ngrok URL: https://bacterioscopic-babara-balloonike.ngrok-free.dev');
console.log('Webhook 端点: https://bacterioscopic-babara-balloonike.ngrok-free.dev/api/payment/intl/webhook/paypal');

console.log('\n📝 配置步骤:\n');

console.log('1️⃣  访问 PayPal Developer Dashboard:');
console.log('   https://developer.paypal.com/dashboard/\n');

console.log('2️⃣  选择正确的应用环境:');
console.log('   - 当前配置: SANDBOX (测试环境)');
console.log('   - 切换到 "Sandbox" 模式\n');

console.log('3️⃣  创建 Webhook:');
console.log('   a. 点击左侧菜单的 "Webhooks"');
console.log('   b. 点击 "Create Webhook"');
console.log('   c. 输入 Webhook URL:');
console.log('      https://bacterioscopic-babara-balloonike.ngrok-free.dev/api/payment/intl/webhook/paypal');
console.log('   d. 点击 "Confirm"\n');

console.log('4️⃣  选择 Webhook 事件类型:');
console.log('   必需选择以下事件:');
console.log('   ✅ PAYMENT.CAPTURE.COMPLETED (支付捕获完成)');
console.log('   ✅ CHECKOUT.ORDER.APPROVED (订单已批准)');
console.log('   \n');
console.log('   可选事件:');
console.log('   - PAYMENT.CAPTURE.DENIED (支付捕获被拒绝)');
console.log('   - PAYMENT.CAPTURE.REFUNDED (支付已退款)\n');

console.log('5️⃣  保存 Webhook ID:');
console.log('   - 创建后，PayPal 会显示 Webhook ID');
console.log('   - 格式类似: 0XXXX123ABCD');
console.log('   - 将其保存到 .env.local 的 PAYPAL_WEBHOOK_ID\n');

console.log('⚠️  重要提示:\n');
console.log('   - ngrok 免费版每次重启 URL 都会变化');
console.log('   - URL 变化后需要重新创建或更新 webhook');
console.log('   - 开发环境已经配置为跳过签名验证');
console.log('   - 生产环境需要配置 webhook ID 进行签名验证\n');

console.log('🎯 完成后测试:');
console.log('   1. 创建一个测试支付');
console.log('   2. 在 PayPal Sandbox 完成支付');
console.log('   3. 检查服务器日志是否出现:');
console.log('      [PayPal Webhook] Request received');
console.log('      [PayPal Webhook] Received event: PAYMENT.CAPTURE.COMPLETED');
console.log('      ✅ [PayPal Webhook] Credit package added\n');

console.log('✅ 配置完成!\n');
