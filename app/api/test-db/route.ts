import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 测试CloudBase数据库连接...');

    // 检查环境变量
    const envCheck = {
      TENCENT_CLOUD_SECRET_ID: !!process.env.TENCENT_CLOUD_SECRET_ID,
      TENCENT_CLOUD_SECRET_KEY: !!process.env.TENCENT_CLOUD_SECRET_KEY,
      TENCENT_CLOUD_ENV_ID: !!process.env.TENCENT_CLOUD_ENV_ID,
    };

    console.log('📋 环境变量状态:', envCheck);

    if (!envCheck.TENCENT_CLOUD_SECRET_ID || !envCheck.TENCENT_CLOUD_SECRET_KEY || !envCheck.TENCENT_CLOUD_ENV_ID) {
      return NextResponse.json({
        success: false,
        error: '缺少CloudBase环境变量配置',
        envCheck
      });
    }

    // 测试数据库连接
    console.log('🔌 测试数据库连接...');
    const { query, add } = await import('@/lib/database/cloudbase');

    // 测试查询payments集合
    let paymentsQueryResult;
    try {
      console.log('📊 查询payments集合...');
      const result = await query('payments', { limit: 10 }); // 查询更多记录以确认是否有数据
      paymentsQueryResult = {
        success: true,
        total: result.data ? result.data.length : 0, // CloudBase不提供total，使用数组长度
        hasData: result.data && result.data.length > 0,
        recordCount: result.data ? result.data.length : 0
      };
      console.log('✅ payments集合查询成功:', paymentsQueryResult);
    } catch (queryError: any) {
      paymentsQueryResult = {
        success: false,
        error: queryError.message
      };
      console.log('❌ payments集合查询失败:', queryError.message);
    }

    // 测试添加记录
    let addTestResult;
    try {
      console.log('📝 测试添加记录...');
      const testId = `test_${Date.now()}`;
      const testRecord = {
        _id: testId,
        test_field: 'connection_test',
        timestamp: new Date().toISOString(),
      };

      await add('test_connection', testRecord);
      addTestResult = {
        success: true,
        testId
      };
      console.log('✅ 测试记录添加成功:', testId);
    } catch (addError: any) {
      addTestResult = {
        success: false,
        error: addError.message
      };
      console.log('❌ 测试记录添加失败:', addError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'CloudBase数据库连接测试完成',
      envCheck,
      paymentsQuery: paymentsQueryResult,
      addTest: addTestResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('数据库测试失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
