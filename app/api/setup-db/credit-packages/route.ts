import { NextRequest, NextResponse } from 'next/server';
import { getCloudBaseApp } from '@/lib/database/cloudbase';

/**
 * API路由: 创建 user_credit_packages 集合
 *
 * 使用方法:
 * GET /api/setup-db/credit-packages
 *
 * 此路由会创建 user_credit_packages 集合(如果不存在)
 * 并返回创建状态
 */
export async function GET(request: NextRequest) {
  try {
    // 验证请求来源(可选,可以添加密码保护)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized. Please provide Bearer token.',
      }, { status: 401 });
    }

    // 获取CloudBase实例
    const app = getCloudBaseApp();
    if (!app) {
      return NextResponse.json({
        success: false,
        error: 'CloudBase initialization failed. Check environment variables.',
      }, { status: 500 });
    }

    const db = app.database();

    // 检查集合是否已存在
    const checkResult = await db
      .collection('user_credit_packages')
      .limit(1)
      .get();

    if (checkResult.data && checkResult.data.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Collection user_credit_packages already exists',
        count: checkResult.data.length,
        created: false,
      });
    }

    // 创建示例文档来初始化集合
    const sampleDoc = {
      _id: 'system_init_doc',
      user_id: 'system',
      package_type: 'init',
      status: 'expired',
      credits_total: 0,
      credits_remaining: 0,
      credits_used: 0,
      expiry_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: '初始化文档,用于创建集合,可以删除',
    };

    const result = await db.collection('user_credit_packages').add(sampleDoc);

    // 立即删除示例文档
    try {
      await db.collection('user_credit_packages').doc(result.id).remove();
    } catch (deleteError) {
      console.warn('删除示例文档失败:', deleteError);
    }

    return NextResponse.json({
      success: true,
      message: 'Collection user_credit_packages created successfully',
      created: true,
      collectionId: result.id,
    });

  } catch (error: any) {
    console.error('创建集合失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create collection',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
