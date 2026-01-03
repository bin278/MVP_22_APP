// 测试服务器端日志输出
// GET /api/test-log

export async function GET() {
  console.log('🧪 ========== 测试服务器端日志 ==========');
  console.log('📅 时间戳:', new Date().toISOString());
  console.log('🌐 请求来源: GET /api/test-log');
  console.log('🔍 Node.js版本:', process.version);
  console.log('📂 当前工作目录:', process.cwd());

  // 测试环境变量
  console.log('🔧 环境变量检查:');
  console.log('  ALIPAY_APP_ID:', process.env.ALIPAY_APP_ID ? '✅ 设置' : '❌ 未设置');
  console.log('  ALIPAY_PRIVATE_KEY:', process.env.ALIPAY_PRIVATE_KEY ? '✅ 设置' : '❌ 未设置');
  console.log('  ALIPAY_PUBLIC_KEY:', process.env.ALIPAY_PUBLIC_KEY ? '✅ 设置' : '❌ 未设置');

  console.log('✅ 测试日志输出完成');
  console.log('🎉 ========== 日志测试结束 ==========');

  return Response.json({
    success: true,
    message: '服务器端日志测试完成，请查看控制台输出',
    timestamp: new Date().toISOString(),
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd()
    }
  });
}
