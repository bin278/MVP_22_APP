// 创建支付宝沙盒测试配置
console.log('🧪 创建支付宝沙盒测试配置...\n');

// 支付宝沙盒环境的固定配置
const sandboxConfig = `# 支付宝沙盒测试配置
# 注意：这是一个测试配置，仅用于开发测试
ALIPAY_APP_ID=9021000158655354
ALIPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCjJK1Ucz6eMkS68Mr+YcbCm2d9YrgXKIj4JtelmhFVAIMyutBmiBe5vc8Y3n3Om9ElzzMKtdXKurVDbf2YlElD6wrfW+t0inr+KJnOqfZz0x5YA5zuJ5N77yWWVVZbmelIaPh1Y07Cms7ZJ8/4q2XltKwf15blYMRQCSbaQwXiKX6glhDHC7cpb45ohktT/rmt4bWUSMrfmBQl7WfdQfm0ekKRIwkVHHrW92x25TswbfTNYubohP56kpWWIT5dKRHwzAd7Kz1rEe0wq5+hDQ9UBV9APQXCol/Cm9+4pdCqVhAgy0SjUN9R/igUSxWxxNfludISNKk0VEEf2cHKvTO9AgMBAAECggEAM43VkEhS018DRSfunfB8BOdjDsZxcjAHCJQNtXE4ZOoii5dpX91F0hZfKXa1vuKSdyZA9PN9OfFCcqqBZwQFGwddijPb9hoEv+hIonwnO3bNsfaCUugCvTlXYWhaP9wlUhKJ4V6edvTAxPLFz8kqDCrJ8c4JCzdHEhuyQWrIoy0EQPs83pFGdB1g+PBpkRWWed3YVsaQy6KCCedrd9yXAKa6dkOYf5MaUDgzcM5xkVyzo75EE0y8xBYsztfwFs/U1Uc9oK9om0p9borc/S7vcI0LgOizwhiJMe27czvLHuSA4POBJovPBy695pZOIRtL7+1oEb+cuzr8UY/AdgPggQKBgQDZvayTAFaHrHpnwd4S59SL4IMSKCA24/TY+FE5cqah5OIv3XxZwfkyvm5Aitu4qNkSxrSIIGgOtWkv1vZNCecKANTSN5EVkkW3n7WZbI/fJlhL/g1U3j8rL27yWlQgJPOGcsCZyHMMa7Pv+7rdGTGgsQSQV0jKvqTRL92Bn5HA7QKBgQC/zx2h8onopDGuvl+axjbK8bt34PXgt/ssMPqg48uKefWI1m9MH8tezKG/8nERNGmIQPPw8hTgVU5e/CYJP0iDPR+LMyx4p9V4oBAQC0DIpcVzZ4O2ynmQKl2v+IvoA6WJyRVL+EyJKk3QsM0UI0ZKn15O6ulRD+gn6hm+gLR0EQKBgQDGm23IACztP/O+pGTtlayXkce8TgFkT/VL2uQrpFo9nUp7ImmEbZviHzTthjr4anrl131gFT8U+3/gdRDgIEIvK6bzwF+D75HL9c9tDEsG3jD3z9lVKgswVum6AY5ua4X9groPC3l1QOA168T8WzibPBvPlO3+kHpBnIlM7MHD2QKBgH4bXhArtiAOU9vfrlvEFiI37FlUvlOQosLbMOy22AujQ5tD4Mjb3onlYDMi4tO88eVzTu8LOk6Dx5MLlLZftP0UIrkSXBq3vdIg6m6h92X0F21YkXCMjoAKWq5naxSP0TZVznq0NR25go/CrhKfXoeRYB/isqNpIemcMHDfjcUBAoGBANCwiOdSmbsZJoBrcRMHfUsi+SY38H8f3T2yShoLc7CPHEHlC6jfCxBOtIquGWgJUlg/H8JxO+RcI+m3KFGPUql1q4fWLe28bQ4e7TAt4yZV9Tcf5Z0018WLQ/TAlCFyXinZXliqbFixsvpgK8BnhmBh9ocELbc1ZAuOq0haTf05
-----END PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwGeshoSg5mduZMCGj1LpKXsFK8nJmF3ohLffElnBj9GhXkNcA8ta12WQxYfRvUa9HANNIFnBWfvhAnPLkn9dijwf7kSQpbI/ksbGcr7/nE7BGGWTXFCVrd4K2chTAUuhjfsAjwS3SUYnY+I9rEfWnPmURvggHF3X+rEd3J0EZuUGgtszi+N22yaSbxq0cbrnRa360ZYXrATVbk5ckuH/t/9u97mtC6BRMXvJGGZv8CYurEBAX6QBwDJ+AO6MAgoqms7OEfyzsMxWISeGKdf0ljoeIbMQn5Uep+zL7AWirrt8Qv+7LVHs7x+ipHAsMVAcsoLB3/2tjREmrOlOpjF0NQIDAQAB
-----END PUBLIC KEY-----"
ALIPAY_GATEWAY_URL=https://openapi-sandbox.dl.alipaydev.com/gateway.do
ALIPAY_SANDBOX=true`;

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

try {
  fs.writeFileSync(envPath, sandboxConfig, 'utf8');
  console.log('✅ 已创建支付宝沙盒测试配置');
  console.log('\n📋 配置内容:');
  console.log('• App ID: 9021000158655354 (沙盒测试ID)');
  console.log('• 网关: https://openapi-sandbox.dl.alipaydev.com/gateway.do');
  console.log('• 模式: 沙盒测试');
  console.log('\n🚀 下一步:');
  console.log('1. 重启开发服务器: npm run dev');
  console.log('2. 测试支付: node test-alipay-debug.js');
  console.log('3. 或访问: http://localhost:3000/test-alipay');

  console.log('\n⚠️ 注意:');
  console.log('• 这是一个测试配置，不会产生真实交易');
  console.log('• 生产环境需要替换为真实的支付宝配置');
  console.log('• 沙盒环境仅用于开发测试');

} catch (error) {
  console.log('❌ 创建配置失败:', error.message);
}


