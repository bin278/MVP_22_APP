// 验证私钥格式
function validatePrivateKey() {
  console.log('🔐 验证私钥格式...\n');

  const privateKey = process.env.ALIPAY_PRIVATE_KEY;

  if (!privateKey) {
    console.log('❌ 私钥环境变量未设置');
    return;
  }

  console.log('📏 私钥长度:', privateKey.length);
  console.log('🔍 私钥开头:', privateKey.substring(0, 50));
  console.log('🔍 私钥结尾:', privateKey.substring(privateKey.length - 50));
  console.log('📝 是否包含BEGIN标记:', privateKey.includes('BEGIN'));
  console.log('📝 是否包含END标记:', privateKey.includes('END'));
  console.log('📝 是否包含换行符:', privateKey.includes('\n'));

  // 尝试解析私钥
  try {
    const crypto = require('crypto');
    const keyBuffer = privateKey.replace(/\\n/g, '\n'); // 替换转义字符
    console.log('🔄 替换转义字符后开头:', keyBuffer.substring(0, 50));

    // 尝试创建私钥对象
    const privateKeyObject = crypto.createPrivateKey(keyBuffer);
    console.log('✅ 私钥格式正确，可以创建私钥对象');

    // 测试签名
    const sign = crypto.createSign('RSA-SHA256');
    sign.update('test');
    const signature = sign.sign(privateKeyObject, 'base64');
    console.log('✅ 私钥签名测试成功');

  } catch (error) {
    console.log('❌ 私钥格式错误:', error.message);

    // 提供修复建议
    console.log('\n🔧 修复建议:');
    if (!privateKey.includes('BEGIN')) {
      console.log('• 私钥缺少 "-----BEGIN PRIVATE KEY-----" 开头标记');
    }
    if (!privateKey.includes('END')) {
      console.log('• 私钥缺少 "-----END PRIVATE KEY-----" 结尾标记');
    }
    if (!privateKey.includes('\n')) {
      console.log('• 私钥是单行格式，需要转换为多行PEM格式');
    }

    console.log('\n📋 正确的PEM格式示例:');
    console.log('-----BEGIN PRIVATE KEY-----');
    console.log('MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...');
    console.log('...更多行...');
    console.log('-----END PRIVATE KEY-----');
  }
}

// 运行验证
validatePrivateKey();


