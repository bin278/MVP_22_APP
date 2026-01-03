#!/usr/bin/env node

/**
 * 生成JWT密钥的工具脚本
 * 用于微信登录的JWT token签名
 */

const crypto = require('crypto');

/**
 * 生成安全的随机JWT密钥
 */
function generateJWTSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 生成安全的随机JWT密钥（Base64编码）
 */
function generateJWTSecretBase64(length = 48) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * 生成安全的随机JWT密钥（混合字符）
 */
function generateJWTSecretComplex(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

console.log('🔐 JWT密钥生成工具');
console.log('==================\n');

console.log('🎯 JWT_SECRET 用于微信登录的JWT token签名和验证');
console.log('📝 建议使用至少32位以上的随机字符串\n');

// 生成多种格式的密钥
console.log('📋 生成的JWT密钥：\n');

// 格式1: Hex格式 (64字符)
const hexSecret = generateJWTSecret(32);
console.log('🔸 Hex格式 (64字符):');
console.log(`JWT_SECRET=${hexSecret}`);
console.log('');

// 格式2: Base64格式
const base64Secret = generateJWTSecretBase64(32);
console.log('🔸 Base64格式 (64字符):');
console.log(`JWT_SECRET=${base64Secret}`);
console.log('');

// 格式3: 混合字符格式
const complexSecret = generateJWTSecretComplex(64);
console.log('🔸 混合字符格式 (64字符):');
console.log(`JWT_SECRET=${complexSecret}`);
console.log('');

console.log('📍 配置位置：');
console.log('=============');
console.log('');
console.log('🔹 本地开发 (.env.local):');
console.log('   JWT_SECRET=上面生成的密钥');
console.log('');
console.log('🔹 CloudBase生产环境:');
console.log('   1. 登录腾讯云控制台');
console.log('   2. 进入 CloudBase → 云托管 → 环境变量');
console.log('   3. 添加环境变量:');
console.log('      变量名: JWT_SECRET');
console.log('      变量值: 上面生成的密钥');
console.log('');
console.log('🔹 腾讯云原生环境 (如果使用):');
console.log('   1. 登录腾讯云控制台');
console.log('   2. 进入 云函数 → 环境变量');
console.log('   3. 添加环境变量:');
console.log('      变量名: JWT_SECRET');
console.log('      变量值: 上面生成的密钥');
console.log('');

console.log('⚠️  安全提醒：');
console.log('============');
console.log('🔴 不要将JWT_SECRET提交到版本控制系统');
console.log('🔴 生产环境使用不同的密钥');
console.log('🔴 定期更换密钥以增强安全性');
console.log('🟡 密钥长度建议：至少32字符，推荐64字符');
console.log('');

console.log('✅ 推荐配置：');
console.log('============');
console.log(`JWT_SECRET=${hexSecret}`);
console.log('');
console.log('📋 已复制上面的密钥，添加到你的环境变量配置中！');






