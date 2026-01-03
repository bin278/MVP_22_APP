import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // CloudBase Node.js SDK不支持直接用户登录
  // 用户登录需要通过前端SDK完成
  return NextResponse.json(
    {
      error: '登录功能需要通过前端界面完成',
      message: '请访问登录页面，使用前端SDK进行登录'
    },
    { status: 400 }
  );

  // 如果将来实现云函数登录，可以取消注释下面的代码
  /*
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码是必需的' },
        { status: 400 }
      );
    }

    const result = await signIn(email, password);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: result.user,
      session: result.session,
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录API错误:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
  */
}
