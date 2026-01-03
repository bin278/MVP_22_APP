import { NextResponse } from 'next/server';

// 处理favicon.ico请求，返回SVG图标
export async function GET() {
  try {
    // 返回SVG图标作为favicon
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>`;

    return new NextResponse(svgIcon, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Favicon error:', error);
    return new NextResponse(null, { status: 500 });
  }
}








