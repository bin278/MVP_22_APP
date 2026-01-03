// app/api/auth/refresh-subscription/route.ts - 刷新用户订阅状态 (CloudBase版本)
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { isChinaDeployment } from "@/lib/config/deployment.config";
import { CloudBaseUserAdapter } from "@/lib/database/adapters/cloudbase-user";

function normalizePlan(plan?: string | null): "enterprise" | "pro" | "free" {
  const val = (plan || "").toLowerCase();
  if (val.includes("enterprise")) return "enterprise";
  if (val.includes("pro")) return "pro";
  return "free";
}

function resolvePlanFromMetadata(meta?: Record<string, any> | null) {
  return normalizePlan(
    meta?.planType ||
    meta?.tier ||
    meta?.plan ||
    meta?.plan_type ||
    meta?.subscription_plan
  );
}

// CN 环境：使用 CloudBase
async function refreshSubscriptionCN(userId: string, user: any) {
  console.log("[API] CN environment - using CloudBase");
  const cloudbaseAdapter = new CloudBaseUserAdapter();

  // 查询用户的活跃订阅
  const { data: subscription, error: subscriptionError } = await cloudbaseAdapter.getActiveSubscription(userId);

  if (subscriptionError) {
    console.error("[API] Error checking subscription:", subscriptionError);
  }

  // 查找最近一条已完成的支付
  const { data: payments } = await cloudbaseAdapter.getPaymentHistory(userId, { limit: 1 });
  const latestPayment = payments?.[0];

  // 以用户当前元数据为回退
  let subscriptionPlan = normalizePlan(user.user_metadata?.subscription_plan as string);
  let subscriptionStatus = (user.user_metadata?.subscription_status as string) || "inactive";
  let subscriptionEnd: string | null = (user.user_metadata?.subscription_end as string) || null;
  let billingCycle: string | null = (user.user_metadata?.subscription_billing_cycle as string) || null;

  if (subscription) {
    subscriptionPlan = normalizePlan(subscription.plan_type || "pro");
    subscriptionStatus = subscription.status;
    subscriptionEnd = subscription.subscription_end;
  }

  // 兜底使用最近一次支付的 planType
  if (latestPayment?.status === "completed") {
    const paymentPlanType = resolvePlanFromMetadata(latestPayment.metadata);
    if (paymentPlanType !== "free" && paymentPlanType !== subscriptionPlan) {
      subscriptionPlan = paymentPlanType;
      if (!subscriptionStatus || subscriptionStatus === "inactive") {
        subscriptionStatus = "active";
      }
    }
    if (!billingCycle && latestPayment.metadata?.billingCycle) {
      billingCycle = latestPayment.metadata.billingCycle;
    }
  }

  // 更新用户信息（CloudBase）
  console.log("[API] Updating user in CloudBase:", { userId, subscriptionPlan, subscriptionStatus });
  const updateResult = await cloudbaseAdapter.updateUser(userId, {
    subscription_plan: subscriptionPlan,
    subscription_status: subscriptionStatus,
  });

  if (!updateResult.success) {
    console.error("[API] Failed to update user in CloudBase:", updateResult.error);
  } else {
    console.log("[API] User updated successfully in CloudBase");
  }

  return {
    success: true,
    subscriptionPlan,
    subscriptionStatus,
    subscription,
    billingCycle,
    subscriptionEnd,
  };
}

export async function POST(request: NextRequest) {
  console.log("[API] POST /api/auth/refresh-subscription - Start");

  try {
    // 验证用户认证
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { user } = authResult;
    const userId = user.id;

    console.log("[API] Refresh subscription request for user:", userId);

    // CloudBase 版本的订阅刷新
    const result = await refreshSubscriptionCN(userId, user);

    console.log("[API] Sending response:", {
      success: result.success,
      subscriptionPlan: result.subscriptionPlan,
      subscriptionStatus: result.subscriptionStatus,
      hasSubscription: !!result.subscription
    });

    return NextResponse.json({
      success: result.success,
      subscriptionPlan: result.subscriptionPlan,
      subscriptionStatus: result.subscriptionStatus,
      subscription: result.subscription,
    });
  } catch (error) {
    console.error("[API] Refresh subscription error:", error);
    console.error("[API] Error stack:", error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}
