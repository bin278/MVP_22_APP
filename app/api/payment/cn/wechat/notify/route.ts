/**
 * 微信支付回调通知 API
 * POST /api/payment/cn/wechat/notify
 *
 * 使用 CloudBase 存储支付记录（CN 环境）
 */
import { NextRequest, NextResponse } from "next/server";
import { getCloudBaseDatabase, CloudBaseCollections, nowISO } from "@/lib/database/cloudbase-client";
import { CloudBaseUserAdapter } from "@/lib/database/adapters/cloudbase-user";
import { createPaymentAdapterCN } from "@/lib/payment/adapter-cn";

const cloudbaseAdapter = new CloudBaseUserAdapter();

export async function POST(request: NextRequest) {
  try {
    // 获取微信支付回调数据
    const body = await request.json();

    console.log("[WeChat Notify] 收到回调:", {
      event_type: body.event_type,
      id: body.id,
    });

    // 验证并处理回调
    const adapter = createPaymentAdapterCN("wechat");
    const result = await adapter.verifyPayment(body);

    if (!result.success) {
      console.error("[WeChat Notify] 验证失败:", result.error);
      // 微信支付要求返回特定格式
      return NextResponse.json(
        { code: "FAIL", message: result.error },
        { status: 500 }
      );
    }

    // 查找支付记录 - 使用 CloudBase
    const db = getCloudBaseDatabase();
    const paymentsCollection = db.collection(CloudBaseCollections.PAYMENTS);

    const findResult = await paymentsCollection
      .where({ transaction_id: result.orderId })
      .limit(1)
      .get();

    const payment = findResult.data?.[0];

    if (!payment) {
      console.error("[WeChat Notify] 未找到支付记录:", result.orderId);
      return NextResponse.json(
        { code: "FAIL", message: "未找到支付记录" },
        { status: 404 }
      );
    }

    // 检查是否已处理
    if (payment.status === "completed") {
      console.log("[WeChat Notify] 订单已处理:", result.orderId);
      return NextResponse.json({ code: "SUCCESS", message: "成功" });
    }

    // 更新支付状态 - 使用 CloudBase
    const now = nowISO();
    await paymentsCollection.doc(payment._id).update({
      status: "completed",
      completed_at: now,
      updated_at: now,
      metadata: {
        ...payment.metadata,
        wechatTransactionId: result.transactionId,
      },
    });

    // 检查支付类型：订阅订阅或加油包
    const paymentType = payment.metadata?.type;

    if (paymentType === "credit_package") {
      // 处理加油包购买
      await handleCreditPackagePurchase(payment, now);
    } else {
      // 处理订阅购买
      await handleSubscriptionPurchase(payment, now);
    }

    console.log("✅ [WeChat Notify] 支付处理成功:", {
      orderId: result.orderId,
      userId: payment.user_id,
      paymentType,
    });

    // 返回微信要求的成功响应
    return NextResponse.json({ code: "SUCCESS", message: "成功" });
  } catch (error: any) {
    console.error("[WeChat Notify] 处理失败:", error);
    return NextResponse.json(
      { code: "FAIL", message: error.message || "处理失败" },
      { status: 500 }
    );
  }
}

// 处理加油包购买
async function handleCreditPackagePurchase(payment: any, now: string) {
  const db = getCloudBaseDatabase();
  const { packageType, packageId, packageName, credits, validityDays } = payment.metadata || {};

  // 计算过期日期
  const purchaseDate = new Date(now);
  const expiryDate = new Date(purchaseDate);
  expiryDate.setDate(expiryDate.getDate() + (validityDays || 30));

  // 创建加油包记录
  const creditPackageResult = await db.collection("user_credit_packages").add({
    user_id: payment.user_id,
    package_id: packageId,
    package_type: packageType || "basic",
    credits_total: credits || 100,
    credits_remaining: credits || 100,
    status: "active",
    purchase_date: purchaseDate.toISOString(),
    expiry_date: expiryDate.toISOString(),
    created_at: now,
    updated_at: now,
    metadata: {
      packageName,
      paymentId: payment._id,
    },
  });

  console.log("✅ [WeChat Notify] 加油包创建成功:", {
    creditPackageId: creditPackageResult.id,
    userId: payment.user_id,
    packageType,
    credits,
    expiryDate: expiryDate.toISOString(),
  });
}

// 处理订阅购买
async function handleSubscriptionPurchase(payment: any, now: string) {
  // 更新用户订阅状态 - 使用 CloudBase
  const { days, planType, billingCycle } = payment.metadata || {};
  const subscriptionEndDate = new Date();
  subscriptionEndDate.setDate(subscriptionEndDate.getDate() + (days || 30));

  // 创建或更新用户订阅
  await cloudbaseAdapter.createSubscription({
    user_id: payment.user_id,
    subscription_end: subscriptionEndDate.toISOString(),
    status: "active",
    plan_type: planType || "pro",
    currency: payment.currency || "CNY",
  });

  console.log("✅ [WeChat Notify] 订阅创建成功:", {
    userId: payment.user_id,
    planType,
    subscriptionEnd: subscriptionEndDate.toISOString(),
  });
}
