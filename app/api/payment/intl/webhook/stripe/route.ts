/**
 * Stripe Webhook 处理 - 国际版
 * POST /api/payment/intl/webhook/stripe
 */

import { NextRequest, NextResponse } from "next/server";
import { add, query, update, getDatabaseProvider } from "@/lib/database";
import { constructStripeEvent, getStripeConfigStatus } from "@/lib/payment/providers/stripe-provider";
import { getDaysByBillingCycleIntl, type PlanTypeIntl, type BillingCycleIntl } from "@/lib/payment/payment-config-intl";

export async function POST(request: NextRequest) {
  try {
    console.log('[Stripe Webhook] Request received');

    // 检查 Stripe 配置
    const stripeConfig = getStripeConfigStatus();
    if (!stripeConfig.configured) {
      console.error('[Stripe Webhook] Stripe not configured');
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    // 获取原始请求体
    const rawBody = await request.text();
    console.log('[Stripe Webhook] Raw body length:', rawBody.length);

    // 获取 Stripe 签名
    const signature = request.headers.get('stripe-signature');
    console.log('[Stripe Webhook] Signature present:', !!signature);

    if (!signature) {
      console.error('[Stripe Webhook] No stripe-signature header found');
      return NextResponse.json(
        { error: 'No stripe-signature header found' },
        { status: 400 }
      );
    }

    // 构造并验证事件
    let event;
    try {
      event = constructStripeEvent(rawBody, signature);
      console.log('[Stripe Webhook] Event constructed successfully');
    } catch (error: any) {
      console.error('[Stripe Webhook] Signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('[Stripe Webhook] Received event:', event.type);

    // 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.client_reference_id;
        const metadata = session.metadata;

        if (!userId || !metadata) {
          console.error('[Stripe Webhook] Missing user data in session');
          return NextResponse.json(
            { error: 'Invalid session data' },
            { status: 400 }
          );
        }

        // 检查是否已处理过此事件
        const existingPayment = await query('payments', {
          where: { stripe_session_id: session.id },
          limit: 1
        });

        if (existingPayment.data && existingPayment.data.length > 0) {
          const payment = existingPayment.data[0];
          if (payment.status === 'completed') {
            console.log('[Stripe Webhook] Payment already processed, skipping');
            return NextResponse.json({ received: true });
          }

          // 更新支付状态
          await update('payments', payment.id, {
            status: 'completed',
            stripe_customer_id: session.customer,
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
              package_id: `stripe_${session.id}`,
              credits_total: credits,
              credits_remaining: credits,
              status: 'active',
              expiry_date: expiryDate.toISOString(),
              purchase_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            console.log(`✅ [Stripe Webhook] Credit package added for user ${userId}: ${packageType} (${credits} credits)`);
          } else {
            // 处理订阅支付
            const { planType, billingCycle } = metadata;
            const amount = session.amount_total / 100;

            // 创建或更新订阅
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

            console.log(`✅ [Stripe Webhook] Subscription activated for user ${userId}: ${planType}`);
          }
        }
        break;
      }

      case 'invoice.paid': {
        // 定期付款成功
        const invoice = event.data.object as any;
        console.log('[Stripe Webhook] Invoice paid:', invoice.id);
        break;
      }

      case 'customer.subscription.deleted': {
        // 订阅取消
        const subscription = event.data.object as any;
        console.log('[Stripe Webhook] Subscription deleted:', subscription.id);

        // 更新数据库中的订阅状态
        // 这里需要根据 customer_id 找到对应的用户订阅并更新
        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
