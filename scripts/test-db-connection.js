// 测试CloudBase数据库连接
console.log('🔍 测试CloudBase数据库连接...\n');

// 检查环境变量
const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;
const envId = process.env.TENCENT_CLOUD_ENV_ID;

console.log('📋 环境变量检查:');
console.log(`  TENCENT_CLOUD_SECRET_ID: ${secretId ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`  TENCENT_CLOUD_SECRET_KEY: ${secretKey ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`  TENCENT_CLOUD_ENV_ID: ${envId ? '✅ 已设置' : '❌ 未设置'}`);

if (!secretId || !secretKey || !envId) {
  console.log('\n❌ 缺少必要的环境变量，请检查 .env 文件');
  process.exit(1);
}

// 测试数据库连接
async function testConnection() {
  try {
    console.log('\n🔌 初始化CloudBase连接...');
    const { getCloudBaseApp } = require('../lib/database/cloudbase');
    const app = getCloudBaseApp();

    if (!app) {
      console.log('❌ 无法获取CloudBase应用实例');
      return;
    }

    console.log('✅ CloudBase应用实例获取成功');

    // 测试数据库操作
    console.log('\n💾 测试数据库操作...');
    const { query, add } = require('../lib/database/cloudbase');

    // 尝试查询payments集合
    console.log('📊 查询payments集合...');
    try {
      const result = await query('payments', { limit: 1 });
      console.log('✅ payments集合查询成功');
      console.log(`  集合存在，记录数: ${result.total || '未知'}`);
    } catch (queryError) {
      console.log('⚠️ payments集合查询失败:', queryError.message);
      console.log('  可能需要创建集合或设置权限');
    }

    // 测试添加记录（临时测试）
    console.log('\n📝 测试添加临时记录...');
    const testId = `test_${Date.now()}`;
    try {
      const testRecord = {
        _id: testId,
        test_field: 'connection_test',
        timestamp: new Date().toISOString(),
      };

      await add('test_connection', testRecord);
      console.log('✅ 临时记录添加成功');
    } catch (addError) {
      console.log('❌ 临时记录添加失败:', addError.message);
      console.log('  可能需要创建集合或设置权限');
    }

  } catch (error) {
    console.log('❌ 数据库连接测试失败:', error.message);
    console.log('🔍 详细错误:', error);
  }
}

testConnection();


