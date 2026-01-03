// 测试新的RSA2密钥配置
console.log('🔑 测试新的支付宝RSA2密钥配置...\n');

const envVars = {
  'ALIPAY_APP_ID': process.env.ALIPAY_APP_ID,
  'ALIPAY_PRIVATE_KEY': process.env.ALIPAY_PRIVATE_KEY,
  'ALIPAY_PUBLIC_KEY': process.env.ALIPAY_PUBLIC_KEY,
  'ALIPAY_GATEWAY_URL': process.env.ALIPAY_GATEWAY_URL
};

let allConfigured = true;

Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: 已配置 (长度: ${value.length})`);
  } else {
    console.log(`❌ ${key}: 未配置`);
    allConfigured = false;
  }
});

if (allConfigured) {
  console.log('\n🎉 所有支付宝环境变量已配置！');

  // 测试私钥格式
  const privateKey = envVars.ALIPAY_PRIVATE_KEY;
  console.log('\n🔍 私钥格式检查:');
  console.log(`- 包含\\n转义: ${privateKey.includes('\\n')}`);
  console.log(`- 包含实际换行: ${privateKey.includes('\n')}`);
  console.log(`- 前50字符: ${privateKey.substring(0, 50)}...`);

  // 转换私钥格式
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  console.log(`- 转换后包含换行: ${formattedKey.includes('\n')}`);

  console.log('\n🚀 准备测试支付功能...');
  console.log('请重启开发服务器，然后测试支付宝支付');
} else {
  console.log('\n⚠️ 部分环境变量未配置，请检查 .env.local 文件');
}


