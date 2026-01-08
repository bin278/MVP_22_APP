import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseProvider } from '@/lib/database';
import { signUpWithEmail } from '@/lib/auth/supabase-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    const dbProvider = getDatabaseProvider();

    // 只处理国际版(Supabase)的注册请求
    if (dbProvider !== 'supabase') {
      console.log('⚠️ 国际版注册API被调用,但当前使用国内版数据库');
      return NextResponse.json(
        { error: 'This API is for international version (Supabase) only. Please use /api/auth/register for CN version (CloudBase).' },
        { status: 400 }
      );
    }

    // 检查认证提供商
    const authProvider = process.env.AUTH_PROVIDER;
    if (authProvider !== 'supabase') {
      console.log('⚠️ 国际版注册API被调用,但未配置Supabase认证');
      return NextResponse.json(
        { error: 'Supabase authentication not enabled. Please set AUTH_PROVIDER=supabase in your environment.' },
        { status: 400 }
      );
    }

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 验证密码强度
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    console.log('🌍 国际版注册请求:', { email, name });

    const result = await signUpWithEmail(email, password, name);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Registration failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
        subscription_plan: result.user?.subscription_plan || 'free',
      },
      message: 'Registration successful! Please sign in.',
    });

  } catch (error: any) {
    console.error('国际版注册API错误:', error);

    // 处理Supabase特定错误
    if (error.message?.includes('User already registered')) {
      return NextResponse.json(
        { error: 'Email already registered. Please sign in.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
