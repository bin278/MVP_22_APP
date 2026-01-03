import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // CloudBase Node.js SDK不支持直接用户注册
  // 用户注册需要通过前端SDK完成
  return NextResponse.json(
    {
      error: '注册功能需要通过前端界面完成',
      message: '请访问注册页面，使用前端SDK进行注册'
    },
    { status: 400 }
  );

  // 如果将来实现云函数注册，可以取消注释下面的代码
  /*
  try {
    const { email, password, full_name, username } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码是必需的' },
        { status: 400 }
      );
    }

    const result = await signUp(email, password, {
      name: full_name,
      username: username,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      user: result.user,
      message: '注册成功，请检查邮箱进行验证'
    });
  } catch (error) {
    console.error('注册API错误:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
  */
}
