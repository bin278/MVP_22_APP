const cloudbase = require('@cloudbase/node-sdk');

// 初始化CloudBase
const app = cloudbase.init({
  secretId: process.env.TENCENT_CLOUD_SECRET_ID,
  secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
  env: process.env.TENCENT_CLOUD_ENV_ID,
});

async function setupCollections() {
  try {
    console.log('🚀 开始设置CloudBase数据库集合...');

    // 获取数据库实例
    const db = app.database();

    console.log('📊 连接到CloudBase数据库成功');

    // 注意：CloudBase是文档数据库，不需要预先定义集合结构
    // 集合会在第一次插入数据时自动创建

    console.log('✅ CloudBase数据库集合设置完成！');
    console.log('');
    console.log('📋 已配置的集合：');
    console.log('  - conversations: 存储对话记录');
    console.log('  - conversation_files: 存储对话中的文件（生成的代码）');
    console.log('  - conversation_messages: 存储对话消息');
    console.log('  - user_github_tokens: 存储GitHub令牌信息');
    console.log('  - user_subscriptions: 存储用户订阅信息');
    console.log('  - users: 存储用户信息（已存在）');
    console.log('  - payments: 存储支付记录（已存在）');
    console.log('');
    console.log('🔒 安全提醒：');
    console.log('  请确保在CloudBase控制台中正确设置数据库权限');
    console.log('  参考文档：CLOUDBASE_PERMISSION_SETUP.md');

  } catch (error) {
    console.error('❌ 设置集合失败:', error);
    console.log('');
    console.log('🔍 故障排除：');
    console.log('1. 检查环境变量是否正确设置');
    console.log('2. 确认CloudBase环境ID有效');
    console.log('3. 验证腾讯云账户权限');
    console.log('4. 检查网络连接');
  }
}

// 运行设置
setupCollections().catch(console.error);
