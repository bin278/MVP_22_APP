import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  console.log('🧪 Test endpoint called')
  return NextResponse.json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  console.log('🧪 Test POST endpoint called')
  try {
    const body = await request.json()
    console.log('🧪 Received body:', body)

    return NextResponse.json({
      success: true,
      message: 'Test POST endpoint working',
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🧪 Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test endpoint failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}







