import { NextRequest, NextResponse } from 'next/server';
import { cloudbaseSignInWithWechat } from '@/lib/auth/cloudbase-auth';

// 检查是否为中国区域
function isChinaRegion(): boolean {
  const deploymentRegion = process.env.DEPLOYMENT_REGION || 'cn';
  return deploymentRegion.toLowerCase() === 'cn';
}

export async function POST(request: NextRequest) {
  // 仅在中国区域启用微信登录
  if (!isChinaRegion()) {
    return NextResponse.json(
      { error: "WeChat login is only available in China region" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // 获取环境变量
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      console.error("[WeChat Auth] Missing WECHAT_APP_ID or WECHAT_APP_SECRET");
      return NextResponse.json(
        { error: "WeChat login is not configured" },
        { status: 500 }
      );
    }

    // 1. 使用授权码换取 access_token 和 openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;

    console.log(`[WeChat Auth] Exchanging code for token...`);

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.errcode) {
      console.error('[WeChat Auth] Token exchange failed:', tokenData);
      return NextResponse.json(
        { error: `WeChat API error: ${tokenData.errmsg}` },
        { status: 400 }
      );
    }

    const { access_token, openid, unionid } = tokenData;

    if (!access_token || !openid) {
      console.error('[WeChat Auth] Invalid token response:', tokenData);
      return NextResponse.json(
        { error: "Invalid WeChat response" },
        { status: 400 }
      );
    }

    // 2. 获取微信用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;

    console.log(`[WeChat Auth] Fetching user info for openid: ${openid}`);

    const userInfoResponse = await fetch(userInfoUrl);
    const userInfo = await userInfoResponse.json();

    if (userInfo.errcode) {
      console.error('[WeChat Auth] User info fetch failed:', userInfo);
      return NextResponse.json(
        { error: `WeChat API error: ${userInfo.errmsg}` },
        { status: 400 }
      );
    }

    const nickname = userInfo.nickname || null;
    const avatar = userInfo.headimgurl || null;

    console.log(`[WeChat Auth] User info retrieved: ${nickname}, avatar: ${avatar ? 'yes' : 'no'}`);

    // 3. 调用 CloudBase 认证服务
    console.log(`[WeChat Auth] Calling CloudBase sign in...`);

    const result = await cloudbaseSignInWithWechat({
      openid,
      unionid: unionid || null,
      nickname,
      avatar,
    });

    if (!result.success) {
      console.error('[WeChat Auth] CloudBase sign in failed:', result.error);
      return NextResponse.json(
        { error: result.error || "Authentication failed" },
        { status: 500 }
      );
    }

    console.log(`[WeChat Auth] Authentication successful for user: ${result.user.email}`);

    // 4. 创建响应 - 转换用户对象格式以匹配前端期望
    const userForFrontend = {
      id: result.user._id, // 将 _id 转换为 id
      email: result.user.email,
      name: result.user.name,
      avatar: result.user.avatar,
      subscription_plan: result.user.subscriptionTier === 'pro' ? 'pro' : 'free'
    };

    const response = NextResponse.json({
      success: true,
      user: userForFrontend,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenMeta: result.tokenMeta,
    });

    // 5. 设置认证 Cookie
    response.cookies.set("auth-token", result.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: result.tokenMeta.accessTokenExpiresIn,
      path: "/",
    });

    response.cookies.set("refresh-token", result.refreshToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: result.tokenMeta.refreshTokenExpiresIn,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error('[WeChat Auth] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}