import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const deploymentRegion = process.env.DEPLOYMENT_REGION || 'cn';
  const appId = process.env.WECHAT_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return NextResponse.json({
    deploymentRegion,
    isChina: deploymentRegion.toLowerCase() === 'cn',
    wechatConfigured: !!(appId && appSecret),
    appId: appId ? 'configured' : 'missing',
    appSecret: appSecret ? 'configured' : 'missing',
    appUrl,
    nodeEnv: process.env.NODE_ENV,
  });
}
