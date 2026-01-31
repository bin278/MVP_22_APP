// lib/auth/supabase-auth.ts
// Supabase 认证相关工具函数

import { createClient } from '@supabase/supabase-js';

// 获取Supabase客户端
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase not configured');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Supabase用户接口
 */
export interface SupabaseUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  subscription_plan?: string;
  subscription_status?: string;
  region?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 验证Supabase访问令牌
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseUser | null> {
  try {
    const supabase = getSupabaseAdmin();

    // 验证token并获取用户
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase token verification failed:', error);
      return null;
    }

    // 从users表获取完整的用户信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.warn('User data not found, using auth user:', userError);
      // 如果users表中没有数据,返回auth user的基本信息
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        avatar: user.user_metadata?.avatar_url,
        region: 'international',
      };
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      subscription_plan: userData.subscription_plan || 'free',
      subscription_status: userData.subscription_status || 'active',
      region: userData.region || 'international',
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    };
  } catch (error) {
    console.error('Error verifying Supabase token:', error);
    return null;
  }
}

/**
 * 创建或更新用户记录
 */
export async function upsertUser(user: {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}): Promise<SupabaseUser | null> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.name,
        avatar_url: user.avatar,
        subscription_plan: 'free',
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertUser:', error);
    return null;
  }
}

/**
 * 邮箱密码注册
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; user?: SupabaseUser; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        }
      }
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Registration failed'
      };
    }

    // 创建用户记录
    const userData = await upsertUser({
      id: data.user.id,
      email: data.user.email,
      name: name || data.user.email?.split('@')[0],
    });

    return {
      success: true,
      user: userData || {
        id: data.user.id,
        email: data.user.email,
        name: name || data.user.email?.split('@')[0],
        region: 'international',
      }
    };
  } catch (error: any) {
    console.error('Error in signUpWithEmail:', error);
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
}

/**
 * 邮箱密码登录
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; user?: SupabaseUser; session?: string; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'Sign in failed'
      };
    }

    // 确保用户记录存在
    const userData = await upsertUser({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
      avatar: data.user.user_metadata?.avatar_url,
    });

    return {
      success: true,
      user: userData || {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        region: 'international',
      },
      session: data.session.access_token,
    };
  } catch (error: any) {
    console.error('Error in signInWithEmail:', error);
    return {
      success: false,
      error: error.message || 'Sign in failed'
    };
  }
}

/**
 * Google OAuth登录
 */
export async function signInWithGoogle(
  accessToken: string,
  idToken: string
): Promise<{ success: boolean; user?: SupabaseUser; session?: string; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      access_token: accessToken,
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'Google sign in failed'
      };
    }

    // 创建或更新用户记录
    const userData = await upsertUser({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
      avatar: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
    });

    return {
      success: true,
      user: userData || {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        avatar: data.user.user_metadata?.avatar_url,
        region: 'international',
      },
      session: data.session.access_token,
    };
  } catch (error: any) {
    console.error('Error in signInWithGoogle:', error);
    return {
      success: false,
      error: error.message || 'Google sign in failed'
    };
  }
}

/**
 * 获取OAuth授权URL
 */
export function getGoogleAuthUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/google`;

  return `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}&skip_http_redirect=true`;
}

/**
 * 登出
 */
export async function signOut(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error signing out:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in signOut:', error);
    return {
      success: false,
      error: error.message || 'Sign out failed'
    };
  }
}
