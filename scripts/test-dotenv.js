// 测试dotenv直接加载
require('dotenv').config({ path: '.env.local' });

console.log('🔍 测试dotenv直接加载 .env.local...\n');

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
    const lineCount = value.split('\n').length;
    console.log(`  PEM格式: ${hasBegin && hasEnd ? '✅' : '❌'}`);
    console.log(`  行数: ${lineCount}`);
    console.log(`  首行: ${value.split('\n')[0]}`);
    console.log(`  末行: ${value.split('\n')[lineCount - 1]}`);
  }

  if (exists && length > 0 && length <= 50) {
    console.log(`  完整内容: ${value}`);
  } else if (exists) {
    console.log(`  内容预览: ${value.substring(0, 50)}...`);
  }
  console.log('');
});

console.log('🎯 诊断结果:');
if (process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY && process.env.ALIPAY_PUBLIC_KEY) {
  console.log('✅ dotenv成功加载了所有环境变量！');

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
    console.log('🎉 支付宝配置完全正确！');

    console.log('✅ 支付宝SDK初始化成功！');
    console.log('🎉 支付宝配置完全正确！');

  } catch (error) {
    console.log('❌ SDK初始化失败:', error.message);
    console.log('💡 请检查私钥和公钥格式');
  }

} else {
  console.log('❌ dotenv无法加载环境变量');
  console.log('💡 可能的问题:');
  console.log('1. .env.local文件语法错误');
  console.log('2. 文件编码问题');
  console.log('3. 路径问题');
}
