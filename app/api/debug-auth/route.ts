import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/database/cloudbase';
import { CloudBaseCollections } from '@/lib/database/cloudbase-client';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug Auth] 开始认证调试...');

    // 获取请求头信息
    const authHeader = request.headers.get('authorization');
    const userAgent = request.headers.get('user-agent');
    const origin = request.headers.get('origin');

    console.log('[Debug Auth] 请求信息:', {
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length || 0,
      userAgent: userAgent?.substring(0, 50),
      origin
    });

    // 检查环境变量
    const jwtSecret = process.env.JWT_SECRET;
    const nodeEnv = process.env.NODE_ENV;

    console.log('[Debug Auth] 环境变量:', {
      hasJwtSecret: !!jwtSecret,
      jwtSecretLength: jwtSecret?.length || 0,
      nodeEnv
    });

    // 调用requireAuth
    const authResult = await requireAuth(request);

    console.log('[Debug Auth] 认证结果:', {
      success: authResult.success,
      hasUser: !!authResult.user,
      error: authResult.error
    });

    if (authResult.success && authResult.user) {
      console.log('[Debug Auth] 用户信息:', {
        id: authResult.user.id,
        email: authResult.user.email,
        uid: authResult.user.uid
      });
    }

    // 尝试手动验证token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        console.log('[Debug Auth] 手动JWT验证...');
        const decoded = jwt.verify(token, jwtSecret) as any;
        console.log('[Debug Auth] JWT解码成功:', {
          userId: decoded.userId,
          type: decoded.type,
          exp: decoded.exp,
          iat: decoded.iat
        });

        // 尝试查询数据库
        if (decoded.userId) {
          console.log('[Debug Auth] 查询数据库...');
          const db = getDatabase();
          const userDoc = await db.collection(CloudBaseCollections.USERS)
            .doc(decoded.userId)
            .get();

          console.log('[Debug Auth] 数据库查询结果:', {
            hasData: !!(userDoc.data && userDoc.data.length > 0),
            dataLength: userDoc.data?.length || 0
          });

          if (userDoc.data && userDoc.data.length > 0) {
            const user = userDoc.data[0];
            console.log('[Debug Auth] 用户数据:', {
              _id: user._id,
              email: user.email,
              name: user.name
            });
          }
        }
      } catch (jwtError) {
        console.error('[Debug Auth] JWT验证失败:', jwtError.message);
      }
    }

    // 返回调试信息
    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv,
          hasJwtSecret: !!jwtSecret,
          jwtSecretLength: jwtSecret?.length || 0
        },
        request: {
          hasAuthHeader: !!authHeader,
          authHeaderLength: authHeader?.length || 0,
          userAgent: userAgent?.substring(0, 50),
          origin
        },
        auth: {
          success: authResult.success,
          hasUser: !!authResult.user,
          error: authResult.error,
          userId: authResult.user?.id,
          userEmail: authResult.user?.email
        }
      }
    });

  } catch (error) {
    console.error('[Debug Auth] 调试异常:', error);
    return NextResponse.json(
      {
        success: false,
        error: '调试过程发生异常',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}




