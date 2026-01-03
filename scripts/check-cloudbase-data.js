const cloudbase = require('@cloudbase/node-sdk');

// 初始化CloudBase
const app = cloudbase.init({
  secretId: process.env.TENCENT_CLOUD_SECRET_ID,
  secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
  env: process.env.TENCENT_CLOUD_ENV_ID,
});

async function checkCloudBaseData() {
  console.log('🔍 检查CloudBase数据库中的数据...');

  try {
    const db = app.database();
    console.log('📊 数据库连接成功');

    // 检查各个集合中的数据
    const collections = [
      { name: 'users', description: '用户信息' },
      { name: 'conversations', description: '对话记录' },
      { name: 'conversation_files', description: '生成的文件' },
      { name: 'conversation_messages', description: '对话消息' },
      { name: 'payments', description: '支付记录' }
    ];

    console.log('\n📋 数据库内容检查：\n');

    for (const collection of collections) {
      try {
        // 查询集合中的所有记录（限制前10条）
        const result = await db.collection(collection.name).limit(10).get();

        console.log(`📁 ${collection.name} (${collection.description}):`);
        console.log(`   记录数量: ${result.data ? result.data.length : 0}`);

        if (result.data && result.data.length > 0) {
          console.log('   示例记录:');
          result.data.slice(0, 2).forEach((doc, index) => {
            console.log(`     ${index + 1}. ID: ${doc._id}`);
            // 显示一些关键字段
            if (doc.email) console.log(`        邮箱: ${doc.email}`);
            if (doc.title) console.log(`        标题: ${doc.title}`);
            if (doc.file_path) console.log(`        文件: ${doc.file_path}`);
            if (doc.role) console.log(`        角色: ${doc.role}`);
            if (doc.content) console.log(`        内容: ${doc.content.substring(0, 50)}...`);
          });
        }

        console.log('');

      } catch (error) {
        console.log(`❌ 检查集合 ${collection.name} 失败: ${error.message}`);
        console.log('');
      }
    }

    console.log('✅ 数据库检查完成！');

  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('\n🔍 故障排除：');
    console.log('1. 检查环境变量是否正确设置');
    console.log('2. 确认CloudBase环境ID有效');
    console.log('3. 验证集合权限设置');
  }
}

// 运行检查
checkCloudBaseData().catch(console.error);




