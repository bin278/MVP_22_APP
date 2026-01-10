/**
 * 检查 ngrok 状态
 */

async function checkNgrok() {
  const ngrokUrl = 'https://bacterioscopic-babara-balloonike.ngrok-free.dev/api/payment/intl/webhook/stripe';

  console.log('🔍 检查 ngrok 隧道状态...');
  console.log('URL:', ngrokUrl);
  console.log('');

  try {
    const response = await fetch(ngrokUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify({
        id: 'evt_test',
        type: 'checkout.session.completed',
      }),
    });

    console.log('✅ ngrok 隧道正常工作!');
    console.log('响应状态:', response.status);
    console.log('响应文本:', await response.text());

  } catch (error) {
    console.error('❌ ngrok 隧道无法访问:', error.message);
    console.error('');
    console.error('可能的原因:');
    console.error('1. ngrok 没有运行');
    console.error('2. ngrok URL 已更改（每次重启会变化）');
    console.error('3. 网络连接问题');
  }
}

checkNgrok();
