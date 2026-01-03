require('dotenv').config({ path: '.env.local' });
const cloudbase = require('@cloudbase/node-sdk');

// 初始化CloudBase
const app = cloudbase.init({
  secretId: process.env.TENCENT_CLOUD_SECRET_ID,
  secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
  env: process.env.TENCENT_CLOUD_ENV_ID,
});

/**
 * 创建 user_credit_packages 集合
 * CloudBase是文档数据库,集合会在第一次插入数据时自动创建
 * 这个脚本演示如何创建示例文档
 */
async function createCreditPackagesCollection() {
  try {
    console.log('🚀 开始设置 user_credit_packages 集合...');

    // 获取数据库实例
    const db = app.database();

    console.log('📊 连接到CloudBase数据库成功');

    // CloudBase 不允许通过 SDK 创建集合，需要在控制台手动创建
    console.log('❌ CloudBase 不支持通过 SDK 创建集合');
    console.log('');
    console.log('📋 请在腾讯云控制台手动创建集合:');
    console.log('   1. 登录 https://console.cloud.tencent.com/');
    console.log('   2. 进入 CloudBase 控制台');
    console.log('   3. 选择环境: ' + process.env.TENCENT_CLOUD_ENV_ID);
    console.log('   4. 点击左侧菜单 "数据库"');
    console.log('   5. 点击 "添加集合"');
    console.log('   6. 集合名称: user_credit_packages');
    console.log('   7. 权限设置: 所有用户可读，仅创建者可写');
    console.log('');
    console.log('📋 集合结构说明:');
    console.log('  - user_id: 用户ID');
    console.log('  - package_type: 加油包类型 (basic/standard/premium)');
    console.log('  - status: 状态 (active/expired/used)');
    console.log('  - credits_total: 总次数');
    console.log('  - credits_remaining: 剩余次数');
    console.log('  - credits_used: 已使用次数');
    console.log('  - expiry_date: 过期时间');
    console.log('  - created_at: 创建时间');
    console.log('  - updated_at: 更新时间');
    console.log('');
    console.log('💡 提示: 集合创建后，错误消息会自动消失');
    console.log('   如果不使用加油包功能，可以忽略这个错误');

  } catch (error) {
    // 如果是集合不存在的错误，这是预期的
    if (error.code === 'DATABASE_COLLECTION_NOT_EXIST') {
      console.log('');
      console.log('✅ 脚本执行完成 - 集合尚未创建');
      console.log('');
      console.log('📋 请按照以下步骤在腾讯云控制台手动创建集合:');
      console.log('   1. 登录 https://console.cloud.tencent.com/');
      console.log('   2. 进入 CloudBase 控制台');
      console.log('   3. 选择环境: ' + process.env.TENCENT_CLOUD_ENV_ID);
      console.log('   4. 点击左侧菜单 "数据库"');
      console.log('   5. 点击 "添加集合"');
      console.log('   6. 集合名称: user_credit_packages');
      console.log('   7. 权限设置: 所有用户可读，仅创建者可写');
      console.log('');
      console.log('💡 提示: 集合创建后，错误消息会自动消失');
      console.log('   如果不使用加油包功能，可以忽略这个错误');
      return;
    }

    console.error('❌ 发生错误:', error.message);
    console.log('');
    console.log('🔍 故障排除:');
    console.log('1. 检查环境变量是否正确设置');
    console.log('   - TENCENT_CLOUD_SECRET_ID');
    console.log('   - TENCENT_CLOUD_SECRET_KEY');
    console.log('   - TENCENT_CLOUD_ENV_ID');
    console.log('2. 确认CloudBase环境ID有效');
    console.log('3. 验证腾讯云账户权限');
    console.log('4. 检查网络连接');
  }
}

// 运行设置
createCreditPackagesCollection()
  .then(() => {
    console.log('');
    console.log('✨ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
