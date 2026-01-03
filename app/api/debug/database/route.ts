import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/cloudbase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 开始数据库连接诊断...');

    // 1. 检查环境变量
    const envCheck = {
      TENCENT_CLOUD_ENV_ID: process.env.TENCENT_CLOUD_ENV_ID ? '✅' : '❌',
      TENCENT_CLOUD_SECRET_ID: process.env.TENCENT_CLOUD_SECRET_ID ? '✅' : '❌',
      TENCENT_CLOUD_SECRET_KEY: process.env.TENCENT_CLOUD_SECRET_KEY ? '✅' : '❌',
      DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || 'cn',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };

    console.log('🔑 环境变量状态:', envCheck);

    // 2. 测试数据库连接
    console.log('🔌 测试数据库连接...');
    const db = getDatabase();

    if (!db) {
      console.error('❌ 数据库连接失败');
      return NextResponse.json({
        success: false,
        error: '数据库连接失败',
        details: {
          envCheck,
          error: 'getDatabase() returned null'
        }
      }, { status: 500 });
    }

    console.log('✅ 数据库连接成功');

    // 3. 测试集合权限
    const collectionsToTest = [
      'users',
      'conversations',
      'conversation_messages',
      'user_subscriptions',
      'payments'
    ];

    const permissionResults = {};

    for (const collectionName of collectionsToTest) {
      try {
        console.log(`🔍 测试 ${collectionName} 集合权限...`);

        // 尝试读取一条记录（测试读取权限）
        const testQuery = await db.collection(collectionName)
          .where({ _id: 'non-existent-id' }) // 使用不存在的ID来测试权限
          .limit(1)
          .get();

        permissionResults[collectionName] = {
          read: '✅',
          error: null
        };

        console.log(`✅ ${collectionName} 集合读取权限正常`);

      } catch (error: any) {
        console.error(`❌ ${collectionName} 集合权限测试失败:`, error.message);

        permissionResults[collectionName] = {
          read: '❌',
          error: error.message
        };

        // 如果是权限错误，尝试判断具体的权限问题
        if (error.message?.includes('permission') ||
            error.message?.includes('forbidden') ||
            error.message?.includes('unauthorized')) {
          permissionResults[collectionName].errorType = 'PERMISSION_DENIED';
        }
      }
    }

    // 4. 测试用户查询（模拟登录过程）
    console.log('🔍 测试用户查询...');
    let userQueryTest = { success: false, error: null };

    try {
      // 模拟登录查询（使用一个不可能存在的邮箱）
      const userTest = await db.collection('users')
        .where({ email: 'diagnostic-test@example.com' })
        .limit(1)
        .get();

      userQueryTest = {
        success: true,
        error: null,
        recordCount: userTest.data?.length || 0
      };

      console.log('✅ 用户查询测试成功');

    } catch (error: any) {
      console.error('❌ 用户查询测试失败:', error.message);
      userQueryTest = {
        success: false,
        error: error.message
      };
    }

    // 5. 返回诊断结果
    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        connected: true,
        collections: permissionResults
      },
      userQuery: userQueryTest,
      recommendations: []
    };

    // 生成建议
    if (Object.values(permissionResults).some((result: any) => result.read === '❌')) {
      diagnosis.recommendations.push(
        '❌ 集合权限不足，请按照 CLOUDBASE_PERMISSION_FIX_GUIDE.md 设置权限'
      );
    }

    if (!userQueryTest.success && userQueryTest.error?.includes('permission')) {
      diagnosis.recommendations.push(
        '❌ users集合权限不足，邮箱登录将失败'
      );
    }

    if (envCheck.TENCENT_CLOUD_ENV_ID === '❌' ||
        envCheck.TENCENT_CLOUD_SECRET_ID === '❌' ||
        envCheck.TENCENT_CLOUD_SECRET_KEY === '❌') {
      diagnosis.recommendations.push(
        '❌ CloudBase环境变量未配置，请在CloudBase控制台设置'
      );
    }

    console.log('🔍 数据库诊断完成');

    return NextResponse.json({
      success: true,
      diagnosis,
      summary: {
        totalCollections: collectionsToTest.length,
        accessibleCollections: Object.values(permissionResults).filter((r: any) => r.read === '✅').length,
        userQueryWorks: userQueryTest.success
      }
    });

  } catch (error: any) {
    console.error('💥 数据库诊断失败:', error);
    return NextResponse.json({
      success: false,
      error: '诊断过程失败',
      message: error.message
    }, { status: 500 });
  }
}








