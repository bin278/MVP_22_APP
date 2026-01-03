import { NextRequest, NextResponse } from 'next/server';

/**
 * 微信配置检查接口
 * 用于在生产环境中检查微信登录相关的环境变量配置
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[WeChat Config] 开始检查微信配置');

    const config = {
      // 环境变量状态
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || 'cn'
      },

      // 应用配置
      app: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || null,
        NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || null
      },

      // 微信配置
      wechat: {
        WECHAT_APP_ID: process.env.WECHAT_APP_ID ? '已设置' : null,
        WECHAT_APP_SECRET: process.env.WECHAT_APP_SECRET ? '已设置' : null,
        NEXT_PUBLIC_WECHAT_APP_ID: process.env.WECHAT_APP_ID || null // 统一使用WECHAT_APP_ID
      },

      // 配置状态
      status: {
        appUrlConfigured: !!process.env.NEXT_PUBLIC_APP_URL,
        wechatAppIdConfigured: !!process.env.WECHAT_APP_ID,
        wechatAppSecretConfigured: !!process.env.WECHAT_APP_SECRET,
        allConfigured: !!(process.env.NEXT_PUBLIC_APP_URL && process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET)
      },

      // 预期的回调URL
      expectedCallbackUrl: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/auth/callback`
        : 'NEXT_PUBLIC_APP_URL未设置，无法生成回调URL',

      timestamp: new Date().toISOString()
    };

    console.log('[WeChat Config] 配置检查完成:', {
      appUrlConfigured: config.status.appUrlConfigured,
      wechatConfigured: config.status.wechatAppIdConfigured && config.status.wechatAppSecretConfigured,
      allConfigured: config.status.allConfigured
    });

    return NextResponse.json({
      success: true,
      message: '微信配置检查完成',
      config,
      recommendations: getRecommendations(config)
    });

  } catch (error) {
    console.error('[WeChat Config] 检查过程中出错:', error);
    return NextResponse.json(
      {
        success: false,
        error: `微信配置检查失败: ${error.message}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function getRecommendations(config: any) {
  const recommendations = [];

  if (!config.status.appUrlConfigured) {
    recommendations.push({
      issue: 'NEXT_PUBLIC_APP_URL 未设置',
      solution: '在腾讯云 CloudBase 控制台的环境变量中设置 NEXT_PUBLIC_APP_URL=https://你的域名.cloudbaseapp.cn',
      impact: '微信回调URL将指向 localhost:3000，登录无法正常工作'
    });
  } else if (config.app.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    recommendations.push({
      issue: 'NEXT_PUBLIC_APP_URL 指向本地开发环境',
      solution: '将 NEXT_PUBLIC_APP_URL 更改为生产域名',
      impact: '微信登录将在生产环境中失败'
    });
  }

  if (!config.status.wechatAppIdConfigured) {
    recommendations.push({
      issue: 'WECHAT_APP_ID 未设置',
      solution: '在腾讯云 CloudBase 控制台设置 WECHAT_APP_ID=你的微信应用ID',
      impact: '无法生成微信登录二维码'
    });
  }

  if (!config.status.wechatAppSecretConfigured) {
    recommendations.push({
      issue: 'WECHAT_APP_SECRET 未设置',
      solution: '在腾讯云 CloudBase 控制台设置 WECHAT_APP_SECRET=你的微信应用密钥',
      impact: '无法完成微信登录流程'
    });
  }

  return recommendations;
}
