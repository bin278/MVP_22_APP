// 带认证的fetch函数
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // 获取认证token
  let token: string | null = null;
  try {
    if (typeof window !== 'undefined') {
      // 优先从新的 auth-state-manager 获取
      const authStateKey = 'app-auth-state';
      const authStateData = localStorage.getItem(authStateKey);

      if (authStateData) {
        const authState = JSON.parse(authStateData);
        token = authState?.accessToken || null;
      }

      // 如果新格式没有，尝试从旧的 cloudbase_session 获取（向后兼容）
      if (!token) {
        const sessionData = localStorage.getItem('cloudbase_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          token = session?.accessToken || session?.token || null;
        }
      }

      console.log('[fetchWithAuth] Token found:', !!token);
    }
  } catch (error) {
    console.warn('[fetchWithAuth] 获取token失败:', error);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 如果有token，添加到Authorization头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('[fetchWithAuth] No token available');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 如果返回401，尝试刷新token
  if (response.status === 401) {
    console.warn('[fetchWithAuth] Received 401, token may be expired');
    try {
      // 清除本地token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cloudbase_token');
        localStorage.removeItem('app-auth-state');
      }
    } catch (refreshError) {
      console.error('[fetchWithAuth] 清除token失败:', refreshError);
    }
  }

  return response;
}
