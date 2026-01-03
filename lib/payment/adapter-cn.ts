/**
 * 中国版支付适配器 - CN Payment Adapters
 *
 * 支持微信支付和支付宝
 * - WeChat Pay: API v3, Native QR Code payments
 * - Alipay: Page redirect payments
 */

import { PaymentMethodCN, BillingCycle, PlanType } from "./payment-config-cn";

interface CreateOrderOptions {
  currency: string;
  description: string;
  billingCycle: BillingCycle;
  planType: PlanType;
  mode: "qrcode" | "page";
  returnUrl?: string;
}

interface CreateOrderResult {
  orderId: string;
  qrCodeUrl?: string;
  paymentUrl?: string;
}

interface QueryOrderResult {
  id: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  amount: number;
  currency: string;
  metadata?: any;
}

interface VerifyPaymentResult {
  success: boolean;
  error?: string;
  orderId?: string;
  transactionId?: string;
}

interface PaymentAdapter {
  createOrder(amount: number, userId: string, method: PaymentMethodCN, options: CreateOrderOptions): Promise<CreateOrderResult>;
  queryOrder(orderId: string): Promise<QueryOrderResult>;
  verifyPayment(callbackData: any): Promise<VerifyPaymentResult>;
}

/**
 * 微信支付适配器 - WeChat Pay Adapter
 */
class WeChatPayAdapter implements PaymentAdapter {
  private appId: string;
  private mchId: string;
  private privateKey: string;
  private apiV3Key: string;
  private serialNo: string;

  constructor() {
    this.appId = process.env.WECHAT_PAY_APPID || "";
    this.mchId = process.env.WECHAT_PAY_MCHID || "";
    this.privateKey = this.formatPrivateKey(process.env.WECHAT_PAY_PRIVATE_KEY || "");
    this.apiV3Key = process.env.WECHAT_PAY_API_V3_KEY || "";
    this.serialNo = process.env.WECHAT_PAY_SERIAL_NO || "";

    const missing = [];
    if (!this.appId) missing.push("WECHAT_PAY_APPID");
    if (!this.mchId) missing.push("WECHAT_PAY_MCHID");
    if (!this.privateKey) missing.push("WECHAT_PAY_PRIVATE_KEY");
    if (!this.apiV3Key) missing.push("WECHAT_PAY_API_V3_KEY");

    if (missing.length > 0) {
      throw new Error(`WeChat Pay configuration incomplete. Missing: ${missing.join(", ")}`);
    }
  }

  private formatPrivateKey(key: string): string {
    if (!key) return "";

    let processedKey = key;
    if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
      processedKey = processedKey.slice(1, -1);
    }

    let formattedKey = processedKey.replace(/\\n/g, "\n");
    const isPKCS1 = formattedKey.includes("RSA PRIVATE KEY");
    const hasPKCS8Header = formattedKey.includes("BEGIN PRIVATE KEY");

    if (hasPKCS8Header || isPKCS1) {
      return formattedKey.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }

    const cleanKey = formattedKey.replace(/\s/g, "");
    const lines = [];
    for (let i = 0; i < cleanKey.length; i += 64) {
      lines.push(cleanKey.substring(i, i + 64));
    }

    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";

