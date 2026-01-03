import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/database/cloudbase';
import { getUserPlan } from '@/lib/subscription/usage-tracker';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('API登录请求:', { email });

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码是必需的' },
        { status: 400 }
      );
    }

    // 获取数据库连接
    const db = getDatabase();
    if (!db) {
      console.error('数据库连接不可用');
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      );
    }

    // 查询用户
    console.log('查询用户信息...');
    const userResult = await db.collection('users')
      .where({ email: email })
      .limit(1)
      .get();

    if (!userResult.data || userResult.data.length === 0) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    const user = userResult.data[0];

    // 验证密码（注意：生产环境中密码应该加密存储）
    if (user.password !== password) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    console.log('用户登录成功');

    // 获取真实的订阅计划（从 user_subscriptions 表）
    const subscriptionPlan = await getUserPlan(user._id);

    // 创建JWT token（与微信登录保持一致的格式）
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const tokenPayload = {
      userId: user._id, // 使用userId字段，与微信登录一致
      email: user.email,
      type: 'access', // 添加token类型
      region: 'CN' // 添加区域信息
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    // 转换用户对象格式，与微信登录保持一致
    const userForFrontend = {
      id: user._id, // 将 _id 转换为 id
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      subscription_plan: subscriptionPlan
    };

    return NextResponse.json({
      success: true,
      user: userForFrontend,
      accessToken: accessToken,
      refreshToken: `refresh_${user._id}_${Date.now()}`,
      tokenMeta: {
        accessTokenExpiresIn: 3600, // 1小时（秒）
        refreshTokenExpiresIn: 2592000 // 30天（秒）
      }
    });

  } catch (error: any) {
    console.error('登录API错误:', error);

    let errorMessage = '登录失败，请稍后重试';
    let statusCode = 500;

    if (error && typeof error === 'object') {
      const errorMsg = error.message || error.msg || error.error || error.code || '';

      if (errorMsg.includes('unauthenticated') || errorMsg.includes('auth')) {
        errorMessage = '认证失败，请检查CloudBase配置';
        statusCode = 401;
      } else if (errorMsg.includes('permission') || errorMsg.includes('forbidden')) {
        errorMessage = '权限不足，无法访问数据库';
        statusCode = 403;
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}




