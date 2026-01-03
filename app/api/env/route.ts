import { NextResponse } from 'next/server';

/**
 * 获取前端可访问的环境变量
 * 注意：只返回安全的、非敏感的环境变量
 */
export async function GET() {
  try {
    console.log('[Env API] 开始处理请求');

    // 只返回前端需要但无法直接访问的环境变量
    const publicEnv = {
      // 应用配置
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID,
      WECHAT_APP_ID: process.env.WECHAT_APP_ID, // 微信登录需要的前端变量

      // Supabase 配置
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

      // Stripe 配置
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

      // 部署环境信息
      DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || 'cn',
      NODE_ENV: process.env.NODE_ENV || 'development',

      // 功能开关（如果有的话）
      // ENABLE_XXX_FEATURE: process.env.ENABLE_XXX_FEATURE === 'true',
    };

    console.log('[Env API] 环境变量读取完成:', {
      has_APP_URL: !!publicEnv.NEXT_PUBLIC_APP_URL,
      has_TENCENT_ENV_ID: !!publicEnv.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID,
      has_WECHAT_APP_ID: !!publicEnv.WECHAT_APP_ID,
      has_SUPABASE_URL: !!publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      has_SUPABASE_KEY: !!publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      has_STRIPE_KEY: !!publicEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      DEPLOYMENT_REGION: publicEnv.DEPLOYMENT_REGION,
      NODE_ENV: publicEnv.NODE_ENV,
      appUrlValue: publicEnv.NEXT_PUBLIC_APP_URL || '未设置',
      wechatAppIdValue: publicEnv.WECHAT_APP_ID || '未设置',
      supabaseUrlValue: publicEnv.NEXT_PUBLIC_SUPABASE_URL ? '[已设置]' : '未设置',
      supabaseKeyValue: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[已设置]' : '未设置'
    });

    const response = {
      success: true,
      env: publicEnv,
      timestamp: new Date().toISOString()
    };

    console.log('[Env API] 返回成功响应');
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Env API] 处理请求时出错:', error);
    return NextResponse.json(
      {
        success: false,
        error: `获取环境变量失败: ${error.message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}