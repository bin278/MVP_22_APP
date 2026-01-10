/**
 * 国际版加油包支付创建 API
 * POST /api/payment/intl/credit-package/create
 *
 * 使用 Stripe/PayPal 创建加油包支付
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/auth";
import { query, add, getDatabaseProvider } from "@/lib/database";
import {
  getCreditPackagePriceIntl,
  formatPriceIntl,
  isPaymentTestModeIntl,
  TEST_MODE_AMOUNT_INTL,
  type PaymentMethodIntl,
  type CreditPackageTypeIntl,
} from "@/lib/payment/payment-config-intl";
import { createStripePaymentSession } from "@/lib/payment/providers/stripe-provider";
import { createPayPalOrder } from "@/lib/payment/providers/paypal-provider";
import { getBaseUrl } from "@/lib/utils/get-base-url";

// 请求验证 Schema
const createCreditPackageSchema = z.object({
  method: z.enum(["stripe", "paypal"]),
  packageType: z.enum(["basic", "standard", "premium"]),
});

export async function POST(request: NextRequest) {
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

    // 检查是否为国际版环境
    const provider = getDatabaseProvider();
    if (provider !== 'supabase') {
      return NextResponse.json(
        {
          success: false,
          error: "International payment is only available when using Supabase",
          code: "WRONG_ENVIRONMENT"
        },
        { status: 400 }
      );
    }

    // 解析并验证请求
    const body = await request.json();
    const validationResult = createCreditPackageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
          code: "VALIDATION_ERROR",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { method, packageType } = validationResult.data;
    const userId = user.id;

    // 获取加油包配置
    const packageConfig = getCreditPackagePriceIntl(packageType);

    // 测试模式调整价格
    let finalPrice = packageConfig.price;
    if (isPaymentTestModeIntl) {
      finalPrice = TEST_MODE_AMOUNT_INTL;
    }

    const formattedPrice = formatPriceIntl(finalPrice, packageConfig.currency);

    console.log(`🌍 [INTL Credit Package] Creating ${method} payment:`, {
      userId,
      packageType,
      price: formattedPrice,
      credits: packageConfig.credits,
    });

    // 获取基础 URL
    const baseUrl = getBaseUrl(request);

    // 创建支付会话
    let paymentSession;
    if (method === 'stripe') {
      paymentSession = await createStripePaymentSession({
        userId,
        amount: finalPrice,
        description: `${packageConfig.nameEn} - ${packageConfig.credits} Credits`,
        successUrl: `${baseUrl}/generate?credit_package_success=true&method=stripe&package=${packageType}`,
        cancelUrl: `${baseUrl}/pricing?canceled=true`,
        packageType,
        credits: packageConfig.credits,
        validity: packageConfig.validity,
      });

      // 保存支付记录到 Supabase
      await add('payments', {
        user_id: userId,
        amount: finalPrice,
        currency: packageConfig.currency,
        payment_method: 'stripe',
        payment_type: 'credit_package',
        status: 'pending',
        transaction_id: paymentSession.sessionId,
        stripe_session_id: paymentSession.sessionId,
        metadata: {
          packageType,
          credits: packageConfig.credits,
          validity: packageConfig.validity,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        method: 'stripe',
        sessionId: paymentSession.sessionId,
        checkoutUrl: paymentSession.url,
        price: formattedPrice,
        packageType,
        credits: packageConfig.credits,
      });

    } else if (method === 'paypal') {
      paymentSession = await createPayPalOrder({
        userId,
        planType: packageType,
        billingCycle: 'onetime',
        amount: finalPrice,
        credits: packageConfig.credits,
        validity: packageConfig.validity,
        returnUrl: `${baseUrl}/api/payment/intl/paypal/return`,
        cancelUrl: `${baseUrl}/pricing?canceled=true`,
      });

      // 保存支付记录到 Supabase
      await add('payments', {
        user_id: userId,
        amount: finalPrice,
        currency: packageConfig.currency,
        payment_method: 'paypal',
        payment_type: 'credit_package',
        status: 'pending',
        transaction_id: paymentSession.orderId,
        paypal_order_id: paymentSession.orderId,
        metadata: {
          packageType,
          credits: packageConfig.credits,
          validity: packageConfig.validity,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        method: 'paypal',
        orderId: paymentSession.orderId,
        checkoutUrl: paymentSession.approvalUrl, // 统一使用 checkoutUrl 字段
        approvalUrl: paymentSession.approvalUrl, // 保留兼容性
        price: formattedPrice,
        packageType,
        credits: packageConfig.credits,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported payment method" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[INTL Credit Package] Error creating payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create credit package payment",
        code: error.code || "PAYMENT_CREATE_ERROR"
      },
      { status: 500 }
    );
  }
}
