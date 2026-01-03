#!/usr/bin/env node

/**
 * CloudBase 云托管部署检查脚本
 * 检查项目配置是否适合云托管部署
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CloudBase 云托管部署检查');
console.log('================================\n');

let allChecksPass = true;

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}: ${exists ? '存在' : '不存在'}`);
  if (!exists) allChecksPass = false;
  return exists;
}

function checkFileContent(filePath, searchPattern, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = searchPattern.test(content);
    const status = matches ? '✅' : '❌';
    console.log(`${status} ${description}`);
    if (!matches) allChecksPass = false;
    return matches;
  } catch (error) {
    console.log(`❌ ${description}: 文件读取失败`);
    allChecksPass = false;
    return false;
  }
}

function checkEnvVar(varName, description) {
  const exists = process.env[varName] ? true : false;
  const status = exists ? '✅' : '⚠️';
  console.log(`${status} ${description}: ${exists ? '已配置' : '未配置'}`);
  return exists;
}

// 1. 检查核心文件
console.log('📁 核心文件检查:');
checkFileExists('package.json', 'package.json 文件');
checkFileExists('next.config.mjs', 'Next.js 配置文件');
checkFileExists('Dockerfile', 'Docker 配置文件');
checkFileExists('.dockerignore', 'Docker 忽略文件');
checkFileExists('.cloudbaserc.json', 'CloudBase 配置文件');
checkFileExists('app/api/health/route.ts', '健康检查 API');

console.log('\n');

// 2. 检查 Next.js 配置
console.log('⚙️ Next.js 配置检查:');
checkFileContent('next.config.mjs', /output.*standalone/, 'Next.js standalone 输出模式');
checkFileContent('next.config.mjs', /CLOUDBASE_BUILD/, 'CloudBase 构建环境变量');

console.log('\n');

// 3. 检查 CloudBase 配置
console.log('☁️ CloudBase 配置检查:');
checkFileContent('.cloudbaserc.json', /"version": "2.0"/, 'CloudBase 配置版本');
checkFileContent('.cloudbaserc.json', /"framework":/, '框架配置');
checkFileContent('.cloudbaserc.json', /"nextjs":/, 'Next.js 插件配置');

console.log('\n');

// 4. 检查 Dockerfile
console.log('🐳 Docker 配置检查:');
checkFileContent('Dockerfile', /FROM node:20-alpine/, 'Node.js 20 基础镜像');
checkFileContent('Dockerfile', /CLOUDBASE_BUILD=true/, 'CloudBase 构建标识');
checkFileContent('Dockerfile', /HEALTHCHECK/, '健康检查配置');

console.log('\n');

// 5. 检查环境变量
console.log('🔐 环境变量检查:');
checkEnvVar('NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID', '腾讯云环境ID');
checkEnvVar('NEXT_PUBLIC_APP_URL', '应用URL');
checkEnvVar('AUTH_PROVIDER', '认证提供商');
checkEnvVar('DATABASE_PROVIDER', '数据库提供商');

console.log('\n');

// 6. 检查支付配置
console.log('💳 支付配置检查:');
checkEnvVar('WECHAT_PAY_APPID', '微信支付配置');
checkEnvVar('ALIPAY_APP_ID', '支付宝配置');

console.log('\n');

// 7. 检查 AI 模型配置
console.log('🤖 AI 模型配置检查:');
checkEnvVar('DEEPSEEK_API_KEY', 'DeepSeek API 密钥');
checkEnvVar('GLM_API_KEY', 'GLM API 密钥');

console.log('\n');

// 8. 总结
console.log('================================');
if (allChecksPass) {
  console.log('🎉 所有检查通过！项目已准备好部署到 CloudBase 云托管');
  console.log('\n📋 部署步骤:');
  console.log('1. 推送代码到 GitHub');
  console.log('2. 在 CloudBase 控制台创建云托管服务');
  console.log('3. 配置 GitHub 集成和自动部署');
  console.log('4. 设置环境变量');
  console.log('5. 部署应用');
} else {
  console.log('⚠️ 部分检查未通过，请修复上述问题后再部署');
  console.log('\n🔧 常见修复方法:');
  console.log('- 确保所有必需的环境变量已配置');
  console.log('- 检查 .cloudbaserc.json 配置是否正确');
  console.log('- 验证 Dockerfile 是否完整');
}

console.log('\n================================\n');












