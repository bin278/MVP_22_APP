import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseProvider } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const dbProvider = getDatabaseProvider();
    const authProvider = process.env.AUTH_PROVIDER;

    // 只处理国际版
    if (dbProvider !== 'supabase' || authProvider !== 'supabase') {
      console.log('⚠️ Google OAuth回调被调用,但未配置国际版');
      return NextResponse.redirect(
        new URL('/login?error=oauth-not-available', request.url)
      );
    }

    // 处理OAuth错误
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/login?error=oauth-failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=no-code', request.url)
      );
    }

    // 重定向到前端处理OAuth回调
    // 前端需要使用这个code来换取access token
    return NextResponse.redirect(
      new URL(`/login?code=${code}&provider=google`, request.url)
    );

  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=callback-failed', request.url)
    );
  }
}
