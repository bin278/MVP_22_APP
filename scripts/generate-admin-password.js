// 生成管理员密码哈希
// 运行: node scripts/generate-admin-password.js

const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('生成密码哈希失败:', err);
    process.exit(1);
  }

  console.log('密码:', password);
  console.log('哈希值:', hash);
  console.log('\n将此哈希值复制到 SQL 脚本中的 INSERT 语句');
});
