'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

// 检查是否为中国区域
function isChinaRegion(): boolean {
  if (typeof window !== 'undefined') {
    // 从localStorage或其他地方获取区域信息
    return true; // 默认为中国区域
  }
  return true;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在处理认证...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 获取URL参数
        const code = searchParams.get('code');
        const stateParam = searchParams.get('state');

        if (!code) {
          throw new Error('缺少授权码参数');
        }

        // 中国区域：处理微信 OAuth 回调
        if (isChinaRegion()) {
          // 解析 state 参数获取跳转路径
          let nextTarget = '/';
          if (stateParam && typeof window !== 'undefined') {
            try {
              // 在客户端使用 btoa/atob 替代 Buffer
              const stateData = JSON.parse(
                atob(stateParam)
              );
              nextTarget = stateData.next || '/';
            } catch (e) {
              console.warn('[WeChat Callback] Failed to parse state:', e);
              // 如果解析失败，使用默认路径
            }
          }

          console.log(`[WeChat Callback] Processing callback, next target: ${nextTarget}`);

          // 调用后端 API 完成微信登录
          const response = await fetch('/api/auth/wechat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state: stateParam }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || '认证失败');
          }

          if (data.success) {
            setMessage('登录成功，正在跳转...');
            setStatus('success');

            // 保存认证状态到 localStorage
            const { saveAuthState } = await import('@/lib/auth/auth-state-manager');
            await saveAuthState(
              data.accessToken,
              data.refreshToken,
              data.user,
              data.tokenMeta
            );

            console.log(`[WeChat Callback] Authentication successful, redirecting to: ${nextTarget}`);

            // 短暂延迟后跳转
            setTimeout(() => {
              router.replace(nextTarget);
            }, 1500);

          } else {
            throw new Error(data.error || '认证失败');
          }

        } else {
          throw new Error('不支持的区域');
        }

      } catch (error) {
        console.error('[Auth Callback] Error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : '认证过程中发生错误');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">正在验证身份</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">认证成功</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">认证失败</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              返回登录页面
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">正在加载</h2>
          <p className="text-gray-600">请稍候...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}