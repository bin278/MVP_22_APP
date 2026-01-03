// 直接测试环境变量读取
console.log('🔍 直接测试环境变量读取...\n');

const vars = ['ALIPAY_APP_ID', 'ALIPAY_PRIVATE_KEY', 'ALIPAY_PUBLIC_KEY', 'ALIPAY_GATEWAY_URL'];

vars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const length = value ? value.length : 0;

  console.log(`${varName}:`);
  console.log(`  存在: ${exists ? '✅' : '❌'}`);
  console.log(`  长度: ${length}`);

  if (exists && varName.includes('KEY')) {
    const hasBegin = value.includes('BEGIN');
    const hasEnd = value.includes('END');
    console.log(`  PEM格式: ${hasBegin && hasEnd ? '✅' : '❌'}`);
    console.log(`  行数: ${value.split('\n').length}`);
  }

  if (exists && length > 0) {
    console.log(`  内容预览: ${value.substring(0, 50)}...`);
  }
  console.log('');
});

console.log('🎯 诊断结果:');
if (process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY && process.env.ALIPAY_PUBLIC_KEY) {
  console.log('✅ 所有环境变量都已正确加载！');
  console.log('✅ 支付宝配置应该可以正常工作了！');

  // 测试SDK初始化
  console.log('\n🔧 测试支付宝SDK初始化...');
  try {
    const AlipaySdk = require('alipay-sdk').default;

    const sdk = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID,
      privateKey: process.env.ALIPAY_PRIVATE_KEY,
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
      gateway: process.env.ALIPAY_GATEWAY_URL || 'https://openapi.alipay.com/gateway.do',
      signType: 'RSA2',
    });

    console.log('✅ 支付宝SDK初始化成功！');
    console.log('🎉 支付宝支付功能现在应该完全可用了！');

  } catch (error) {
    console.log('❌ SDK初始化失败:', error.message);
  }

} else {
  console.log('❌ 环境变量仍未正确加载');
  console.log('💡 请确保:');
  console.log('1. .env.local文件存在且配置正确');
  console.log('2. 开发服务器已重启 (npm run dev)');
  console.log('3. 没有语法错误导致环境变量无法加载');
}


