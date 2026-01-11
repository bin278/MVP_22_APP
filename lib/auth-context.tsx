"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  signUpWithEmail,
  signInWithEmail,
  signOut as signOutFromCloudBase,
  resetPassword as resetPasswordFromCloudBase,
  setupAuthStateListener
} from './cloudbase-auth-frontend'
import {
  initAuthStateManager,
  getUser as getAuthUser,
  isAuthenticated,
  clearAuthState,
  getStoredAuthState
} from './auth/auth-state-manager'

// CloudBase用户类型
interface CloudBaseUser {
  uid: string;
  email?: string;
  username?: string;
  name?: string;
  avatar?: string;
  createTime?: string;
  updateTime?: string;
  subscription_plan?: string;
  subscriptionTier?: string;
}

interface CloudBaseSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpire: number;
  refreshTokenExpire: number;
}

interface AuthContextType {
  user: CloudBaseUser | null
  session: CloudBaseSession | null
  loading: boolean
  signUp: (email: string, password: string, userData?: { full_name?: string; username?: string }) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle?: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CloudBaseUser | null>(null)
  const [session, setSession] = useState<CloudBaseSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let supabaseAuthUnsubscribe: (() => void) | null = null

    // 检测是否使用 Supabase
    const isSupabase = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase'

    // 初始化认证状态管理器
    if (mounted) {
      initAuthStateManager();

      // 如果是 Supabase 模式，设置 Supabase auth 监听器
      if (isSupabase) {
        console.log('[Auth Context] 检测到 Supabase 模式，设置 Supabase auth 监听器')

        import('@supabase/supabase-js').then(({ createClient }) => {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey)

            // 监听 Supabase auth state 变化
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
              console.log('[Auth Context] Supabase auth state 变化:', event, session?.user?.email)

              if (!mounted) return

              if (session?.user) {
                // 用户已登录
                const cloudBaseUser = {
                  uid: session.user.id,
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.full_name || session.user.email,
                  avatar: session.user.user_metadata?.avatar_url,
                  subscription_plan: session.user.user_metadata?.subscription_plan,
                  subscriptionTier: session.user.user_metadata?.subscription_plan,
                }

                const sessionData = {
                  accessToken: session.access_token,
                  refreshToken: session.refresh_token,
                  accessTokenExpire: Date.now() + (3600 * 1000),
                  refreshTokenExpire: Date.now() + (2592000 * 1000)
                }

                console.log('[Auth Context] Supabase 用户已登录:', cloudBaseUser.email)
                setUser(cloudBaseUser)
                setSession(sessionData)

                // 保存认证状态到 localStorage
                import('./auth/auth-state-manager').then(({ saveAuthState }) => {
                  saveAuthState(
                    sessionData.accessToken,
                    sessionData.refreshToken,
                    cloudBaseUser,
                    { accessTokenExpiresIn: 3600, refreshTokenExpiresIn: 2592000 }
                  )
                })
              } else {
                // 用户未登录
                console.log('[Auth Context] Supabase 用户未登录')
                setUser(null)
                setSession(null)
                clearAuthState()
              }

              setLoading(false)
            })

            supabaseAuthUnsubscribe = () => {
              subscription.unsubscribe()
            }
          }
        }).catch(err => {
          console.error('[Auth Context] 初始化 Supabase 监听器失败:', err)
          setLoading(false)
        })
      } else {
        // CloudBase 模式：使用原有的认证状态恢复逻辑
        try {
          const authUser = getAuthUser();
          const isAuth = isAuthenticated();

          if (authUser && isAuth) {
            console.log('[Auth Context] 从localStorage恢复用户认证状态');
            // 转换用户数据格式，包含订阅信息
            const cloudBaseUser = {
              uid: authUser.id,
              email: authUser.email,
              username: authUser.name || authUser.email,
              name: authUser.name,
              avatar: authUser.avatar,
              subscription_plan: authUser.subscription_plan || authUser.subscriptionTier,
              subscriptionTier: authUser.subscription_plan || authUser.subscriptionTier
            };

            // 获取真正的token
            const authState = getStoredAuthState();
            setUser(cloudBaseUser);

            if (authState) {
              setSession({
                accessToken: authState.accessToken,
                refreshToken: authState.refreshToken,
                accessTokenExpire: Date.now() + (authState.tokenMeta.accessTokenExpiresIn * 1000),
                refreshTokenExpire: Date.now() + (authState.tokenMeta.refreshTokenExpiresIn * 1000)
              });
            } else {
              setSession(null);
            }
          } else {
            setUser(null);
            setSession(null);
          }

          setLoading(false);
        } catch (error) {
          console.error('[Auth Context] 初始化认证状态失败:', error);
          if (mounted) {
            setUser(null);
            setSession(null);
            setLoading(false);
          }
        }
      }
    }

    // 设置认证状态监听器（CloudBase模式下返回null）
    const unsubscribe = setupAuthStateListener((user) => {
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    });

    // 监听auth-state-manager的变化
    const handleAuthStateChanged = () => {
      if (!mounted) return;

      const authUser = getAuthUser();
      const isAuth = isAuthenticated();
      const authState = getStoredAuthState();

      if (authUser && isAuth && authState) {
        console.log('[Auth Context] 认证状态更新：用户已登录');
        // 转换用户数据格式，包含订阅信息
        const cloudBaseUser = {
          uid: authUser.id,
          email: authUser.email,
          username: authUser.name || authUser.email,
          name: authUser.name,
          avatar: authUser.avatar,
          subscription_plan: authUser.subscription_plan || authUser.subscriptionTier,
          subscriptionTier: authUser.subscription_plan || authUser.subscriptionTier
        };

        setUser(cloudBaseUser);
        setSession({
          accessToken: authState.accessToken,
          refreshToken: authState.refreshToken,
          accessTokenExpire: Date.now() + (authState.tokenMeta.accessTokenExpiresIn * 1000),
          refreshTokenExpire: Date.now() + (authState.tokenMeta.refreshTokenExpiresIn * 1000)
        });
      } else {
        console.log('[Auth Context] 认证状态更新：用户未登录');
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    };

    // 添加事件监听器
    window.addEventListener('auth-state-changed', handleAuthStateChanged);

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      if (supabaseAuthUnsubscribe) {
        supabaseAuthUnsubscribe();
      }
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    }
  }, [])


  const signUp = async (email: string, password: string, userData?: { full_name?: string; username?: string }) => {
    console.log('auth-context signUp called with:', { email, userData });
    const result = await signUpWithEmail(email, password, userData);
    console.log('signUpWithEmail result:', result);
    if (result.success && result.user) {
      setUser(result.user);
      return { error: null };
    } else {
      console.log('signUp returning error:', result.error);
      return { error: result.error };
    }
  }

  const signIn = async (email: string, password: string) => {
    // 检测当前版本
    const isInternational = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase';

    if (isInternational) {
      // 国际版: 使用Supabase
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          return { error: { message: 'Supabase未配置' } };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error: { message: error.message } };
        }

        // 转换为统一格式
        const user = {
          uid: data.user.id,
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || data.user.email,
          avatar: data.user.user_metadata?.avatar_url,
        };

        const sessionData = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          accessTokenExpire: Date.now() + (3600 * 1000),
          refreshTokenExpire: Date.now() + (2592000 * 1000)
        };

        setUser(user);
        setSession(sessionData);

        // 保存认证状态
        import('./auth/auth-state-manager').then(({ saveAuthState }) => {
          saveAuthState(
            sessionData.accessToken,
            sessionData.refreshToken,
            user,
            { accessTokenExpiresIn: 3600, refreshTokenExpiresIn: 2592000 }
          );
        });
        console.log('用户认证状态已保存到localStorage');

        return { error: null };
      } catch (error: any) {
        console.error('Supabase登录失败:', error);
        return { error: { message: error.message || '登录失败' } };
      }
    } else {
      // 国内版: 使用CloudBase
      const result = await signInWithEmail(email, password);

      if (result.success && result.user) {
        setUser(result.user);

        // 处理不同的响应格式（兼容微信登录和邮箱登录）
        let sessionData: CloudBaseSession | null = null;
        if ('accessToken' in result && result.accessToken) {
          // 邮箱登录API的响应格式
          sessionData = {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken || '',
            accessTokenExpire: Date.now() + (result.tokenMeta?.accessTokenExpiresIn * 1000 || 3600000),
            refreshTokenExpire: Date.now() + (result.tokenMeta?.refreshTokenExpiresIn * 1000 || 2592000000)
          };
        }

        setSession(sessionData);

        // 使用新的认证状态管理器保存认证状态
        if (sessionData?.accessToken) {
          import('./auth/auth-state-manager').then(({ saveAuthState }) => {
            saveAuthState(
              sessionData!.accessToken,
              sessionData!.refreshToken || '',
              result.user,
              result.tokenMeta || { accessTokenExpiresIn: 3600, refreshTokenExpiresIn: 2592000 }
            );
          });
          console.log('用户认证状态已保存到localStorage');
        }

        return { error: null };
      } else {
        return { error: { message: result.error } };
      }
    }
  }

  const signOut = async () => {
    const result = await signOutFromCloudBase();
    if (result.success) {
      setUser(null);
      setSession(null);

      // 使用新的认证状态管理器清除所有认证状态
      clearAuthState();
      console.log('用户认证状态已清除');
    }
  }

  const resetPassword = async (email: string) => {
    const result = await resetPasswordFromCloudBase(email);
    if (result.success) {
      return { error: null };
    } else {
      return { error: { message: result.error } };
    }
  }

  // Google OAuth登录 (仅国际版Supabase)
  const signInWithGoogle = async () => {
    try {
      // 检查是否配置了Supabase
      const isSupabase = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase' ||
                        (typeof window !== 'undefined' && window.location.hostname.includes('localhost'));

      if (!isSupabase) {
        console.warn('Google登录仅在国际版(Supabase)中可用');
        return { error: { message: 'Google登录仅在国际版中可用' } };
      }

      // 动态导入Supabase客户端
      const { createClient } = await import('@supabase/supabase-js');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return { error: { message: 'Supabase未配置' } };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log('🔄 开始Google OAuth登录流程...');

      // 使用Supabase的signInWithOAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/google-callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ Google OAuth错误:', error);
        return { error: { message: error.message } };
      }

      // Supabase会自动处理重定向
      console.log('✅ 重定向到Google授权页面...');
      return { error: null };

    } catch (error: any) {
      console.error('❌ Google登录失败:', error);
      return { error: { message: error.message || 'Google登录失败' } };
    }
  }


  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}