/**
 * 测试CloudBase认证和数据库连接
 */

const jwt = require('jsonwebtoken');
const cloudbase = require('@cloudbase/node-sdk');

async function testCloudbaseAuth() {
  console.log('🧪 CloudBase认证和数据库测试');
  console.log('==================================\n');

  // 检查环境变量
  const envId = process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || process.env.TENCENT_CLOUD_ENV_ID;
  const secretId = process.env.CLOUDBASE_SECRET_ID || process.env.TENCENT_CLOUD_SECRET_ID;
  const secretKey = process.env.CLOUDBASE_SECRET_KEY || process.env.TENCENT_CLOUD_SECRET_KEY;
  const jwtSecret = process.env.JWT_SECRET;

  console.log('📋 环境变量检查:');
  console.log('  NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID:', envId ? '✅' : '❌');
  console.log('  CLOUDBASE_SECRET_ID:', secretId ? '✅' : '❌');
  console.log('  CLOUDBASE_SECRET_KEY:', secretKey ? '✅' : '❌');
  console.log('  JWT_SECRET:', jwtSecret ? '✅' : '❌');
  console.log();

  if (!envId || !secretId || !secretKey || !jwtSecret) {
    console.log('❌ 环境变量不完整，无法继续测试');
    return;
  }

  try {
    // 初始化CloudBase
    console.log('🔧 初始化CloudBase...');
    const app = cloudbase.init({
      env: envId,
      secretId,
      secretKey,
    });

    const db = app.database();
    console.log('✅ CloudBase初始化成功');
    console.log();

    // 测试JWT生成
    console.log('🔐 测试JWT生成...');
    const testPayload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      type: 'access'
    };

    const token = jwt.sign(testPayload, jwtSecret, { expiresIn: '1h' });
    console.log('✅ JWT生成成功');
    console.log('📝 Token:', token.substring(0, 50) + '...');
    console.log();

    // 测试JWT验证
    console.log('🔍 测试JWT验证...');
    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ JWT验证成功');
    console.log('📄 解码结果:', {
      userId: decoded.userId,
      email: decoded.email,
      type: decoded.type
    });
    console.log();

    // 测试数据库连接
    console.log('🗄️ 测试数据库连接...');
    const collections = await db.listCollections();
    console.log('✅ 数据库连接成功');
    console.log('📚 可用集合:', collections.map(c => c.name));
    console.log();

    // 测试用户集合查询
    console.log('👤 测试用户集合查询...');
    const usersCollection = db.collection('users');
    const testQuery = await usersCollection.where({}).limit(1).get();
    console.log('✅ 用户集合查询成功');
    console.log('📊 查询结果数量:', testQuery.data ? testQuery.data.length : 0);
    console.log();

    console.log('🎉 所有测试通过！认证系统应该正常工作。');

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('🔍 错误详情:', error);
  }
}

// 主函数
if (require.main === module) {
  testCloudbaseAuth().catch(console.error);
}

module.exports = { testCloudbaseAuth };