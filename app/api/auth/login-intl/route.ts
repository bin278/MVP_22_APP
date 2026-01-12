import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseProvider } from '@/lib/database';
import { signInWithEmail, signInWithGoogle, getGoogleAuthUrl } from '@/lib/auth/supabase-auth';
import { getUserAdapter } from '@/lib/database';
import { validateEmail, validatePassword, ValidationError } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, provider, accessToken, idToken } = body;

    const dbProvider = getDatabaseProvider();

    // 只处理国际版(Supabase)的登录请求
    if (dbProvider !== 'supabase') {
      console.log('⚠️ 国际版API被调用,但当前使用国内版数据库');
      return NextResponse.json(
        { error: 'This API is for international version (Supabase) only. Please use /api/auth/login for CN version (CloudBase).' },
        { status: 400 }
      );
    }

    // 检查认证提供商
    const authProvider = process.env.AUTH_PROVIDER;
    if (authProvider !== 'supabase') {
      console.log('⚠️ 国际版API被调用,但未配置Supabase认证');
      return NextResponse.json(
        { error: 'Supabase authentication not enabled. Please set AUTH_PROVIDER=supabase in your environment.' },
        { status: 400 }
      );
    }

    console.log('🌍 国际版登录请求:', { provider: provider || 'email' });

    // Google OAuth登录
    if (provider === 'google') {
      if (!accessToken || !idToken) {
        return NextResponse.json(
          { error: 'Google access token and ID token are required' },
          { status: 400 }
        );
      }

      const result = await signInWithGoogle(accessToken, idToken);

      if (!result.success || !result.user || !result.session) {
        return NextResponse.json(
          { error: result.error || 'Google sign in failed' },
          { status: 401 }
        );
      }

      // 获取用户订阅信息
      const userAdapter = await getUserAdapter();
      const { data: user } = await userAdapter.getUserById(result.user.id);

      return NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatar: result.user.avatar,
          subscription_plan: user?.subscription_plan || 'free',
        },
        accessToken: result.session,
        refreshToken: result.session, // Supabase使用相同的token
        tokenMeta: {
          provider: 'supabase',
          authMethod: 'google',
        }
      });
    }

    // 邮箱密码登录
    try {
      validateEmail(email);
      validatePassword(password);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const result = await signInWithEmail(email, password);

    if (!result.success || !result.user || !result.session) {
      return NextResponse.json(
        { error: result.error || 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 获取用户订阅信息
    const userAdapter = await getUserAdapter();
    const { data: user } = await userAdapter.getUserById(result.user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        avatar: result.user.avatar,
        subscription_plan: user?.subscription_plan || 'free',
      },
      accessToken: result.session,
      refreshToken: result.session,
      tokenMeta: {
        provider: 'supabase',
        authMethod: 'email',
      }
    });

  } catch (error: any) {
    console.error('国际版登录API错误:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}

// GET请求返回Google OAuth URL
export async function GET(request: NextRequest) {
  try {
    const dbProvider = getDatabaseProvider();

    // 只处理国际版
    if (dbProvider !== 'supabase') {
      return NextResponse.json(
        { error: 'Google OAuth is only available for international version (Supabase)' },
        { status: 400 }
      );
    }

    // 检查认证提供商
    const authProvider = process.env.AUTH_PROVIDER;
    if (authProvider !== 'supabase') {
      return NextResponse.json(
        { error: 'Supabase authentication not enabled' },
        { status: 400 }
      );
    }

    const authUrl = getGoogleAuthUrl();

    return NextResponse.json({
      success: true,
      authUrl,
      provider: 'google',
    });
  } catch (error: any) {
    console.error('获取Google OAuth URL错误:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get OAuth URL' },
      { status: 500 }
    );
  }
}
