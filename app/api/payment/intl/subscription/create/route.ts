/**
 * 国际版订阅支付创建 API
 * POST /api/payment/intl/subscription/create
 *
 * 使用 Supabase 存储支付记录（INTL 环境）
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/auth";
import { query, add, getDatabaseProvider } from "@/lib/database";
import {
  getPricingByPlanIntl,
  formatPriceIntl,
  getDaysByBillingCycleIntl,
  type PaymentMethodIntl,
  type BillingCycleIntl,
  type PlanTypeIntl,
} from "@/lib/payment/payment-config-intl";
import { createStripeCheckoutSession } from "@/lib/payment/providers/stripe-provider";
import { createPayPalOrder } from "@/lib/payment/providers/paypal-provider";
import { getBaseUrl } from "@/lib/utils/get-base-url";

// 请求验证 Schema
const createSubscriptionSchema = z.object({
  method: z.enum(["stripe", "paypal"]),
  planType: z.enum(["pro", "enterprise"]),
  billingCycle: z.enum(["monthly", "yearly"]),
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
    const validationResult = createSubscriptionSchema.safeParse(body);

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

    const { method, planType, billingCycle } = validationResult.data;
    const userId = user.id;

    // 获取价格信息
    const { price, currency } = getPricingByPlanIntl(planType, billingCycle);
    const formattedPrice = formatPriceIntl(price, currency);

    console.log(`🌍 [INTL Payment] Creating ${method} subscription:`, {
      userId,
      planType,
      billingCycle,
      price: formattedPrice,
    });

    // 获取基础 URL
    const baseUrl = getBaseUrl(request);

    // 创建支付会话
    let paymentSession;
    if (method === 'stripe') {
      paymentSession = await createStripeCheckoutSession({
        userId,
        planType,
        billingCycle,
        successUrl: `${baseUrl}/generate?subscription_success=true&method=stripe`,
        cancelUrl: `${baseUrl}/pricing?canceled=true`,
      });

      // 保存支付记录到 Supabase
      await add('payments', {
        user_id: userId,
        amount: price,
        currency: currency,
        payment_method: 'stripe',
        payment_type: 'subscription',
        plan_type: planType,
        billing_cycle: billingCycle,
        status: 'pending',
        transaction_id: paymentSession.sessionId, // transaction_id 保存 stripe session id
        stripe_session_id: paymentSession.sessionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        method: 'stripe',
        sessionId: paymentSession.sessionId,
        checkoutUrl: paymentSession.url,
        price: formattedPrice,
        planType,
        billingCycle,
      });

    } else if (method === 'paypal') {
      paymentSession = await createPayPalOrder({
        userId,
        planType,
        billingCycle,
        returnUrl: `${baseUrl}/api/payment/intl/paypal/return`,
        cancelUrl: `${baseUrl}/pricing?canceled=true`,
      });

      // 保存支付记录到 Supabase
      await add('payments', {
        user_id: userId,
        amount: price,
        currency: currency,
        payment_method: 'paypal',
        payment_type: 'subscription',
        plan_type: planType,
        billing_cycle: billingCycle,
        status: 'pending',
        transaction_id: paymentSession.orderId, // transaction_id 保存 paypal order id
        paypal_order_id: paymentSession.orderId,
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
        planType,
        billingCycle,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported payment method" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[INTL Subscription] Error creating payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create subscription payment",
        code: error.code || "PAYMENT_CREATE_ERROR"
      },
      { status: 500 }
    );
  }
}
