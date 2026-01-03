const cloudbase = require('@cloudbase/node-sdk');

// 初始化CloudBase - 使用环境变量
const app = cloudbase.init({
  secretId: process.env.TENCENT_CLOUD_SECRET_ID,
  secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
  env: process.env.TENCENT_CLOUD_ENV_ID,
});

async function createCollectionsManually() {
  console.log('🛠️ 手动创建CloudBase数据库集合...');
  console.log('');

  const collections = [
    'users',
    'payments',
    'conversations',
    'conversation_files',
    'conversation_messages',
    'code_generation_tasks'
  ];

  console.log('需要创建的集合：');
  collections.forEach(collection => console.log(`  - ${collection}`));
  console.log('');

  console.log('📋 在CloudBase控制台手动创建步骤：');
  console.log('1. 访问 https://console.cloud.tencent.com/tcb');
  console.log('2. 选择你的环境');
  console.log('3. 点击左侧菜单的"数据库"');
  console.log('4. 为每个集合点击"创建集合"按钮');
  console.log('5. 输入集合名称并创建');
  console.log('');

  console.log('🔐 为每个集合设置权限：');
  console.log('1. 点击集合右侧的"权限设置"');
  console.log('2. 设置读取权限为: true');
  console.log('3. 设置写入权限为: true');
  console.log('');

  console.log('✅ 创建完成后，运行以下命令测试：');
  console.log('node scripts/test-cloudbase-auth.js');
  console.log('');

  // 尝试插入测试数据来自动创建集合
  console.log('🔄 尝试自动创建集合...');

  try {
    const db = app.database();

    for (const collectionName of collections) {
      try {
        console.log(`创建集合: ${collectionName}...`);

        // 尝试插入一条测试数据来创建集合
        const testData = {
          _test: true,
          createdAt: new Date().toISOString(),
          description: `Test document for collection ${collectionName}`
        };

        const result = await db.collection(collectionName).add(testData);
        console.log(`✅ 集合 ${collectionName} 创建成功，文档ID: ${result.id}`);

        // 删除测试数据
        await db.collection(collectionName).doc(result.id).remove();
        console.log(`🗑️ 清理测试数据完成`);

      } catch (error) {
        console.log(`❌ 创建集合 ${collectionName} 失败: ${error.message}`);
      }
    }

    console.log('');
    console.log('🎉 集合创建完成！');

  } catch (error) {
    console.log(`❌ 自动创建失败: ${error.message}`);
    console.log('');
    console.log('请手动在CloudBase控制台创建集合。');
  }
}

// 运行脚本
createCollectionsManually().catch(console.error);




