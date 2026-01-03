"use client";

import { useEffect } from 'react';

interface BodyWithCleanupProps {
  children: React.ReactNode;
  className: string;
}

// 客户端组件：清理浏览器扩展添加的属性，避免hydration错误
export function BodyWithCleanup({ children, className }: BodyWithCleanupProps) {
  useEffect(() => {
    // 清理AI翻译扩展添加的属性
    const body = document.body;
    if (body) {
      body.removeAttribute('ai-translate-version');
      body.removeAttribute('ai-translate-id');
      body.removeAttribute('ai-translate-oem');
    }
  }, []);

  return (
    <body className={className} suppressHydrationWarning>
      {children}
    </body>
  );
}
