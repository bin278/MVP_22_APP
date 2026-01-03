import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { CloudBaseUserAdapter } from "@/lib/database/adapters/cloudbase-user";
import { z } from "zod";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Validation schema
const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100, "Name too long"),
});

/**
 * PUT /api/profile/update
 * Updates the user's profile information
 * Supports both INTL (Supabase) and CN (CloudBase) regions
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证用户认证
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors[0]?.message
        },
        { status: 400 }
      );
    }

    const { full_name } = validationResult.data;

    // CN 环境：CloudBase
    return await handleChinaProfileUpdate(authResult.user, full_name);

  } catch (error: any) {
    console.error("[/api/profile/update] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * CN 环境：使用 CloudBase 更新用户资料
 */
async function handleChinaProfileUpdate(user: any, fullName: string) {
  const userId = user.id || user._id;
  const cloudbaseAdapter = new CloudBaseUserAdapter();

  try {
    // 使用 CloudBaseUserAdapter 更新用户信息
    const updateResult = await cloudbaseAdapter.updateUser(userId, {
      name: fullName,
      updatedAt: new Date().toISOString(),
    });

    if (!updateResult.success) {
      console.error("[/api/profile/update CN] Failed to update profile:", updateResult.error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    console.log("[/api/profile/update CN] Profile updated for user:", userId);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        full_name: fullName,
      },
    });
  } catch (error: any) {
    console.error("[/api/profile/update CN] Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
