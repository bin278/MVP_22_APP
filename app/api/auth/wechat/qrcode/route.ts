import { NextRequest, NextResponse } from 'next/server';

// 检查是否为中国区域
function isChinaRegion(): boolean {
  const deploymentRegion = process.env.DEPLOYMENT_REGION || 'cn';
  return deploymentRegion.toLowerCase() === 'cn';
}

export async function GET(request: NextRequest) {
  // 仅在中国区域启用微信登录
  if (!isChinaRegion()) {
    return NextResponse.json(
      { error: "WeChat login is only available in China region" },
      { status: 404 }
    );
  }

  try {
    // 获取环境变量
    const appId = process.env.WECHAT_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    // 必须配置微信应用信息
    if (!appId || !appSecret) {
      console.error("[WeChat Auth] Missing WECHAT_APP_ID or WECHAT_APP_SECRET");
      return NextResponse.json(
        { error: "WeChat login is not configured" },
        { status: 500 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const next = searchParams.get('next') || '/';

    // 1. 构建回调地址
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || 'http://localhost:3000';
    const normalizedBaseUrl = baseUrl.replace(/\/$/, ''); // 移除末尾的斜杠
    const redirectUri = encodeURIComponent(`${normalizedBaseUrl}/auth/callback`);

    // 2. 使用 base64 编码保存跳转路径
    const stateData = JSON.stringify({ next, timestamp: Date.now() });
    const state = Buffer.from(stateData).toString("base64");

    // 3. 生成微信 OAuth URL
    const qrcodeUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${encodeURIComponent(state)}#wechat_redirect`;

    console.log(`[WeChat QRCode] Generated QRCode URL for next: ${next}`);
    console.log(`[WeChat QRCode] Base URL: ${baseUrl}`);
    console.log(`[WeChat QRCode] Redirect URI: ${decodeURIComponent(redirectUri)}`);

    return NextResponse.json({
      supported: true,
      qrcodeUrl,
      redirectUri: decodeURIComponent(redirectUri),
      state,
      config: {
        environment: process.env.NODE_ENV || 'development',
        baseUrl: normalizedBaseUrl,
        redirectUri: decodeURIComponent(redirectUri),
        appId: appId ? 'configured' : 'missing',
        appSecret: appSecret ? 'configured' : 'missing'
      }
    });

  } catch (error) {
    console.error('[WeChat QRCode] Error generating QRCode:', error);
    return NextResponse.json(
      { error: "Failed to generate WeChat QRCode" },
      { status: 500 }
    );
  }
}