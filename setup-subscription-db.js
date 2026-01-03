#!/usr/bin/env node

/**
 * Supabase 订阅系统数据库设置脚本
 * 运行此脚本来设置订阅相关的数据库表和函数
 */

const fs = require('fs');
const path = require('path');

// 读取SQL文件
const sqlFilePath = path.join(__dirname, 'supabase-subscription-schema.sql');

try {
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log('🚀 Supabase 订阅系统数据库设置');
  console.log('=====================================');
  console.log('');
  console.log('📋 请按照以下步骤设置数据库：');
  console.log('');
  console.log('1. 访问 Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. 选择你的项目');
  console.log('3. 进入 "SQL Editor" 页面');
  console.log('4. 复制以下SQL代码并执行：');
  console.log('');
  console.log('=====================================');
  console.log(sqlContent);
  console.log('=====================================');
  console.log('');
  console.log('✅ 执行完成后，你的订阅系统将完全可用！');
  console.log('');
  console.log('🎯 测试步骤：');
  console.log('1. 访问 http://localhost:3000/profile');
  console.log('2. 使用底部的订阅管理测试按钮');
  console.log('3. 尝试切换不同的订阅等级');
  console.log('4. 访问 http://localhost:3000/generate 验证模型权限');

} catch (error) {
  console.error('❌ 读取SQL文件失败:', error.message);
  process.exit(1);
}












