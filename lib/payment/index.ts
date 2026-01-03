/**
 * 支付服务统一入口 - 中国版
 *
 * 专为中国市场优化的支付服务
 * - 支持微信支付和支付宝
 * - 人民币结算
 * - 符合中国支付法规
 */

// 导出中国版支付配置和类型
export * from "./payment-config-cn";

// 导出中国版支付适配器
export * from "./adapter-cn";

/**
 * 获取支持的支付方式
 */
export function getSupportedPaymentMethods(): ("wechat" | "alipay")[] {
  return ["wechat", "alipay"];
}

/**
 * 获取默认支付方式
 */
export function getDefaultPaymentMethod(): "wechat" | "alipay" {
  return "wechat";
}

/**
 * 获取支付货币
 */
export function getPaymentCurrency(): string {
  return "CNY";
}

/**
 * 格式化金额显示
 */
export function formatPaymentAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}