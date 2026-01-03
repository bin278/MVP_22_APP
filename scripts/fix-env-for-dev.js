// 修复开发环境的环境变量配置
console.log('🔧 修复开发环境配置...\n');

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

try {
  // 读取现有内容
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  // 检查是否已经有 NODE_ENV 设置
  if (!content.includes('NODE_ENV=')) {
    // 在文件开头添加环境配置
    const envConfig = `# ============================================================================
# 应用环境配置
# ============================================================================

# Node.js 环境 (development/production)
NODE_ENV=development

# 认证提供商 (cloudbase/supabase)
AUTH_PROVIDER=cloudbase

`;

    // 将新配置添加到现有内容前面
    content = envConfig + content;
    fs.writeFileSync(envPath, content, 'utf8');

    console.log('✅ 已添加开发环境配置');
    console.log('   • NODE_ENV=development');
    console.log('   • AUTH_PROVIDER=cloudbase');
  } else {
    console.log('✅ 环境配置已存在');
  }

  console.log('\n🚀 现在需要重启应用以应用新的环境变量配置:');
  console.log('   1. 停止当前应用 (Ctrl+C)');
  console.log('   2. 重新启动应用: npm run dev');
  console.log('   3. 测试支付功能');

} catch (error) {
  console.log('❌ 配置修复失败:', error.message);
}


