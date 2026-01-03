// 测试数据库连接和支付记录保存问题
console.log('🔍 数据库连接和支付记录测试\n');

// 加载环境变量
require('dotenv').config({ path: '.env.local' });
console.log('✅ 已加载 .env.local 环境变量\n');

// 1. 检查环境变量
console.log('📋 环境变量检查:');
const requiredEnvVars = [
  'TENCENT_CLOUD_SECRET_ID',
  'TENCENT_CLOUD_SECRET_KEY',
  'TENCENT_CLOUD_ENV_ID',
  'ALIPAY_APP_ID',
  'ALIPAY_PRIVATE_KEY',
  'ALIPAY_PUBLIC_KEY'
];

let missingVars = [];
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: 未设置`);
    missingVars.push(varName);
  } else {
    const maskedValue = varName.includes('SECRET') ? '***已设置***' :
                       varName.includes('PRIVATE_KEY') ? '***已设置***' :
                       varName.includes('PUBLIC_KEY') ? '***已设置***' :
                       value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  }
});

console.log('\n' + '='.repeat(60));

// 2. 测试CloudBase连接
console.log('🧪 CloudBase数据库连接测试:');

if (missingVars.includes('TENCENT_CLOUD_SECRET_ID') ||
    missingVars.includes('TENCENT_CLOUD_SECRET_KEY') ||
    missingVars.includes('TENCENT_CLOUD_ENV_ID')) {

  console.log('❌ CloudBase配置缺失，无法连接数据库');
  console.log('💡 需要设置以下环境变量:');
  console.log('   • TENCENT_CLOUD_SECRET_ID');
  console.log('   • TENCENT_CLOUD_SECRET_KEY');
  console.log('   • TENCENT_CLOUD_ENV_ID');
  console.log('\n📖 获取方法:');
  console.log('   1. 登录腾讯云控制台: https://console.cloud.tencent.com/');
  console.log('   2. 进入 云开发 > 环境');
  console.log('   3. 选择你的环境，查看 SecretId 和 SecretKey');

  console.log('\n' + '='.repeat(60));
  console.log('🎯 问题诊断结果:');
  console.log('❌ 主要问题: CloudBase环境变量未配置');
  console.log('💡 解决步骤:');
  console.log('   1. 在腾讯云控制台获取SecretId和SecretKey');
  console.log('   2. 将环境变量添加到 .env 文件');
  console.log('   3. 重启应用: npm run dev');
  console.log('   4. 重新测试支付功能');

} else {
  console.log('✅ CloudBase配置完整');

  // 异步测试函数
  async function testDatabaseConnection() {
    try {
      console.log('🔌 尝试连接CloudBase数据库...');

      const { getCloudBaseApp } = require('../lib/database/cloudbase');
      const app = getCloudBaseApp();

      if (!app) {
        console.log('❌ CloudBase连接失败');
        return;
      } else {
        console.log('✅ CloudBase连接成功');

        // 测试数据库操作
        console.log('📊 测试数据库查询...');

        const { query, add } = require('../lib/database/cloudbase');

        // 查询payments集合
        try {
          const result = await query('payments', { limit: 1 });
          console.log(`✅ payments集合查询成功，记录数: ${result.data?.length || 0}`);
        } catch (queryError) {
          console.log(`❌ payments集合查询失败: ${queryError.message}`);

          if (queryError.message.includes('Db or Table not exist') ||
              queryError.message.includes('DATABASE_COLLECTION_NOT_EXIST')) {
            console.log('💡 解决方案: 需要在CloudBase控制台创建 payments 集合');
          }
        }

        // 测试添加记录
        console.log('📝 测试添加支付记录...');

        try {
          const testPayment = {
            user_id: 'test-user',
            amount: 79,
            currency: 'CNY',
            status: 'pending',
            payment_method: 'alipay',
            transaction_id: 'TEST_' + Date.now(),
            metadata: {
              billingCycle: 'monthly',
              planType: 'pro',
              description: '测试支付记录'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const result = await add('payments', testPayment);
          console.log(`✅ 支付记录添加成功，文档ID: ${result.id}`);

          // 验证记录是否添加成功
          const verifyResult = await query('payments', {
            where: { transaction_id: testPayment.transaction_id },
            limit: 1
          });

          if (verifyResult.data && verifyResult.data.length > 0) {
            console.log('✅ 支付记录验证成功');
          } else {
            console.log('❌ 支付记录验证失败');
          }

        } catch (addError) {
          console.log(`❌ 支付记录添加失败: ${addError.message}`);

          if (addError.message.includes('Db or Table not exist') ||
              addError.message.includes('DATABASE_COLLECTION_NOT_EXIST')) {
            console.log('💡 解决方案: 需要在CloudBase控制台创建 payments 集合');
          }
        }
      }
    } catch (error) {
      console.log(`❌ CloudBase测试异常: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 问题诊断结果:');
    console.log('✅ 环境变量配置正确');
    console.log('💡 可能问题:');
    console.log('   • CloudBase集合未创建');
    console.log('   • 集合权限设置不正确');
    console.log('   • 网络连接问题');

    console.log('\n🔧 快速修复:');
    console.log('   1. 检查CloudBase控制台，确保payments集合存在');
    console.log('   2. 设置集合权限为: read: true, write: true');
    console.log('   3. 重启应用测试');

    console.log('\n📞 如果问题仍然存在，请提供CloudBase控制台的错误信息');
  }

  // 执行异步测试
  testDatabaseConnection().catch(error => {
    console.error('测试执行失败:', error);
  });
}

console.log('\n' + '='.repeat(60));
console.log('🎯 问题诊断结果:');

if (missingVars.length > 0) {
  console.log('❌ 主要问题: CloudBase环境变量未配置');
  console.log('💡 解决步骤:');
  console.log('   1. 在腾讯云控制台获取SecretId和SecretKey');
  console.log('   2. 将环境变量添加到 .env 文件');
  console.log('   3. 重启应用: npm run dev');
  console.log('   4. 重新测试支付功能');
} else {
  console.log('✅ 环境变量配置正确');
  console.log('💡 可能问题:');
  console.log('   • CloudBase集合未创建');
  console.log('   • 集合权限设置不正确');
  console.log('   • 网络连接问题');
}

console.log('\n🔧 快速修复:');
console.log('   1. 检查CloudBase控制台，确保payments集合存在');
console.log('   2. 设置集合权限为: read: true, write: true');
console.log('   3. 重启应用测试');

console.log('\n📞 如果问题仍然存在，请提供CloudBase控制台的错误信息');
