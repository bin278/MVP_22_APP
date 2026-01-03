/**
 * JWT密钥管理工具
 * 用于安全地更换JWT_SECRET
 */

const crypto = require('crypto');

function generateSecureJwtSecret() {
  // 生成256位（32字节）的随机密钥
  return crypto.randomBytes(32).toString('hex');
}

function validateJwtSecret(secret) {
  if (!secret || typeof secret !== 'string') {
    return { valid: false, reason: '密钥不能为空且必须是字符串' };
  }

  if (secret.length < 32) {
    return { valid: false, reason: '密钥长度至少32个字符（推荐64个字符）' };
  }

  // 检查是否包含足够的随机性
  const uniqueChars = new Set(secret.split('')).size;
  if (uniqueChars < secret.length * 0.7) {
    return { valid: false, reason: '密钥随机性不足，建议使用随机生成的密钥' };
  }

  return { valid: true };
}

function rotateJwtSecret() {
  console.log('🔄 JWT密钥轮换指南');
  console.log('====================\n');

  console.log('⚠️  重要警告：');
  console.log('   更换JWT_SECRET会导致所有现有token失效！');
  console.log('   用户需要重新登录，所有会话将被中断！\n');

  console.log('📋 安全更换步骤：');
  console.log('   1. 生成新的JWT_SECRET');
  console.log('   2. 在CloudBase控制台更新环境变量');
  console.log('   3. 重新部署应用');
  console.log('   4. 通知用户重新登录\n');

  const newSecret = generateSecureJwtSecret();
  const validation = validateJwtSecret(newSecret);

  console.log('🆕 新生成的JWT_SECRET:');
  console.log('   JWT_SECRET=' + newSecret);
  console.log();

  if (validation.valid) {
    console.log('✅ 新密钥验证通过');
  } else {
    console.log('❌ 新密钥验证失败:', validation.reason);
  }

  console.log('\n🔧 应用到CloudBase:');
  console.log('   1. 登录腾讯云CloudBase控制台');
  console.log('   2. 进入环境变量设置');
  console.log('   3. 更新JWT_SECRET变量');
  console.log('   4. 保存并重新部署');

  return newSecret;
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--rotate') || args.includes('-r')) {
    rotateJwtSecret();
  } else if (args.includes('--generate') || args.includes('-g')) {
    const secret = generateSecureJwtSecret();
    console.log('JWT_SECRET=' + secret);
  } else if (args.includes('--validate') || args.includes('-v')) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.log('❌ 未找到JWT_SECRET环境变量');
      process.exit(1);
    }

    const validation = validateJwtSecret(secret);
    if (validation.valid) {
      console.log('✅ JWT_SECRET验证通过');
    } else {
      console.log('❌ JWT_SECRET验证失败:', validation.reason);
    }
  } else {
    console.log('JWT密钥管理工具');
    console.log('================');
    console.log();
    console.log('用法:');
    console.log('  node manage-jwt-secret.js --generate  # 生成新密钥');
    console.log('  node manage-jwt-secret.js --validate  # 验证当前密钥');
    console.log('  node manage-jwt-secret.js --rotate    # 密钥轮换指南');
    console.log();
    console.log('示例:');
    console.log('  JWT_SECRET=$(node manage-jwt-secret.js --generate) echo "新密钥: $JWT_SECRET"');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateSecureJwtSecret,
  validateJwtSecret,
  rotateJwtSecret
};




