"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { initializeCloudBase, getAuth } from './cloudbase-frontend'
import {
  signUpWithEmail,
  signInWithEmail,
  signOut as signOutFromCloudBase,
  resetPassword,
  signInWithWechat,
  setupAuthStateListener
} from './cloudbase-auth-frontend'
import {
  initAuthStateManager,
  getUser as getAuthUser,
  isAuthenticated,
  clearAuthState,
  getStoredAuthState
} from './auth/auth-state-manager'
// CloudBase认证API调用函数
async function apiCall(endpoint: string, data?: any) {
  const response = await fetch(`/api/auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'API调用失败');
  }

  return result;
}

// CloudBase用户类型
interface CloudBaseUser {
  uid: string;
  email?: string;
  username?: string;
  name?: string;
  avatar?: string;
  createTime?: string;
  updateTime?: string;
}

interface CloudBaseSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpire: number;
  refreshTokenExpire: number;
}

// CloudBase类型定义（用于类型兼容）
interface CloudBaseUser {
  uid: string;
  email?: string;
  username?: string;
  name?: string;
  avatar?: string;
  createTime?: string;
  updateTime?: string;
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
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

// 获取认证提供商
function getAuthProvider(): 'supabase' | 'cloudbase' | 'mock' {
  // 在服务器端可以直接访问环境变量
  if (typeof window === 'undefined') {
    const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'cloudbase';
    return provider as 'supabase' | 'cloudbase' | 'mock';
  }

  // 在客户端，CloudBase环境默认使用cloudbase
  // 如果需要动态获取，可以通过API调用
  return 'cloudbase';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CloudBaseUser | null>(null)
  const [session, setSession] = useState<CloudBaseSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // 初始化认证状态管理器
    if (mounted) {
      initAuthStateManager();

      // 使用新的auth-state-manager恢复认证状态
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
      if (unsubscribe) {
        unsubscribe();
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
      return { success: true, user: result.user };
    } else {
      console.log('signUp returning error:', result.error);
      return { success: false, error: result.error };
    }
  }

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmail(email, password);
    if (result.success && result.user) {
      setUser(result.user);

      // 处理不同的响应格式（兼容微信登录和邮箱登录）
      let sessionData = result.session;
      if (!sessionData && result.accessToken) {
        // 邮箱登录API的响应格式
        sessionData = {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          accessTokenExpire: Date.now() + (result.tokenMeta?.accessTokenExpiresIn * 1000 || 3600000),
          refreshTokenExpire: Date.now() + (result.tokenMeta?.refreshTokenExpiresIn * 1000 || 2592000000)
        };
      }

      setSession(sessionData);

      // 使用新的认证状态管理器保存认证状态
      if (sessionData?.accessToken) {
        const { saveAuthState } = await import('./auth/auth-state-manager');
        await saveAuthState(
          sessionData.accessToken,
          sessionData.refreshToken || '',
          result.user,
          result.tokenMeta || { accessTokenExpiresIn: 3600, refreshTokenExpiresIn: 2592000 }
        );
        console.log('用户认证状态已保存到localStorage');
      }

      return { error: null };
    } else {
      return { error: { message: result.error } };
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
    const result = await resetPassword(email);
    if (result.success) {
      return { error: null };
    } else {
      return { error: { message: result.error } };
    }
  }


  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
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