import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseProvider } from '@/lib/database';
import { signUpWithEmail } from '@/lib/auth/supabase-auth';
import { validateEmail, validatePassword, validateStringLength, ValidationError } from '@/lib/validation';

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
    try {
      validateEmail(email);
      validatePassword(password);
      if (name) {
        validateStringLength(name, 'Name', 1, 100);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
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
