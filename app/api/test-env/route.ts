import { NextResponse } from 'next/server';

/**
 * 测试环境变量是否正确加载
 */
export async function GET() {
  return NextResponse.json({
    'process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID': process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID,
    'process.env.TENCENT_CLOUD_ENV_ID': process.env.TENCENT_CLOUD_ENV_ID,
    'has NEXT_PUBLIC_*': !!process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID,
    'value': process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || 'NOT_SET',
    'allEnvKeys': Object.keys(process.env).filter(k => k.includes('CLOUD')),
  });
}
