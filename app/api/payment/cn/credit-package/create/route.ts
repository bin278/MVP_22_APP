// app/api/payment/cn/credit-package/create/route.ts - 创建加油包支付订单
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/auth";
import { getCloudBaseDatabase, CloudBaseCollections } from "@/lib/database/cloudbase-client";
import { CloudBaseUserAdapter } from "@/lib/database/adapters/cloudbase-user";
import { createPaymentAdapterCN } from "@/lib/payment/adapter-cn";
import {
  getCreditPackageConfigCN,
  getCreditPackagePriceCN,
  isPaymentTestMode,
  TEST_MODE_AMOUNT,
  type CreditPackageType,
  type PaymentMethodCN,
  type PaymentModeCN,
} from "@/lib/payment/payment-config-cn";
import { getBaseUrl } from "@/lib/utils/get-base-url";
import { getDbCommand } from "@/lib/database/cloudbase-client";

// CloudBase 适配器实例
const cloudbaseAdapter = new CloudBaseUserAdapter();

// 请求验证 Schema
const createCreditPackageSchema = z.object({
  packageType: z.enum(["basic", "standard", "premium"]),
  method: z.enum(["wechat", "alipay"]),
  mode: z.enum(["qrcode", "page"]).default("qrcode"),
});

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "未授权，请先登录" },
        { status: 401 }
      );
    }

    const { user } = authResult;

    // 解析并验证请求
    const body = await request.json();
    const validationResult = createCreditPackageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "请求参数无效",
          code: "VALIDATION_ERROR",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { packageType, method, mode } = validationResult.data;
    const userId = user.id;

    // 获取加油包配置
    const packageConfig = getCreditPackageConfigCN(packageType as CreditPackageType);
    const finalAmount = getCreditPackagePriceCN(packageType as CreditPackageType);

    console.log(`🛒 [Credit Package] 创建加油包订单:`, {
      userId,
      packageType,
      packageId: packageConfig.id,
      amount: finalAmount,
      testMode: isPaymentTestMode,
    });

    // 防重复支付检查（1分钟内）
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const db = getCloudBaseDatabase();
    const cmd = getDbCommand();

    try {
      const recentPaymentsResult = await db
        .collection(CloudBaseCollections.PAYMENTS)
        .where({
          user_id: userId,
          amount: finalAmount,
          currency: "CNY",
          payment_method: method,
          created_at: cmd.gte(oneMinuteAgo),
          status: cmd.in(["pending", "completed"]),
        })
        .orderBy("created_at", "desc")
        .limit(1)
        .get();

      const recentPayments = recentPaymentsResult.data || [];

      if (recentPayments.length > 0) {
        const latestPayment = recentPayments[0];
        const paymentAge = Date.now() - new Date(latestPayment.created_at).getTime();

        console.warn(
          `重复支付请求被阻止: 用户 ${userId} 在 ${Math.floor(paymentAge / 1000)}s 内尝试重复支付`
        );

        return NextResponse.json(
          {
            success: false,
            error: "您有一个待处理的支付请求，请稍后再试",
            code: "DUPLICATE_PAYMENT_REQUEST",
            existingPaymentId: latestPayment._id,
            waitTime: Math.ceil((60000 - paymentAge) / 1000),
          },
          { status: 429 }
        );
      }
    } catch (checkError) {
      console.error("检查现有支付时出错:", checkError);
      // 继续处理，不阻止支付创建
    }

    // 微信支付在PC端只支持Native扫码支付，自动降级为qrcode模式
    const actualMode: PaymentModeCN = method === "wechat" ? "qrcode" : mode;

    // 创建支付订单
    const paymentReturnUrl = `${getBaseUrl()}/payment/result`;

    const orderResult = await createPaymentAdapterCN(method).createOrder(
      finalAmount,
      userId,
      method,
      {
        currency: "CNY",
        description: `${packageConfig.nameZh} - ${packageConfig.descriptionZh}`,
        mode: actualMode,
        returnUrl: paymentReturnUrl,
      }
    );

    // 记录支付到 CloudBase 数据库
    const metadata = {
      type: "credit_package",
      packageType,
      packageId: packageConfig.id,
      packageName: packageConfig.nameZh,
      credits: packageConfig.credits,
      validityDays: packageConfig.validityDays,
      paymentMethod: method,
      paymentMode: actualMode,
    };

    const paymentResult = await cloudbaseAdapter.createPayment({
      user_id: userId,
      amount: finalAmount,
      currency: "CNY",
      status: "pending",
      payment_method: method,
      transaction_id: orderResult.orderId,
      metadata,
    });

    if (!paymentResult.success) {
      console.error("[Credit Package] 记录支付失败:", paymentResult.error);
      return NextResponse.json(
        { success: false, error: "记录支付失败" },
        { status: 500 }
      );
    }

    console.log("✅ [Credit Package] 订单创建成功:", {
      paymentId: paymentResult.id,
      orderId: orderResult.orderId,
      packageType,
      credits: packageConfig.credits,
    });

    return NextResponse.json({
      success: true,
      orderId: orderResult.orderId,
      mode: actualMode,
      qrCodeUrl: orderResult.qrCodeUrl,
      paymentUrl: orderResult.paymentUrl,
      method,
      amount: finalAmount,
      currency: "CNY",
      packageType,
      packageConfig,
      testMode: isPaymentTestMode && method === "wechat",
    });
  } catch (error: any) {
    console.error("[Credit Package] 创建订单失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "创建支付订单失败" },
      { status: 500 }
    );
  }
}
