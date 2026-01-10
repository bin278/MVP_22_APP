/**
 * 支付服务统一入口
 *
 * 根据环境变量自动切换国内外版本:
 * - 国内版 (CN): 微信支付、支付宝、人民币 (CNY)
 * - 国际版 (INTL): Stripe、PayPal、美元 (USD)
 */

// 导出中国版支付配置和类型
export * from "./payment-config-cn";

// 导出国际版支付配置和类型
export * from "./payment-config-intl";

// 导出中国版支付适配器
export * from "./adapter-cn";

/**
 * 检测当前部署版本
 */
export function isIntlDeployment(): boolean {
  const authProvider = process.env.AUTH_PROVIDER;
  const dbProvider = process.env.DATABASE_PROVIDER;

  // 如果明确配置为 Supabase,则是国际版
  if (authProvider === 'supabase' || dbProvider === 'supabase') {
    return true;
  }

  return false;
}

/**
 * 获取支持的支付方式 (根据版本自动切换)
 */
export function getSupportedPaymentMethods() {
  if (isIntlDeployment()) {
    return ["stripe", "paypal"];
  } else {
    return ["wechat", "alipay"];
  }
}

/**
 * 获取默认支付方式 (根据版本自动切换)
 */
export function getDefaultPaymentMethod() {
  if (isIntlDeployment()) {
    return "stripe";
  } else {
    return "wechat";
  }
}

/**
 * 获取支付货币 (根据版本自动切换)
 */
export function getPaymentCurrency(): string {
  if (isIntlDeployment()) {
    return "USD";
  } else {
    return "CNY";
  }
}

/**
 * 格式化金额显示 (根据版本自动切换)
 */
export function formatPaymentAmount(amount: number): string {
  if (isIntlDeployment()) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  } else {
    return `¥${amount.toFixed(2)}`;
  }
}

/**
 * 获取支付配置信息
 */
export function getPaymentConfig() {
  const isIntl = isIntlDeployment();

  return {
    version: isIntl ? "intl" : "cn",
    currency: isIntl ? "USD" : "CNY",
    methods: isIntl ? ["stripe", "paypal"] : ["wechat", "alipay"],
    defaultMethod: isIntl ? "stripe" : "wechat",
    database: isIntl ? "supabase" : "cloudbase",
  };
}
