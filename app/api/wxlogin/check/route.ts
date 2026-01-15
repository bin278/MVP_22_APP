import { NextRequest, NextResponse } from "next/server";
import { cloudbaseSignInWithWechat } from "@/lib/auth/cloudbase-auth";

// 检查是否为中国区域
function isChinaRegion(): boolean {
  const deploymentRegion = process.env.DEPLOYMENT_REGION || 'cn';
  return deploymentRegion.toLowerCase() === 'cn';
}

export async function POST(request: NextRequest) {
  // 仅在中国区域启用微信登录
  if (!isChinaRegion()) {
    return NextResponse.json(
      { success: false, error: "WX_MINI_LOGIN_DISABLED", message: "微信小程序登录仅在中国区域可用" },
      { status: 404 }
    );
  }

  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "INVALID_PARAMS", message: "code is required" },
        { status: 400 }
      );
    }

    // 获取小程序配置
    const appId = process.env.WX_MINI_APPID || process.env.WECHAT_APP_ID;
    const appSecret = process.env.WX_MINI_SECRET || process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      console.error("[wxlogin/check] Missing WX_MINI_APPID or WX_MINI_SECRET");
      return NextResponse.json(
        { success: false, error: "CONFIG_ERROR", message: "服务端配置错误" },
        { status: 500 }
      );
    }

    // 调用微信 jscode2session（消耗 code）
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
    const wxResponse = await fetch(wxUrl);
    const wxData = await wxResponse.json();

    if (wxData.errcode || !wxData.openid) {
      console.error("[wxlogin/check] jscode2session error:", wxData);
      return NextResponse.json(
        { success: false, error: "INVALID_CODE", message: wxData.errmsg || "code 无效" },
        { status: 401 }
      );
    }

    const { openid, unionid } = wxData;

    // 使用 CloudBase 进行微信登录
    const result = await cloudbaseSignInWithWechat({
      openid,
      unionid: unionid || null,
      nickname: null, // 小程序登录时暂时不传用户名
      avatar: null    // 小程序登录时暂时不传头像
    });

    if (!result.success) {
      console.error("[wxlogin/check] CloudBase sign in failed:", result.error);
      return NextResponse.json(
        { success: false, error: "SIGNIN_FAILED", message: result.error || "登录失败" },
        { status: 500 }
      );
    }

    const hasProfile = !!(result.user.name && result.user.avatar);
    const expiresIn = 7 * 24 * 60 * 60; // 7天

    console.log("[wxlogin/check] Success:", { openid, hasProfile });

    return NextResponse.json({
      success: true,
      exists: true,
      hasProfile,
      openid,
      token: result.accessToken,
      expiresIn,
      userName: result.user.name || null,
      userAvatar: result.user.avatar || null,
    });
  } catch (error) {
    console.error("[wxlogin/check] Error:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}