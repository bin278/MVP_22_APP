import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // CloudBase Node.js SDK的管理接口不支持发送密码重置邮件
  // 密码重置需要通过前端SDK完成
  return NextResponse.json(
    {
      error: '密码重置功能需要通过前端界面完成',
      message: '请访问忘记密码页面，使用前端SDK发送重置邮件'
    },
    { status: 400 }
  );

  // 如果将来实现云函数密码重置，可以取消注释下面的代码
  /*
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '邮箱是必需的' },
        { status: 400 }
      );
    }

    const result = await sendPasswordResetEmail(email);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: '密码重置邮件已发送，请检查邮箱'
    });
  } catch (error) {
    console.error('密码重置API错误:', error);
    return NextResponse.json(
      { error: '密码重置失败，请稍后重试' },
      { status: 500 }
    );
  }
  */
}