    return `${header}\n${lines.join("\n")}\n${footer}`;
  }

  private generateSignature(method: string, url: string, timestamp: number, nonceStr: string, body: string): string {
    const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;

    try {
      const crypto = require('crypto');
      const sign = crypto.createSign("RSA-SHA256");
      sign.update(message, 'utf8');
      return sign.sign(this.privateKey, "base64");
    } catch (error) {
      console.error('[WeChat Pay] 签名生成失败:', error);
      throw error;
    }
  }

  private async makeRequest(method: string, url: string, body?: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = require('crypto').randomBytes(16).toString('hex');
    const requestBody = body ? JSON.stringify(body) : "";
    const signature = this.generateSignature(method, url, timestamp, nonceStr, requestBody);

    const headers = {
      'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.serialNo}"`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'WeChat Pay SDK'
    };

    const response = await fetch(`https://api.mch.weixin.qq.com${url}`, {
      method,
      headers,
      body: requestBody || undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WeChat Pay] API请求失败 ${response.status}:`, errorText);
      throw new Error(`WeChat Pay API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async createOrder(amount: number, userId: string, method: PaymentMethodCN, options: CreateOrderOptions): Promise<CreateOrderResult> {
    const orderId = `CN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { getBaseUrl } = await import("@/lib/utils/get-base-url");

    const requestBody = {
      appid: this.appId,
      mchid: this.mchId,
      description: options.description,
      out_trade_no: orderId,
      notify_url: `${getBaseUrl()}/api/payment/cn/wechat/notify`,
      amount: {
        total: Math.round(amount * 100), // 转换为分
        currency: options.currency,
      },
      attach: JSON.stringify({
        userId,
        planType: options.planType,
        billingCycle: options.billingCycle,
      }),
    };

    console.log(`[WeChat Pay] 创建订单:`, { orderId, amount: amount * 100, userId });

    const result = await this.makeRequest('POST', '/v3/pay/transactions/native', requestBody);

    return {
      orderId,
      qrCodeUrl: result.code_url,
    };
  }

  async queryOrder(orderId: string): Promise<QueryOrderResult> {
    try {
      const result = await this.makeRequest('GET', `/v3/pay/transactions/out-trade-no/${orderId}?mchid=${this.mchId}`);

      return {
        id: result.out_trade_no,
        status: result.trade_state === 'SUCCESS' ? 'completed' :
                result.trade_state === 'NOTPAY' ? 'pending' : 'failed',
        amount: result.amount?.total ? result.amount.total / 100 : 0,
        currency: result.amount?.currency || 'CNY',
        metadata: result,
      };
    } catch (error: any) {
      if (error.message.includes('ORDERNOTEXIST')) {
        return {
          id: orderId,
          status: 'pending',
          amount: 0,
          currency: 'CNY',
        };
      }
      throw error;
    }
  }

  async verifyPayment(callbackData: any): Promise<VerifyPaymentResult> {
    try {
      // 验证回调签名
      const { event_type, id, create_time, resource } = callbackData;

      if (event_type !== 'TRANSACTION.SUCCESS') {
        return { success: false, error: 'Invalid event type' };
      }

      // 解密资源数据
      const { ciphertext, nonce, associated_data } = resource;
      const decryptedData = this.decryptCallbackData(ciphertext, nonce, associated_data);

      if (!decryptedData) {
        return { success: false, error: 'Failed to decrypt callback data' };
      }

      const { out_trade_no, transaction_id, trade_state } = decryptedData;

      if (trade_state !== 'SUCCESS') {
        return { success: false, error: 'Payment not successful' };
      }

      return {
        success: true,
        orderId: out_trade_no,
        transactionId: transaction_id,
      };
    } catch (error: any) {
      console.error('[WeChat Pay] 验证支付失败:', error);
      return { success: false, error: error.message };
    }
  }

  private decryptCallbackData(ciphertext: string, nonce: string, associatedData: string): any {
    try {
      const crypto = require('crypto');
      const authTag = Buffer.from(ciphertext.slice(-32), 'hex');
      const encryptedData = Buffer.from(ciphertext.slice(0, -32), 'hex');

      const decipher = crypto.createDecipherGCM('aes-256-gcm', Buffer.from(this.apiV3Key, 'hex'));
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from(associatedData, 'utf8'));

      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
      console.error('[WeChat Pay] 解密回调数据失败:', error);
      return null;
    }
  }
}

/**
 * 支付宝适配器 - Alipay Adapter
 */
class AlipayAdapter implements PaymentAdapter {
  private appId: string;
  private privateKey: string;
  private publicKey: string;
  private gatewayUrl: string;

  constructor() {
    this.appId = process.env.ALIPAY_APP_ID || "";
    this.privateKey = this.formatPrivateKey(process.env.ALIPAY_PRIVATE_KEY || "");
    this.publicKey = process.env.ALIPAY_PUBLIC_KEY || "";
    this.gatewayUrl = process.env.ALIPAY_GATEWAY_URL || "https://openapi.alipay.com/gateway.do";

    const missing = [];
    if (!this.appId) missing.push("ALIPAY_APP_ID");
    if (!this.privateKey) missing.push("ALIPAY_PRIVATE_KEY");
    if (!this.publicKey) missing.push("ALIPAY_PUBLIC_KEY");

    if (missing.length > 0) {
      throw new Error(`Alipay configuration incomplete. Missing: ${missing.join(", ")}`);
    }
  }

  private formatPrivateKey(key: string): string {
    if (!key) return "";

    let processedKey = key;
    if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
      processedKey = processedKey.slice(1, -1);
    }

    let formattedKey = processedKey.replace(/\\n/g, "\n");
    const isPKCS1 = formattedKey.includes("RSA PRIVATE KEY");
    const hasPKCS8Header = formattedKey.includes("BEGIN PRIVATE KEY");

    if (hasPKCS8Header || isPKCS1) {
      return formattedKey.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }

    const cleanKey = formattedKey.replace(/\s/g, "");
    const lines = [];
    for (let i = 0; i < cleanKey.length; i += 64) {
      lines.push(cleanKey.substring(i, i + 64));
    }

    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";

    return `${header}\n${lines.join("\n")}\n${footer}`;
  }

  private generateSignature(content: string): string {
    try {
      const crypto = require('crypto');
      const sign = crypto.createSign("RSA-SHA256");
      sign.update(content, 'utf8');
      return sign.sign(this.privateKey, "base64");
    } catch (error) {
      console.error('[Alipay] 签名生成失败:', error);
      throw error;
    }
  }

  private buildFormHtml(params: Record<string, string>): string {
    const formInputs = Object.entries(params)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}" />`)
      .join('\n');

    return `<form id="alipayForm" action="${this.gatewayUrl}" method="POST">
${formInputs}
</form>
<script>document.getElementById('alipayForm').submit();</script>`;
  }

  async createOrder(amount: number, userId: string, method: PaymentMethodCN, options: CreateOrderOptions): Promise<CreateOrderResult> {
    const orderId = `CN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { getBaseUrl } = await import("@/lib/utils/get-base-url");

    const bizContent = {
      out_trade_no: orderId,
      product_code: options.mode === 'page' ? 'FAST_INSTANT_TRADE_PAY' : 'QR_CODE',
      total_amount: amount.toFixed(2),
      currency: options.currency,
      subject: options.description,
      body: JSON.stringify({
        userId,
        planType: options.planType,
        billingCycle: options.billingCycle,
      }),
      notify_url: `${getBaseUrl()}/api/payment/cn/alipay/notify`,
      return_url: options.returnUrl || `${getBaseUrl()}/payment/result`,
    };

    const params = {
      app_id: this.appId,
      method: 'alipay.trade.page.pay',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
      version: '1.0',
      biz_content: JSON.stringify(bizContent),
    };

    // 构建待签名字符串
    const signContent = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const signature = this.generateSignature(signContent);
    params.sign = signature;

    console.log(`[Alipay] 创建订单:`, { orderId, amount, userId, mode: options.mode });

    return {
      orderId,
      paymentUrl: options.mode === 'page' ? `${this.gatewayUrl}?${new URLSearchParams(params)}` : undefined,
      qrCodeUrl: options.mode === 'qrcode' ? `${this.gatewayUrl}?${new URLSearchParams(params)}` : undefined,
    };
  }

  async queryOrder(orderId: string): Promise<QueryOrderResult> {
    // Alipay query implementation would go here
    // For now, return pending status
    return {
      id: orderId,
      status: 'pending',
      amount: 0,
      currency: 'CNY',
    };
  }

  async verifyPayment(callbackParams: Record<string, string>): Promise<VerifyPaymentResult> {
    try {
      // 验证签名
      const { sign, ...params } = callbackParams;

      // 构建待验证字符串
      const verifyContent = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');

      // 使用支付宝公钥验证签名
      const crypto = require('crypto');
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(verifyContent, 'utf8');

      const isValid = verify.verify(this.publicKey, sign, 'base64');

      if (!isValid) {
        return { success: false, error: 'Invalid signature' };
      }

      const { out_trade_no, trade_status, trade_no } = params;

      if (trade_status !== 'TRADE_SUCCESS' && trade_status !== 'TRADE_FINISHED') {
        return { success: false, error: 'Payment not successful' };
      }

      return {
        success: true,
        orderId: out_trade_no,
        transactionId: trade_no,
      };
    } catch (error: any) {
      console.error('[Alipay] 验证支付失败:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * 创建支付适配器工厂函数
 */
export function createPaymentAdapterCN(method: PaymentMethodCN): PaymentAdapter {
  switch (method) {
    case "wechat":
      return new WeChatPayAdapter();
    case "alipay":
      return new AlipayAdapter();
    default:
      throw new Error(`Unsupported payment method: ${method}`);
  }
}