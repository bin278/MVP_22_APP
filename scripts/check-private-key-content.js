// 检查私钥实际内容
console.log('🔐 检查私钥实际内容...\n');

// 模拟环境变量加载（就像Next.js一样）
require('dotenv').config({ path: '.env' });

const privateKey = process.env.ALIPAY_PRIVATE_KEY;
const publicKey = process.env.ALIPAY_PUBLIC_KEY;

console.log('📄 原始私钥内容:');
console.log(privateKey);
console.log('\n' + '='.repeat(50));

console.log('\n🔄 替换转义字符后:');
const processedPrivateKey = privateKey.replace(/\\n/g, '\n');
console.log(processedPrivateKey);
console.log('\n' + '='.repeat(50));

console.log('\n🔍 分析:');
console.log(`原始长度: ${privateKey.length}`);
console.log(`处理后长度: ${processedPrivateKey.length}`);
console.log(`包含\\n: ${privateKey.includes('\\n')}`);
console.log(`处理后包含换行: ${processedPrivateKey.includes('\n')}`);
console.log(`处理后行数: ${processedPrivateKey.split('\n').length}`);

// 测试私钥解析
console.log('\n🔐 测试私钥解析:');
try {
  const crypto = require('crypto');
  const privateKeyObject = crypto.createPrivateKey(processedPrivateKey);

  // 测试签名
  const sign = crypto.createSign('RSA-SHA256');
  sign.update('test');
  const signature = sign.sign(privateKeyObject, 'base64');

  console.log('✅ 私钥解析成功');
  console.log(`签名: ${signature.substring(0, 50)}...`);

} catch (error) {
  console.log('❌ 私钥解析失败:', error.message);
}

// 测试支付宝SDK格式
console.log('\n💰 测试支付宝SDK期望的格式:');
console.log('支付宝SDK通常期望PKCS#8格式的私钥，包含BEGIN和END标记');

// 检查是否是PKCS#8格式
const isPKCS8 = processedPrivateKey.includes('BEGIN PRIVATE KEY') && processedPrivateKey.includes('END PRIVATE KEY');
console.log(`是否为PKCS#8格式: ${isPKCS8 ? '✅' : '❌'}`);

// 检查是否是PKCS#1格式（旧格式）
const isPKCS1 = processedPrivateKey.includes('BEGIN RSA PRIVATE KEY') && processedPrivateKey.includes('END RSA PRIVATE KEY');
console.log(`是否为PKCS#1格式: ${isPKCS1 ? '✅' : '❌'}`);


