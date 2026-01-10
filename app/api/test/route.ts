/**
 * 测试 API 端点
 * 用于验证路由是否正常工作
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log('🧪 [Test API] Request received');
  console.log('🧪 [Test API] Method:', request.method);
  console.log('🧪 [Test API] URL:', request.url);
  console.log('🧪 [Test API] Headers:', Object.fromEntries(request.headers.entries()));

  try {
    const body = await request.text();
    console.log('🧪 [Test API] Body length:', body.length);
    console.log('🧪 [Test API] Body preview:', body.substring(0, 200));
  } catch (error) {
    console.log('🧪 [Test API] Error reading body:', error);
  }

  return NextResponse.json({
    success: true,
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  console.log('🧪 [Test API] GET request received');
  return NextResponse.json({
    success: true,
    message: 'GET test endpoint working!',
    timestamp: new Date().toISOString(),
  });
}
