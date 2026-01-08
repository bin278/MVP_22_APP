/**
 * CN 支付创建订单 API
 * POST /api/payment/cn/create
 *
 * 使用 CloudBase 存储支付记录（CN 环境）
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/auth";
import { getCloudBaseDatabase, CloudBaseCollections, getDbCommand } from "@/lib/database/cloudbase-client";
import { CloudBaseUserAdapter } from "@/lib/database/adapters/cloudbase-user";
import { createPaymentAdapterCN } from "@/lib/payment/adapter-cn";
import {
  getDaysByBillingCycleCN,
  isPaymentTestMode,
  TEST_MODE_AMOUNT,
  type PaymentMethodCN,
  type PaymentModeCN,
  type BillingCycle,
} from "@/lib/payment/payment-config-cn";
import { getBaseUrl } from "@/lib/utils/get-base-url";

// CloudBase 适配器实例
const cloudbaseAdapter = new CloudBaseUserAdapter();

// 请求验证 Schema
const createPaymentSchema = z.object({
  method: z.enum(["wechat", "alipay"]),
  mode: z.enum(["qrcode", "page", "h5"]).default("qrcode"), // 支付模式：二维码/电脑网站支付/H5移动支付
  amount: z.number().positive("金额必须为正数"),
  currency: z.string().default("CNY"),
  description: z.string().optional(),
  planType: z.enum(["pro", "enterprise"]).default("pro"),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  returnUrl: z.string().optional(), // 支付完成后回跳地址
  h5Info: z.object({
    type: z.string().optional(),
    app_name: z.string().optional(),
    app_url: z.string().optional(),
  }).optional(), // H5支付场景信息
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
    const validationResult = createPaymentSchema.safeParse(body);

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

    const { method, mode, amount, currency, description, planType, billingCycle, returnUrl, h5Info } = validationResult.data;
    const userId = user.id;

    // 测试模式：所有支付方式使用 0.01 元
    let finalAmount = amount;
    if (isPaymentTestMode) {
      finalAmount = TEST_MODE_AMOUNT;
      console.log(`🧪 [CN Payment] 测试模式：${method} 支付金额改为 ¥${finalAmount}`);
    }

    // 检查重复支付请求（1分钟内）- 使用 CloudBase
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const db = getCloudBaseDatabase();
    const cmd = getDbCommand();

    try {
      const recentPaymentsResult = await db
        .collection(CloudBaseCollections.PAYMENTS)
        .where({
          user_id: userId,
          amount: finalAmount,
          currency,
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

    // 创建支付适配器
    const adapter = createPaymentAdapterCN(method as PaymentMethodCN);

    // 根据设备类型自动选择支付模式
    let actualMode: PaymentModeCN = mode as PaymentModeCN;

    // 检测是否为移动设备
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);

    // 如果是移动设备且未指定模式,自动使用H5
    if (isMobile && mode === 'qrcode') {
      actualMode = 'h5';
      console.log(`[CN Payment] 检测到移动设备,自动切换到H5支付模式`);
    }

    // 微信支付在PC端只支持Native扫码支付
    if (method === "wechat" && actualMode === 'page' && !isMobile) {
      actualMode = 'qrcode';
    }

    // 创建支付订单
    console.log(`[CN Payment] 创建 ${method} 订单 (${actualMode} 模式):`, { userId, amount: finalAmount, planType, billingCycle });

    // 计算回跳地址
    const paymentReturnUrl = returnUrl || `${getBaseUrl()}/payment/result`;

    const orderResult = await adapter.createOrder(finalAmount, userId, method as PaymentMethodCN, {
      currency,
      description: description || `${planType === "pro" ? "专业版" : "企业版"}会员 - ${billingCycle === "yearly" ? "年度" : "月度"}`,
      billingCycle,
      planType,
      mode: actualMode,
      returnUrl: paymentReturnUrl,
      h5Info,
    });

    // 记录支付到 CloudBase 数据库
    const days = getDaysByBillingCycleCN(billingCycle as BillingCycle);
    const metadata = {
      days,
      billingCycle,
      planType,
      paymentMethod: method,
      paymentMode: actualMode,
    };

    const paymentResult = await cloudbaseAdapter.createPayment({
      user_id: userId,
      amount: finalAmount,
      currency,
      status: "pending",
      payment_method: method,
      transaction_id: orderResult.orderId,
      metadata,
    });

    if (!paymentResult.success) {
      console.error("[CN Payment] 记录支付失败:", paymentResult.error);
      return NextResponse.json(
        { success: false, error: "记录支付失败" },
        { status: 500 }
      );
    }

    console.log("✅ [CN Payment] 订单创建成功:", {
      paymentId: paymentResult.id,
      orderId: orderResult.orderId,
      mode,
      qrCodeUrl: orderResult.qrCodeUrl,
      paymentUrl: orderResult.paymentUrl,
    });

    return NextResponse.json({
      success: true,
      orderId: orderResult.orderId,
      mode: actualMode,
      qrCodeUrl: orderResult.qrCodeUrl,
      paymentUrl: orderResult.paymentUrl,
      method,
      amount: finalAmount,
      currency,
      testMode: isPaymentTestMode && method === "wechat",
    });
  } catch (error: any) {
    console.error("[CN Payment] 创建订单失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "创建支付订单失败" },
      { status: 500 }
    );
  }
}
