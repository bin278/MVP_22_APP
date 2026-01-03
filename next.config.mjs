/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // CloudBase 部署配置或 Capacitor 静态导出
  output: process.env.CLOUDBASE_BUILD ? 'standalone' : (process.env.CAPACITOR_BUILD ? 'export' : undefined),
  // CloudBase 环境变量配置
  env: {
    // Supabase 兼容配置
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    // Stripe 配置
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

    // CloudBase 腾讯云配置
    NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID,
    NEXT_PUBLIC_WECHAT_CLOUDBASE_ID: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID,

    // 微信登录配置
    NEXT_PUBLIC_WECHAT_APP_ID: process.env.WECHAT_APP_ID,

    // 支付相关配置
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

    // 部署环境配置
    DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || 'cn',
    AUTH_PROVIDER: process.env.AUTH_PROVIDER || 'cloudbase',
    DATABASE_PROVIDER: process.env.DATABASE_PROVIDER || 'cloudbase',

    // CloudBase 构建标识
    CLOUDBASE_BUILD: process.env.CLOUDBASE_BUILD || 'false',
  },
  // CloudBase 静态资源优化
  assetPrefix: process.env.CLOUDBASE_BUILD ? process.env.NEXT_PUBLIC_APP_URL : '',
  // CloudBase 域名重写
  async rewrites() {
    if (process.env.CLOUDBASE_BUILD) {
      return [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ];
    }
    return [];
  },
  // CloudBase 头配置
  async headers() {
    if (process.env.CLOUDBASE_BUILD) {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
          ],
        },
      ];
    }
    return [];
  },
}

export default nextConfig
