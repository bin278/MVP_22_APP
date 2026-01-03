// lib/auth/provider.ts
// 认证提供商配置

// 认证提供商类型
export type AuthProvider = 'supabase' | 'cloudbase';

// 获取认证提供商
export function getAuthProvider(): AuthProvider {
  const provider = process.env.AUTH_PROVIDER || 'cloudbase';
  return provider as AuthProvider;
}

// 获取公共环境中的认证提供商（客户端使用）
export function getPublicAuthProvider(): AuthProvider {
  if (typeof window !== 'undefined') {
    // 客户端：从环境变量或全局配置获取
    return (window as any).NEXT_PUBLIC_AUTH_PROVIDER || 'cloudbase';
  }
  return getAuthProvider();
}

// 设置认证提供商（用于动态切换）
export function setAuthProvider(provider: AuthProvider): void {
  if (typeof window !== 'undefined') {
    (window as any).NEXT_PUBLIC_AUTH_PROVIDER = provider;
  }
  // 服务端可以通过修改环境变量或配置来切换
  console.log(`🔄 认证提供商已切换到: ${provider}`);
}

export default {
  getAuthProvider,
  getPublicAuthProvider,
  setAuthProvider,
};
