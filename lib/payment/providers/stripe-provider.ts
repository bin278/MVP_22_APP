/**
 * Stripe 支付提供商 - 国际版
 */

import Stripe from 'stripe';
import {
  getPricingByPlanIntl,
  formatPriceIntl,
  isPaymentTestModeIntl,
  TEST_MODE_AMOUNT_INTL,
  type PlanTypeIntl,
  type BillingCycleIntl,
} from '../payment-config-intl';

// 初始化 Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeSecretKey && stripeSecretKey !== 'your_stripe_secret_key') {
  stripe = new Stripe(stripeSecretKey, {
    // 不指定 apiVersion，让 Stripe 使用账户的默认版本
    typescript: true,
  });
}

/**
 * 创建 Stripe Checkout Session
 */
export async function createStripeCheckoutSession(params: {
  userId: string;
  planType: PlanTypeIntl;
  billingCycle: BillingCycleIntl;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  const { userId, planType, billingCycle, successUrl, cancelUrl } = params;

  // 获取价格
  let amount = getPricingByPlanIntl(planType, billingCycle).price;

  // 测试模式调整
  if (isPaymentTestModeIntl) {
    amount = TEST_MODE_AMOUNT_INTL;
  }

  // 使用 price_data 直接在 checkout session 中创建价格
  // 这样可以避免单独创建 price 时可能出现的 API 版本问题
  console.log('Creating Stripe checkout session:', {
    amount: Math.round(amount * 100),
    currency: 'usd',
    interval: billingCycle === 'monthly' ? 'month' : 'year',
    planType,
    billingCycle,
    userId,
  });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100), // 转换为分
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year',
            },
            product_data: {
              name: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan - ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}`,
              description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} subscription, ${billingCycle} billing`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
        planType,
        billingCycle,
      },
    });

    console.log('Stripe checkout session created successfully:', session.id);

    return {
      sessionId: session.id,
      url: session.url!,
    };
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    });
    throw error; // 重新抛出错误，让上层处理
  }
}

/**
 * 创建一次性支付 Session (加油包)
 */
export async function createStripePaymentSession(params: {
  userId: string;
  amount: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
  packageType?: string;
  credits?: number;
  validity?: number;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const { userId, amount, description, successUrl, cancelUrl, packageType, credits, validity } = params;

  // 测试模式调整
  let finalAmount = amount;
  if (isPaymentTestModeIntl) {
    finalAmount = TEST_MODE_AMOUNT_INTL;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: description,
          },
          unit_amount: Math.round(finalAmount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      userId,
      payment_type: 'credit_package',
      ...(packageType && { packageType }),
      ...(credits && { credits: credits.toString() }),
      ...(validity && { validity: validity.toString() }),
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/**
 * 验证 Stripe Webhook 签名
 */
export function constructStripeEvent(payload: string, signature: string) {
  console.log('[Stripe Provider] Constructing event');
  console.log('[Stripe Provider] Payload length:', payload.length);
  console.log('[Stripe Provider] Signature present:', !!signature);
  console.log('[Stripe Provider] Signature preview:', signature?.substring(0, 20) + '...');

  if (!stripe) {
    console.error('[Stripe Provider] Stripe not configured');
    throw new Error('Stripe is not configured');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe Provider] STRIPE_WEBHOOK_SECRET not configured');
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  console.log('[Stripe Provider] Webhook secret configured:', webhookSecret.substring(0, 10) + '...');

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    console.log('[Stripe Provider] Event constructed successfully:', event.type);
    return event;
  } catch (error: any) {
    console.error('[Stripe Provider] Signature verification failed:', error.message);
    console.error('[Stripe Provider] Error type:', error.type);
    throw error;
  }
}

/**
 * 获取 Stripe 配置状态
 */
export function getStripeConfigStatus() {
  return {
    configured: !!stripe,
    hasSecretKey: !!stripeSecretKey && stripeSecretKey !== 'your_stripe_secret_key',
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
  };
}
