import { NextResponse } from "next/server";
import { cloudbaseUpdateUserProfile } from "@/lib/auth/cloudbase-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { token, openid, expiresIn, nickName, avatarUrl } = await req.json();

    if (!token || !openid) {
      return NextResponse.json({ error: "Token and openid required" }, { status: 400 });
    }

    // 更新用户资料（新用户首次登录）
    if (nickName || avatarUrl) {
      try {
        // 更新用户昵称和头像
        await cloudbaseUpdateUserProfile(openid, {
          name: nickName,
          avatar: avatarUrl
        });
        
        console.log("[mp-callback] Update user profile:", { openid, nickName, avatarUrl });
      } catch (updateError) {
        console.error("[mp-callback] Update failed:", updateError);
        // 更新失败不影响登录
      }
    }

    const maxAge = expiresIn ? parseInt(String(expiresIn), 10) : 60 * 60 * 24 * 7;

    const res = NextResponse.json({ success: true, openid });

    // 设置 cookie（在 WebView 上下文中设置，H5 可以读取）
    res.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    console.log("[mp-callback] Cookie set for openid:", openid);
    return res;
  } catch (error) {
    console.error("[mp-callback] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}