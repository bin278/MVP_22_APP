const cloudbase = require('@cloudbase/node-sdk');

// 初始化CloudBase
const app = cloudbase.init({
  secretId: process.env.TENCENT_CLOUD_SECRET_ID,
  secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
  env: process.env.TENCENT_CLOUD_ENV_ID,
});

async function testMigration() {
  try {
    console.log('🧪 开始测试CloudBase数据迁移...');

    const db = app.database();
    console.log('📊 数据库连接成功');

    // 测试各个集合
    const collections = [
      'users',
      'payments',
      'conversations',
      'conversation_files',
      'conversation_messages'
    ];

    console.log('\n📋 测试集合查询：');
    for (const collection of collections) {
      try {
        // 尝试查询每个集合（只获取1条记录）
        const result = await db.collection(collection).limit(1).get();
        console.log(`✅ ${collection}: ${result.data ? result.data.length : 0} 条记录`);
      } catch (error) {
        console.log(`⚠️  ${collection}: 集合不存在或无权限 (${error.message})`);
      }
    }

    console.log('\n🎉 CloudBase数据迁移测试完成！');
    console.log('\n📝 测试结果说明：');
    console.log('- users: 用户信息存储');
    console.log('- payments: 支付记录存储');
    console.log('- conversations: 对话记录存储');
    console.log('- conversation_files: 生成的前端文件存储');
    console.log('- conversation_messages: 对话消息存储');
    console.log('\n💡 提示：集合会在第一次插入数据时自动创建');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.log('\n🔍 故障排除：');
    console.log('1. 检查环境变量配置');
    console.log('2. 确认CloudBase环境权限');
    console.log('3. 参考 CLOUDBASE_PERMISSION_SETUP.md');
  }
}

// 运行测试
testMigration().catch(console.error);
