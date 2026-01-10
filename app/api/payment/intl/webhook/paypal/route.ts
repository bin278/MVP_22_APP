/**
 * PayPal Webhook 处理 - 国际版
 * POST /api/payment/intl/webhook/paypal
 */

import { NextRequest, NextResponse } from "next/server";
import { add, query, update } from "@/lib/database";
import { verifyPayPalWebhook, capturePayPalOrder, getPayPalConfigStatus } from "@/lib/payment/providers/paypal-provider";
import { getDaysByBillingCycleIntl, type BillingCycleIntl } from "@/lib/payment/payment-config-intl";

export async function POST(request: NextRequest) {
  try {
    console.log('[PayPal Webhook] Request received');

    // 检查 PayPal 配置
    const paypalConfig = getPayPalConfigStatus();
    if (!paypalConfig.configured) {
      console.error('[PayPal Webhook] PayPal not configured');
      return NextResponse.json(
        { error: 'PayPal is not configured' },
        { status: 500 }
      );
    }

    // 获取原始请求体
    const rawBody = await request.text();
    console.log('[PayPal Webhook] Raw body length:', rawBody.length);

    // 验证 webhook 签名
    const isValid = await verifyPayPalWebhook(request.headers, rawBody);
    console.log('[PayPal Webhook] Signature valid:', isValid);

    if (!isValid) {
      console.error('[PayPal Webhook] Signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 解析事件
    const event = JSON.parse(rawBody);
    console.log('[PayPal Webhook] Received event:', event.event_type);

    // 处理不同的事件类型
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'CHECKOUT.ORDER.APPROVED': {
        const paymentData = event.resource;
        const purchaseUnit = paymentData.purchase_units?.[0];
        const custom = purchaseUnit?.custom_id;

        if (!custom) {
          console.error('[PayPal Webhook] Missing custom_id');
          return NextResponse.json(
            { error: 'Invalid payment data' },
            { status: 400 }
          );
        }

        // 解析 custom_id 中的元数据
        let metadata;
        try {
          metadata = JSON.parse(custom);
        } catch (error) {
          console.error('[PayPal Webhook] Failed to parse custom_id');
          return NextResponse.json(
            { error: 'Invalid metadata' },
            { status: 400 }
          );
        }

        const { userId, planType, billingCycle } = metadata;
        const amount = parseFloat(purchaseUnit.amount.value);

        // 查找支付记录
        const existingPayment = await query('payments', {
          where: {
            user_id: userId,
            payment_method: 'paypal',
            status: 'pending'
          },
          limit: 1
        });

        if (existingPayment.data && existingPayment.data.length > 0) {
          const payment = existingPayment.data[0];

          if (payment.status === 'completed') {
            console.log('[PayPal Webhook] Payment already processed, skipping');
            return NextResponse.json({ received: true });
          }

          // 更新支付状态
          await update('payments', payment.id, {
            status: 'completed',
            paypal_payment_id: paymentData.id,
            updated_at: new Date().toISOString(),
          });

          // 检查是否是加油包支付
          if (payment.payment_type === 'credit_package' || metadata.packageType) {
            const packageType = metadata.packageType || payment.metadata?.packageType;
            const credits = parseInt(metadata.credits || payment.metadata?.credits || '0');
            const validity = parseInt(metadata.validity || payment.metadata?.validity || '30');

            // 计算过期时间
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + validity);

            // 添加加油包到 user_credit_packages 表
            await add('user_credit_packages', {
              user_id: userId,
              package_type: packageType,
              package_id: `paypal_${paymentData.id}`,
              credits_total: credits,
              credits_remaining: credits,
              status: 'active',
              expiry_date: expiryDate.toISOString(),
              purchase_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            console.log(`✅ [PayPal Webhook] Credit package added for user ${userId}: ${packageType} (${credits} credits)`);
          } else {
            // 处理订阅支付
            const days = getDaysByBillingCycleIntl(billingCycle as BillingCycleIntl);
            const subscriptionEnd = new Date();
            subscriptionEnd.setDate(subscriptionEnd.getDate() + days);

            // 检查是否已有活跃订阅
            const existingSubscription = await query('user_subscriptions', {
              where: { user_id: userId, status: 'active' },
              limit: 1
            });

            if (existingSubscription.data && existingSubscription.data.length > 0) {
              // 更新现有订阅
              await update('user_subscriptions', existingSubscription.data[0].id, {
                plan_type: planType,
                subscription_end: subscriptionEnd.toISOString(),
                updated_at: new Date().toISOString(),
              });
            } else {
              // 创建新订阅
              await add('user_subscriptions', {
                user_id: userId,
                plan_type: planType,
                status: 'active',
                subscription_end: subscriptionEnd.toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }

            console.log(`✅ [PayPal Webhook] Subscription activated for user ${userId}: ${planType}`);
          }
        }

        break;
      }

      default:
        console.log('[PayPal Webhook] Unhandled event type:', event.event_type);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[PayPal Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
