// app/api/subscription/cleanup-expired/route.ts - 清理过期订阅
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { isChinaDeployment } from "@/lib/config/deployment.config";
import { getCloudBaseDatabase } from "@/lib/database/cloudbase-client";

/**
 * POST /api/subscription/cleanup-expired
 * 清理所有过期的订阅（管理员功能）
 *
 * 此接口会：
 * 1. 查询所有 status="active" 但 subscription_end < now 的订阅
 * 2. 将它们的 status 更新为 "expired"
 * 3. 更新对应的 users 集合中的 subscription_plan 为 "free"
 */
export async function POST(request: NextRequest) {
  console.log('🧹 [cleanup-expired] 开始清理过期订阅');

  try {
    // 验证用户认证（需要管理员权限）
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      console.log('❌ [cleanup-expired] 认证失败');
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { user } = authResult;

    // TODO: 添加管理员权限检查
    // if (user.subscription_plan !== 'enterprise' && !isAdmin(user.id)) {
    //   return NextResponse.json(
    //     { success: false, error: "Admin access required" },
    //     { status: 403 }
    //   );
    // }

    if (!isChinaDeployment()) {
      return NextResponse.json(
        { success: false, error: "This feature is only available in CN deployment" },
        { status: 400 }
      );
    }

    const db = getCloudBaseDatabase();
    const now = new Date().toISOString();

    console.log('📋 [cleanup-expired] 查询过期订阅...');

    // 1. 查询所有过期但状态仍为 active 的订阅
    const expiredSubsResult = await db
      .collection("user_subscriptions")
      .where({
        status: "active",
      })
      .get();

    if (!expiredSubsResult.data || expiredSubsResult.data.length === 0) {
      console.log('✅ [cleanup-expired] 没有需要清理的订阅');
      return NextResponse.json({
        success: true,
        message: "No expired subscriptions found",
        cleaned: 0,
      });
    }

    // 过滤出真正过期的订阅
    const trulyExpiredSubs = expiredSubsResult.data.filter(
      (sub: any) => sub.subscription_end < now
    );

    if (trulyExpiredSubs.length === 0) {
      console.log('✅ [cleanup-expired] 没有过期的订阅');
      return NextResponse.json({
        success: true,
        message: "No expired subscriptions found",
        cleaned: 0,
      });
    }

    console.log(`🔍 [cleanup-expired] 找到 ${trulyExpiredSubs.length} 个过期订阅`);

    // 2. 批量更新过期订阅的状态
    const updatePromises = trulyExpiredSubs.map(async (subscription: any) => {
      try {
        // ✅ 重要: 在更新用户状态前，先检查用户是否有其他活跃订阅
        const activeSubsResult = await db
          .collection("user_subscriptions")
          .where({
            user_id: subscription.user_id,
            status: "active",
          })
          .get();

        // 过滤出未过期的活跃订阅（排除当前要处理的订阅）
        const hasActiveSubscription = activeSubsResult.data.some((activeSub: any) =>
          activeSub._id !== subscription._id &&
          activeSub.subscription_end >= now
        );

        // 更新订阅状态为 expired
        await db
          .collection("user_subscriptions")
          .doc(subscription._id)
          .update({
            status: "expired",
            updated_at: now,
          });

        // 只有当用户没有其他活跃订阅时，才降级为 free
        if (!hasActiveSubscription) {
          await db
            .collection("users")
            .where({
              _id: subscription.user_id,
            })
            .update({
              subscription_plan: "free",
              updated_at: now,
            });
          console.log(`✅ [cleanup-expired] 已清理订阅 ${subscription._id} (用户: ${subscription.user_id}) 并降级为 free`);
        } else {
          console.log(`✅ [cleanup-expired] 已清理订阅 ${subscription._id} (用户: ${subscription.user_id}) - 用户有其他活跃订阅，保持当前计划`);
        }

        return {
          subscriptionId: subscription._id,
          userId: subscription.user_id,
          plan: subscription.plan_type,
          expiredAt: subscription.subscription_end,
          downgraded: !hasActiveSubscription, // 标记是否降级
          success: true,
        };
      } catch (error: any) {
        console.error(`❌ [cleanup-expired] 清理订阅 ${subscription._id} 失败:`, error);
        return {
          subscriptionId: subscription._id,
          userId: subscription.user_id,
          error: error?.message || "Unknown error",
          success: false,
        };
      }
    });

    const results = await Promise.all(updatePromises);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`🎉 [cleanup-expired] 清理完成: 成功 ${successCount}, 失败 ${failCount}`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${successCount} expired subscriptions`,
      cleaned: successCount,
      failed: failCount,
      results: results,
    });

  } catch (error: any) {
    console.error('❌ [cleanup-expired] 清理失败:', error);
    console.error('❌ [cleanup-expired] 错误详情:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
    });

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unknown error',
        details: error?.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscription/cleanup-expired
 * 查看过期订阅统计（不执行清理）
 */
export async function GET(request: NextRequest) {
  console.log('📊 [cleanup-expired] 查看过期订阅统计');

  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isChinaDeployment()) {
      return NextResponse.json(
        { success: false, error: "This feature is only available in CN deployment" },
        { status: 400 }
      );
    }

    const db = getCloudBaseDatabase();
    const now = new Date().toISOString();

    // 查询所有活跃订阅
    const activeSubsResult = await db
      .collection("user_subscriptions")
      .where({
        status: "active",
      })
      .get();

    if (!activeSubsResult.data || activeSubsResult.data.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalActive: 0,
          expired: 0,
          active: 0,
        },
      });
    }

    // 统计过期订阅
    const expiredSubs = activeSubsResult.data.filter(
      (sub: any) => sub.subscription_end < now
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalActive: activeSubsResult.data.length,
        expired: expiredSubs.length,
        active: activeSubsResult.data.length - expiredSubs.length,
      },
      expiredSubscriptions: expiredSubs.map((sub: any) => ({
        id: sub._id,
        userId: sub.user_id,
        plan: sub.plan_type,
        subscriptionEnd: sub.subscription_end,
        daysSinceExpiry: Math.floor(
          (new Date().getTime() - new Date(sub.subscription_end).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      })),
    });

  } catch (error: any) {
    console.error('❌ [cleanup-expired] 查询失败:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
