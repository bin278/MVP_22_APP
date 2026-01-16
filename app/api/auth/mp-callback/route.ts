import { NextResponse } from "next/server";
import { getCloudBaseDatabase, CloudBaseCollections } from "@/lib/database/cloudbase-client";

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
        const db = getCloudBaseDatabase();
        const usersCollection = db.collection(CloudBaseCollections.USERS);

        // 查找用户
        const userResult = await usersCollection.where({ wechatOpenId: openid }).get();

        if (userResult.data && userResult.data.length > 0) {
          const user = userResult.data[0];
          const updateData: any = {};

          if (nickName) updateData.name = nickName;
          if (avatarUrl) updateData.avatar = avatarUrl;

          if (Object.keys(updateData).length > 0) {
            await usersCollection.doc(user._id).update(updateData);
            console.log("[mp-callback] Update user profile:", { openid, nickName, avatarUrl });
          }
        }
      } catch (updateError) {
        console.error("[mp-callback] Update failed:", updateError);
        // 更新失败不影响登录
      }
    }

    const maxAge = expiresIn ? parseInt(String(expiresIn), 10) : 60 * 60 * 24 * 7;

    // 查询用户信息返回给前端
    let userData = null;
    try {
      const db = getCloudBaseDatabase();
      const usersCollection = db.collection(CloudBaseCollections.USERS);
      const userResult = await usersCollection.where({ wechatOpenId: openid }).get();

      if (userResult.data && userResult.data.length > 0) {
        const user = userResult.data[0];
        userData = {
          id: user._id,
          uid: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          subscription_plan: user.subscription_plan,
          subscriptionTier: user.subscription_plan
        };
      }
    } catch (error) {
      console.error("[mp-callback] Failed to fetch user data:", error);
    }

    const res = NextResponse.json({ success: true, openid, user: userData });

    // 设置 cookie（在 WebView 上下文中设置，H5 可以读取）
    res.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: true,
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