import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/cloudbase';

export async function POST(request: NextRequest) {
  try {
    const { testEmail = 'test@example.com', testPassword = 'test123' } = await request.json();

    console.log('🧪 开始邮箱登录测试...');

    // 1. 检查数据库连接
    const db = getDatabase();
    if (!db) {
      return NextResponse.json({
        success: false,
        error: '数据库连接失败',
        step: 'database_connection'
      }, { status: 500 });
    }

    console.log('✅ 数据库连接正常');

    // 2. 测试用户查询
    console.log('🔍 测试用户查询...');
    try {
      const userResult = await db.collection('users')
        .where({ email: testEmail })
        .limit(1)
        .get();

      console.log('✅ 用户查询成功，找到记录:', userResult.data?.length || 0);

      return NextResponse.json({
        success: true,
        message: '邮箱登录功能正常',
        details: {
          databaseConnected: true,
          userQueryWorks: true,
          foundUsers: userResult.data?.length || 0,
          testEmail
        }
      });

    } catch (error: any) {
      console.error('❌ 用户查询失败:', error);

      // 判断错误类型
      let errorType = 'unknown';
      let statusCode = 500;

      if (error.message?.includes('permission') || error.message?.includes('forbidden')) {
        errorType = 'permission_denied';
        statusCode = 403;
      } else if (error.message?.includes('collection') && error.message?.includes('not exist')) {
        errorType = 'collection_not_exist';
        statusCode = 404;
      }

      return NextResponse.json({
        success: false,
        error: '用户查询失败',
        step: 'user_query',
        errorType,
        details: {
          errorMessage: error.message,
          testEmail
        }
      }, { status: statusCode });
    }

  } catch (error: any) {
    console.error('💥 登录测试失败:', error);
    return NextResponse.json({
      success: false,
      error: '测试过程失败',
      step: 'test_execution',
      message: error.message
    }, { status: 500 });
  }
}








