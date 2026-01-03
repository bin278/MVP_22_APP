'use client';

import { useEffect } from 'react';
import { initializeCloudBase } from '@/lib/cloudbase-frontend';

export function CloudBaseInitializer() {
  useEffect(() => {
    // 在客户端初始化CloudBase
    initializeCloudBase();
  }, []);

  return null; // 这个组件不渲染任何内容
}




