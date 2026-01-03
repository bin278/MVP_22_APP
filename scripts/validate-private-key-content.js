// 验证私钥内容是否正确
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 读取.env文件
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// 提取私钥
const privateKeyMatch = envContent.match(/ALIPAY_PRIVATE_KEY="([^"]*)"/);
if (!privateKeyMatch) {
  console.log('❌ 未找到ALIPAY_PRIVATE_KEY');
  process.exit(1);
}

const rawPrivateKey = privateKeyMatch[1];
console.log('🔐 原始私钥内容:');
console.log(rawPrivateKey.substring(0, 100) + '...');
console.log(`长度: ${rawPrivateKey.length}`);

// 处理私钥（移除转义字符）
const processedPrivateKey = rawPrivateKey.replace(/\\n/g, '\n');
console.log('\n🔧 处理后的私钥:');
console.log(processedPrivateKey.substring(0, 100) + '...');
console.log(`长度: ${processedPrivateKey.length}`);

// 验证私钥格式
console.log('\n🔍 私钥验证:');

// 检查PEM格式
const isValidPEM = processedPrivateKey.includes('-----BEGIN PRIVATE KEY-----') &&
                   processedPrivateKey.includes('-----END PRIVATE KEY-----');
console.log(`PEM格式: ${isValidPEM ? '✅' : '❌'}`);

// 尝试解析私钥
try {
  const privateKeyObject = crypto.createPrivateKey(processedPrivateKey);
  console.log('✅ Node.js可以解析私钥');

  // 测试签名
  const sign = crypto.createSign('RSA-SHA256');
  sign.update('test data for signature');
  const signature = sign.sign(privateKeyObject, 'base64');
  console.log('✅ 可以进行RSA签名');
  console.log(`签名长度: ${signature.length}`);

  // 检查密钥信息
  const keyInfo = privateKeyObject.asymmetricKeyDetails;
  console.log('🔑 密钥信息:');
  console.log(`  类型: ${keyInfo.type}`);
  console.log(`  名称: ${keyInfo.name}`);
  console.log(`  长度: ${keyInfo.modulusLength} bits`);
  console.log(`  公钥编码: ${keyInfo.publicKeyEncoding.format}`);

} catch (error) {
  console.log('❌ 私钥解析失败:', error.message);

  // 分析错误
  if (error.message.includes('unsupported')) {
    console.log('💡 这通常表示私钥格式或内容有问题');
  }
}

// 尝试使用支付宝SDK格式验证
console.log('\n💰 支付宝SDK兼容性检查:');

// 支付宝SDK 3.x 版本通常需要PKCS#8格式
// 检查是否是PKCS#1格式（以RSA开头）
const isPKCS1 = processedPrivateKey.includes('-----BEGIN RSA PRIVATE KEY-----');
const isPKCS8 = processedPrivateKey.includes('-----BEGIN PRIVATE KEY-----');

console.log(`PKCS#1格式: ${isPKCS1 ? '✅' : '❌'}`);
console.log(`PKCS#8格式: ${isPKCS8 ? '✅' : '❌'}`);

if (isPKCS1) {
  console.log('⚠️ 这是PKCS#1格式，支付宝SDK 3.x推荐使用PKCS#8格式');
  console.log('💡 可能需要转换格式: openssl pkcs8 -topk8 -nocrypt -in key.pem -out key_pkcs8.pem');
}

console.log('\n🎯 结论:');
if (isValidPEM && isPKCS8) {
  console.log('✅ 私钥格式正确，应该是可以工作的');
  console.log('💡 如果支付宝SDK仍然报错，可能是:');
  console.log('   1. 私钥内容本身有问题');
  console.log('   2. 支付宝SDK版本与私钥不兼容');
  console.log('   3. 环境变量传递有问题');
} else {
  console.log('❌ 私钥格式不符合要求');
}


