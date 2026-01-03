import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    appId: process.env.ALIPAY_APP_ID,
    hasPrivateKey: !!process.env.ALIPAY_PRIVATE_KEY,
    hasPublicKey: !!process.env.ALIPAY_PUBLIC_KEY,
    gatewayUrl: process.env.ALIPAY_GATEWAY_URL || 'https://openapi.alipay.com/gateway.do',
    environment: process.env.ALIPAY_APP_ID?.startsWith('9021') ? 'sandbox' : 'production',
    gatewayEnvironment: (process.env.ALIPAY_GATEWAY_URL || '').includes('sandbox') ? 'sandbox' : 'production'
  };

  return NextResponse.json({
    config,
    analysis: {
      appIdValid: config.appId && (config.appId.startsWith('9021') || config.appId.length === 16),
      keysPresent: config.hasPrivateKey && config.hasPublicKey,
      environmentMatch: config.environment === config.gatewayEnvironment || (!config.gatewayUrl.includes('sandbox') && config.environment === 'production'),
      ready: config.appId && config.hasPrivateKey && config.hasPublicKey
    }
  });
}