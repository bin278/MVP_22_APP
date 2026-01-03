// 简单检查私钥内容
const fs = require('fs');
const path = require('path');

console.log('🔐 检查私钥内容...\n');

// 读取.env文件
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// 提取私钥
const privateKeyMatch = envContent.match(/ALIPAY_PRIVATE_KEY="([^"]*)"/);
if (!privateKeyMatch) {
  console.log('❌ 未找到ALIPAY_PRIVATE_KEY');
  process.exit(1);
}

const privateKey = privateKeyMatch[1];
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
  console.log(`签名长度: ${signature.length}`);

} catch (error) {
  console.log('❌ 私钥解析失败:', error.message);
}

// 检查支付宝SDK格式
console.log('\n💰 支付宝SDK格式检查:');
const isPKCS8 = processedPrivateKey.includes('BEGIN PRIVATE KEY') && processedPrivateKey.includes('END PRIVATE KEY');
console.log(`PKCS#8格式: ${isPKCS8 ? '✅' : '❌'}`);

const isPKCS1 = processedPrivateKey.includes('BEGIN RSA PRIVATE KEY') && processedPrivateKey.includes('END RSA PRIVATE KEY');
console.log(`PKCS#1格式: ${isPKCS1 ? '✅' : '❌'}`);

// 支付宝SDK v3+ 通常使用PKCS#8格式
if (isPKCS8) {
  console.log('✅ 格式兼容支付宝SDK v3+');
} else if (isPKCS1) {
  console.log('⚠️ PKCS#1格式，建议转换为PKCS#8格式');
} else {
  console.log('❌ 未知格式');
}


