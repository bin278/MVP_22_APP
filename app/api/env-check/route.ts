// API路由：检查支付宝环境变量配置
// GET /api/env-check

export async function GET() {
  // 详细的环境变量状态
  const envStatus = {
    ALIPAY_APP_ID: {
      exists: !!process.env.ALIPAY_APP_ID,
      value: process.env.ALIPAY_APP_ID ? `${process.env.ALIPAY_APP_ID.substring(0, 10)}...` : null,
      length: process.env.ALIPAY_APP_ID?.length || 0
    },
    ALIPAY_PRIVATE_KEY: {
      exists: !!process.env.ALIPAY_PRIVATE_KEY,
      length: process.env.ALIPAY_PRIVATE_KEY?.length || 0,
      startsWith: process.env.ALIPAY_PRIVATE_KEY?.substring(0, 27) || null
    },
    ALIPAY_PUBLIC_KEY: {
      exists: !!process.env.ALIPAY_PUBLIC_KEY,
      length: process.env.ALIPAY_PUBLIC_KEY?.length || 0
    },
    ALIPAY_SANDBOX: process.env.ALIPAY_SANDBOX,
    ALIPAY_TEST_MODE: process.env.ALIPAY_TEST_MODE,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  // 检查.env文件
  const fs = require('fs');
  const path = require('path');

  let envFileStatus = {
    '.env.local': { exists: false, size: 0, content: null as string | null, lines: 0 },
    '.env': { exists: false, size: 0, content: null as string | null, lines: 0 }
  };

  // 读取.env.local文件内容（用于诊断）
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const stats = fs.statSync(envLocalPath);
      const content = fs.readFileSync(envLocalPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
      envFileStatus['.env.local'] = {
        exists: true,
        size: stats.size,
        content: content,
        lines: lines.length
      };
    }
  } catch (e) {
    console.error('读取.env.local文件失败:', e.message);
  }

  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const stats = fs.statSync(envPath);
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
      envFileStatus['.env'] = {
        exists: true,
        size: stats.size,
        content: content,
        lines: lines.length
      };
    }
  } catch (e) {
    // ignore
  }

  // 分析当前状态
  const hasAppId = !!process.env.ALIPAY_APP_ID;
  const hasPrivateKey = !!process.env.ALIPAY_PRIVATE_KEY;
  const isTestMode = process.env.ALIPAY_TEST_MODE === 'true';
  const isSandbox = process.env.ALIPAY_SANDBOX !== 'false';

  let analysis = '';
  let issues: string[] = [];
  let recommendations: string[] = [];

  // 检查文件
  if (!envFileStatus['.env.local'].exists && !envFileStatus['.env'].exists) {
    issues.push('没有找到环境变量文件 (.env.local 或 .env)');
    recommendations.push('在项目根目录创建 .env.local 文件');
  }

  if (envFileStatus['.env.local'].exists && envFileStatus['.env.local'].size === 0) {
    issues.push('.env.local 文件存在但为空');
    recommendations.push('在 .env.local 中添加支付宝配置');
  }

  // 检查测试模式
  if (isTestMode) {
    issues.push('当前处于测试模式');
    recommendations.push('删除或注释掉 ALIPAY_TEST_MODE=true 这一行');
  }

  // 检查配置完整性
  if (!hasAppId) {
    issues.push('缺少 ALIPAY_APP_ID');
    recommendations.push('设置 ALIPAY_APP_ID=你的沙盒应用ID');
  }

  if (!hasPrivateKey) {
    issues.push('缺少 ALIPAY_PRIVATE_KEY');
    recommendations.push('设置 ALIPAY_PRIVATE_KEY=你的私钥');
  }

  if (issues.length === 0) {
    analysis = `✅ 配置正确 - 使用真实支付宝API (${isSandbox ? '沙盒环境' : '生产环境'})`;
  } else {
    analysis = `❌ 配置问题 - 发现 ${issues.length} 个问题`;
  }

  // 处理文件内容（隐藏敏感信息）
  const safeFileContent = {
    '.env.local': envFileStatus['.env.local'].exists ? {
      ...envFileStatus['.env.local'],
      content: envFileStatus['.env.local'].content?.split('\n').map(line => {
        if (line.includes('ALIPAY_PRIVATE_KEY=') || line.includes('ALIPAY_PUBLIC_KEY=')) {
          return line.replace(/=.*/, '=***已配置***');
        }
        return line;
      }).join('\n')
    } : null,
    '.env': envFileStatus['.env'].exists ? {
      ...envFileStatus['.env'],
      content: envFileStatus['.env'].content?.split('\n').map(line => {
        if (line.includes('ALIPAY_PRIVATE_KEY=') || line.includes('ALIPAY_PUBLIC_KEY=')) {
          return line.replace(/=.*/, '=***已配置***');
        }
        return line;
      }).join('\n')
    } : null
  };

  return Response.json({
    status: envStatus,
    files: safeFileContent,
    analysis,
    issues,
    recommendations,
    configGuide: {
      'ALIPAY_APP_ID': '9021000157691730 (沙盒应用ID示例)',
      'ALIPAY_PRIVATE_KEY': '-----BEGIN PRIVATE KEY-----\n你的应用私钥内容\n-----END PRIVATE KEY-----',
      'ALIPAY_PUBLIC_KEY': '-----BEGIN PUBLIC KEY-----\n支付宝公钥内容\n-----END PUBLIC KEY----- （可选）',
      'ALIPAY_SANDBOX': 'true （启用沙盒模式，默认）',
      'ALIPAY_TEST_MODE': 'true （仅当需要测试模式时设置）'
    },
    nextSteps: issues.length === 0 ? [
      '配置正确！现在可以测试支付功能',
      '点击"购买订阅"应该会调用真实支付宝API'
    ] : [
      '修复上述问题后重启开发服务器',
      '访问此页面重新检查配置',
      '配置正确后测试支付功能'
    ]
  });
}
