import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/cloudbase';

// 邮箱格式验证
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    console.log('API注册请求:', { email, fullName });

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码是必需的' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6位' },
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

    // 检查邮箱是否已注册
    console.log('检查邮箱是否已存在...');
    const existingUser = await db.collection('users')
      .where({ email: email })
      .limit(1)
      .get();

    if (existingUser.data && existingUser.data.length > 0) {
      return NextResponse.json(
        { error: '该邮箱已被注册，请使用其他邮箱或直接登录' },
        { status: 409 }
      );
    }

    // 创建用户文档
    const userDoc = {
      email: email,
      password: password, // 注意：生产环境中应该加密存储
      fullName: fullName || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    console.log('创建用户文档...');
    const result = await db.collection('users').add(userDoc);

    console.log('用户注册成功，文档ID:', result.id);

    return NextResponse.json({
      success: true,
      user: {
        id: result.id,
        email: email,
        fullName: fullName || '',
        createdAt: userDoc.createdAt
      }
    });

  } catch (error: any) {
    console.error('注册API错误:', error);

    let errorMessage = '注册失败，请稍后重试';
    let statusCode = 500;

    if (error && typeof error === 'object') {
      const errorMsg = error.message || error.msg || error.error || error.code || '';

      // 根据错误类型设置不同的状态码和消息
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




