/**
 * 测试JWT_SECRET是否正确
 * 用于验证用户提供的token是否能被指定的密钥验证
 */

const jwt = require('jsonwebtoken');

function testJwtSecret(secret, token) {
  try {
    console.log(`测试JWT_SECRET: ${secret.substring(0, 20)}...`);
    const decoded = jwt.verify(token, secret);
    console.log('✅ 验证成功!');
    console.log('解码内容:', JSON.stringify(decoded, null, 2));
    return true;
  } catch (error) {
    console.log('❌ 验证失败:', error.message);
    return false;
  }
}

// 从命令行参数获取JWT_SECRET和token
const args = process.argv.slice(2);
const secret = args[0];
const token = args[1] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcGVuaWQiOiI3NDMzNzI4NDY5NDlmZTY0MDhlMGNiOGUxYmZkNzUwMSIsImVtYWlsIjoiMTMzMjQ3NzcwNjNAMTYzLmNvbSIsImV4cCI6MTc2NjY2MDUyNiwiaWF0IjoxNzY2NjU2OTI2fQ.9AmSfdf5S6h_g-gmnjH7oZBTNHd3D9K9c-UDbaIH0dg';

if (!secret) {
  console.log('用法: node test-jwt-secret.js <JWT_SECRET> [token]');
  console.log('\n示例:');
  console.log('node test-jwt-secret.js "your-secret-key" "eyJ..."');
  console.log('\n测试默认token:');
  testJwtSecret('f532c6068d3c82f1a54308e984bc3778e217a8204906f8b75bc00a9593ce110f', token);
  process.exit(1);
}

testJwtSecret(secret, token);




