import { NextResponse } from 'next/server';

/**
 * 获取前端需要的公共环境变量
 * 在CloudBase部署时，前端无法直接访问NEXT_PUBLIC_开头的环境变量
 * 需要通过API接口获取
 */
export async function GET() {
  try {
    // 返回前端安全访问的环境变量
    const publicEnv = {
      // 腾讯云配置
      TENCENT_CLOUD_ENV_ID: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || '',
      WECHAT_CLOUDBASE_ID: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID || '',

      // 应用配置
      APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
      AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'cloudbase',

      // 微信配置
      WECHAT_APP_ID: process.env.NEXT_PUBLIC_WECHAT_APP_ID || '',

      // Supabase配置（如果使用）
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

      // Stripe配置（如果使用）
      STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',

      // 部署环境信息
      DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || 'cn',
      NODE_ENV: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json({
      success: true,
      env: publicEnv,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Public Env API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取环境变量失败' },
      { status: 500 }
    );
  }
}
