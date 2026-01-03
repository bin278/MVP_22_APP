/**
 * 检查JWT_SECRET配置状态
 * 用于调试CloudBase生产环境的JWT认证问题
 */

const jwt = require('jsonwebtoken');

function checkJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  console.log('🔍 JWT_SECRET检查报告');
  console.log('========================');

  // 检查JWT_SECRET是否存在
  if (!jwtSecret) {
    console.log('❌ JWT_SECRET未配置');
    console.log('💡 请在CloudBase控制台环境变量中设置JWT_SECRET');
    return false;
  }

  console.log('✅ JWT_SECRET已配置，长度:', jwtSecret.length);

  // 检查JWT_SECRET强度
  if (jwtSecret.length < 32) {
    console.log('⚠️  JWT_SECRET长度不足，建议至少32个字符');
  } else {
    console.log('✅ JWT_SECRET长度足够');
  }

  // 测试JWT签名和验证
  try {
    const testPayload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      type: 'access'
    };

    const token = jwt.sign(testPayload, jwtSecret, { expiresIn: '1h' });
    console.log('✅ JWT签名测试通过');

    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ JWT验证测试通过');
    console.log('📄 解码结果:', {
      userId: decoded.userId,
      email: decoded.email,
      type: decoded.type
    });

  } catch (error) {
    console.log('❌ JWT测试失败:', error.message);
    return false;
  }

  console.log('========================');
  console.log('🎉 JWT_SECRET配置正常');
  return true;
}

// 检查其他相关环境变量
function checkEnvironment() {
  console.log('\n🔍 环境变量检查');
  console.log('==================');

  const nodeEnv = process.env.NODE_ENV;
  console.log('NODE_ENV:', nodeEnv || '未设置');

  const authProvider = process.env.AUTH_PROVIDER || 'cloudbase';
  console.log('AUTH_PROVIDER:', authProvider);

  const dbProvider = process.env.DATABASE_PROVIDER || 'cloudbase';
  console.log('DATABASE_PROVIDER:', dbProvider);
}

// 主函数
function main() {
  console.log('🚀 CloudBase JWT认证诊断工具');
  console.log('================================\n');

  checkEnvironment();
  const jwtOk = checkJwtSecret();

  if (!jwtOk) {
    console.log('\n❌ 诊断结果: JWT认证配置有问题');
    console.log('💡 解决方案:');
    console.log('   1. 访问腾讯云CloudBase控制台');
    console.log('   2. 进入环境变量设置');
    console.log('   3. 添加变量: JWT_SECRET=你的密钥');
    console.log('   4. 添加变量: NODE_ENV=production');
    console.log('   5. 重新部署应用');
  } else {
    console.log('\n✅ 诊断结果: JWT认证配置正常');
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkJwtSecret, checkEnvironment };




