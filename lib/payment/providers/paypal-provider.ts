/**
 * PayPal 支付提供商 - 国际版
 */

import {
  getPricingByPlanIntl,
  isPaymentTestModeIntl,
  TEST_MODE_AMOUNT_INTL,
  type PlanTypeIntl,
  type BillingCycleIntl,
} from '../payment-config-intl';

// PayPal 配置
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'live'

/**
 * 获取 PayPal 访问令牌
 */
async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials are not configured');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(
    PAYPAL_ENVIRONMENT === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com/v1/oauth2/token'
      : 'https://api-m.paypal.com/v1/oauth2/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * 创建 PayPal 订单
 */
export async function createPayPalOrder(params: {
  userId: string;
  planType: PlanTypeIntl;
  billingCycle: BillingCycleIntl;
  returnUrl: string;
  cancelUrl: string;
  amount?: number;
  credits?: number;
  validity?: number;
}) {
  const accessToken = await getPayPalAccessToken();
  const { userId, planType, billingCycle, returnUrl, cancelUrl, amount: overrideAmount, credits, validity } = params;

  // 获取价格
  let amount = overrideAmount || getPricingByPlanIntl(planType, billingCycle).price;

  // 测试模式调整
  if (isPaymentTestModeIntl) {
    amount = TEST_MODE_AMOUNT_INTL;
  }

  // 构建 custom_id metadata
  const customMetadata: any = {
    userId,
    planType,
    billingCycle,
  };

  // 如果是加油包，添加额外字段
  if (credits !== undefined) {
    customMetadata.payment_type = 'credit_package';
    customMetadata.credits = credits;
  }
  if (validity !== undefined) {
    customMetadata.validity = validity;
  }

  const response = await fetch(
    PAYPAL_ENVIRONMENT === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com/v2/checkout/orders'
      : 'https://api-m.paypal.com/v2/checkout/orders',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: userId,
            description: `${planType} Plan - ${billingCycle}`,
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
            custom_id: JSON.stringify(customMetadata),
          },
        ],
        application_context: {
          brand_name: 'mornFront',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal order: ${error}`);
  }

  const order = await response.json();

  // 提取 approval URL
  const approvalLink = order.links?.find((link: any) => link.rel === 'approve');

  if (!approvalLink) {
    throw new Error('PayPal approval link not found');
  }

  return {
    orderId: order.id,
    approvalUrl: approvalLink.href,
  };
}

/**
 * 捕获 PayPal 支付
 */
export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    PAYPAL_ENVIRONMENT === 'sandbox'
      ? `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`
      : `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to capture PayPal order: ${error}`);
  }

  return await response.json();
}

/**
 * 验证 PayPal Webhook 签名
 */
export async function verifyPayPalWebhook(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    console.warn('PAYPAL_WEBHOOK_ID not configured, skipping verification');
    return true;
  }

  const paypalCertId = headers.get('paypal-cert-id');
  const paypalAuthAlgo = headers.get('paypal-auth-algo');
  const paypalTransmissionId = headers.get('paypal-transmission-id');
  const paypalCertUrl = headers.get('paypal-cert-url');
  const paypalTransmissionSig = headers.get('paypal-transmission-sig');
  const paypalTransmissionTime = headers.get('paypal-transmission-time');

  if (process.env.NODE_ENV === 'development') {
    console.log('PayPal webhook verification skipped in development');
    return true;
  }

  // 在生产环境验证 webhook
  const accessToken = await getPayPalAccessToken();

  const verificationResponse = await fetch(
    PAYPAL_ENVIRONMENT === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature'
      : 'https://api-m.paypal.com/v1/notifications/verify-webhook-signature',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        auth_algo: paypalAuthAlgo,
        cert_id: paypalCertId,
        transmission_id: paypalTransmissionId,
        transmission_sig: paypalTransmissionSig,
        transmission_time: paypalTransmissionTime,
        cert_url: paypalCertUrl,
        webhook_id: webhookId,
        webhook_event: rawBody,
      }),
    }
  );

  const verificationResult = await verificationResponse.json();
  return verificationResult.verification_status === 'SUCCESS';
}

/**
 * 获取 PayPal 配置状态
 */
export function getPayPalConfigStatus() {
  return {
    configured: !!PAYPAL_CLIENT_ID && !!PAYPAL_CLIENT_SECRET,
    hasClientId: !!PAYPAL_CLIENT_ID && PAYPAL_CLIENT_ID !== 'your_paypal_client_id',
    hasClientSecret: !!PAYPAL_CLIENT_SECRET && PAYPAL_CLIENT_SECRET !== 'your_paypal_client_secret',
    hasWebhookId: !!process.env.PAYPAL_WEBHOOK_SECRET,
    environment: PAYPAL_ENVIRONMENT,
  };
}
