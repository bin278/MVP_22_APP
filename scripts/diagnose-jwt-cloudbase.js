/**
 * CloudBase JWT配置诊断工具
 * 专门用于诊断生产环境中的JWT认证问题
 */

const https = require('https');

function testCloudBaseJwt() {
  const baseUrl = 'https://mornfront.mornscience.top';

  console.log('🔍 CloudBase JWT认证诊断');
  console.log('==========================\n');

  // 测试1: 检查基础环境变量
  console.log('📋 测试1: 检查环境变量配置');
  console.log('-----------------------------');

  return new Promise((resolve) => {
    https.get(`${baseUrl}/api/env`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const envData = JSON.parse(data);

          if (envData.success) {
            console.log('✅ /api/env 返回成功');
            console.log('   NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID:', envData.env?.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || '❌ 未设置');
            console.log('   WECHAT_APP_ID:', envData.env?.WECHAT_APP_ID || '❌ 未设置');
          } else {
            console.log('❌ /api/env 返回失败:', envData.error);
          }
        } catch (error) {
          console.log('❌ /api/env 响应解析失败:', error.message);
        }

        // 测试2: 检查JWT配置
        console.log('\n📋 测试2: 检查JWT配置');
        console.log('-----------------------------');

        https.get(`${baseUrl}/api/test-jwt`, (res) => {
          let jwtData = '';

          console.log('📡 /api/test-jwt 响应状态:', res.statusCode);
          console.log('📄 响应头:', res.headers['content-type']);

          res.on('data', (chunk) => {
            jwtData += chunk;
          });

          res.on('end', () => {
            console.log('📏 响应长度:', jwtData.length, '字符');

            // 检查是否是HTML响应
            if (jwtData.includes('<!DOCTYPE') || jwtData.includes('<html')) {
              console.log('❌ /api/test-jwt 返回HTML页面，不是API响应');
              console.log('💡 这可能表示:');
              console.log('   1. API路由未正确部署');
              console.log('   2. CloudBase未重新部署最新代码');
              console.log('   3. 路由路径配置错误');

              // 显示HTML内容的前几行
              const lines = jwtData.split('\n').slice(0, 10);
              console.log('\n📄 HTML响应预览:');
              lines.forEach((line, index) => {
                if (line.trim()) {
                  console.log(`   ${index + 1}: ${line.trim()}`);
                }
              });

              resolve();
              return;
            }

            try {
              const jwtResult = JSON.parse(jwtData);

              if (jwtResult.success) {
                console.log('✅ /api/test-jwt 返回成功');

                console.log('🔐 环境变量状态:');
                console.log('   NODE_ENV:', jwtResult.environment.nodeEnv || '未设置');
                console.log('   AUTH_PROVIDER:', jwtResult.environment.authProvider || '未设置');
                console.log('   JWT_SECRET存在:', jwtResult.environment.hasJwtSecret ? '✅' : '❌');
                console.log('   JWT_SECRET长度:', jwtResult.environment.jwtSecretLength);

                console.log('\n🔑 JWT功能测试:');
                console.log('   可以生成token:', jwtResult.jwtTest.canGenerate ? '✅' : '❌');
                console.log('   可以验证token:', jwtResult.jwtTest.canVerify ? '✅' : '❌');
                console.log('   Token长度:', jwtResult.jwtTest.tokenLength);

                if (jwtResult.jwtTest.decoded) {
                  console.log('   Token解码:', JSON.stringify(jwtResult.jwtTest.decoded, null, 2));
                }

                console.log('\n💡 诊断建议:');
                jwtResult.recommendations.forEach((rec, index) => {
                  console.log(`   ${index + 1}. ${rec}`);
                });

                // 分析问题
                console.log('\n🔍 问题分析:');
                analyzeIssues(jwtResult);

              } else {
                console.log('❌ /api/test-jwt 返回失败:', jwtResult.error);
                if (jwtResult.details) {
                  console.log('   详细错误:', jwtResult.details);
                }
              }
            } catch (error) {
              console.log('❌ /api/test-jwt JSON解析失败:', error.message);
              console.log('📄 原始响应预览:', jwtData.substring(0, 200) + '...');
            }

            resolve();
          });
        }).on('error', (error) => {
          console.log('❌ 网络请求失败:', error.message);
          resolve();
        });
      });
    }).on('error', (error) => {
      console.log('❌ 网络请求失败:', error.message);
      resolve();
    });
  });
}

function analyzeIssues(jwtResult) {
  const issues = [];
  const solutions = [];

  // 检查环境变量
  if (!jwtResult.environment.hasJwtSecret) {
    issues.push('JWT_SECRET未在CloudBase中配置');
    solutions.push('在CloudBase控制台的环境变量中添加JWT_SECRET');
  } else if (jwtResult.environment.jwtSecretLength < 32) {
    issues.push('JWT_SECRET长度不足');
    solutions.push('使用至少32字符的强随机字符串');
  }

  if (!jwtResult.environment.nodeEnv) {
    issues.push('NODE_ENV未设置');
    solutions.push('设置NODE_ENV=production');
  }

  // 检查JWT功能
  if (!jwtResult.jwtTest.canGenerate) {
    issues.push('无法生成JWT token');
    solutions.push('检查JWT_SECRET格式是否正确');
  }

  if (!jwtResult.jwtTest.canVerify) {
    issues.push('无法验证JWT token');
    solutions.push('确认JWT_SECRET在生成和验证时一致');
  }

  // 输出分析结果
  if (issues.length === 0) {
    console.log('✅ 未发现明显问题，JWT配置可能正常');
    console.log('💡 如果认证仍失败，请检查:');
    console.log('   1. 用户登录token是否正确生成');
    console.log('   2. 前端是否正确发送Authorization头');
    console.log('   3. 数据库中的用户记录是否存在');
  } else {
    console.log('❌ 发现问题:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });

    console.log('\n🔧 解决方案:');
    solutions.forEach((solution, index) => {
      console.log(`   ${index + 1}. ${solution}`);
    });
  }
}

// 主函数
async function main() {
  console.log('🚀 CloudBase JWT认证诊断工具');
  console.log('================================\n');

  console.log('🔗 测试目标:', 'https://mornfront.mornscience.top');
  console.log('⏱️  测试时间:', new Date().toLocaleString('zh-CN'));
  console.log();

  await testCloudBaseJwt();

  console.log('\n📞 如果问题仍然存在，请提供以下信息:');
  console.log('   1. CloudBase控制台的环境变量截图（打码敏感信息）');
  console.log('   2. 浏览器Network标签中失败请求的详细信息');
  console.log('   3. 运行此诊断脚本的完整输出');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCloudBaseJwt, analyzeIssues };
