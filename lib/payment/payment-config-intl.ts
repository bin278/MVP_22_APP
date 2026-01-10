/**
 * 统一的支付配置 - 国际版 (INTL)
 * 所有关于价格、货币的定义都在这里，只定义一次，避免重复
 *
 * 定价方案：
 * - Free: $0
 * - Pro: $9.99/月, $99.99/年
 * - Enterprise: $24.99/月, $249.99/年
 *
 * 加油包：
 * - 基础包: $4.99 - 100次 (30天有效)
 * - 标准包: $12.49 - 300次 (30天有效)
 * - 高级包: $37.49 - 1000次 (30天有效)
 *
 * 测试模式：设置环境变量 PAYMENT_TEST_MODE=true 可将所有支付金额改为 $0.01
 */

export type BillingCycleIntl = "monthly" | "yearly";
export type PaymentMethodIntl = "stripe" | "paypal";
export type PlanTypeIntl = "free" | "pro" | "enterprise";

// 加油包类型
export type CreditPackageTypeIntl = "basic" | "standard" | "premium";

/**
 * 是否为支付测试模式
 * 开发环境自动启用，生产环境需要显式设置 PAYMENT_TEST_MODE=true
 */
export const isPaymentTestModeIntl =
  process.env.NODE_ENV === 'development' ||
  process.env.PAYMENT_TEST_MODE === "true";

/**
 * 测试模式金额（$4.00）
 * Stripe 最小金额要求是 400 美分（$4.00）
 */
export const TEST_MODE_AMOUNT_INTL = 4.00;

/**
 * 定价表（唯一的价格定义来源）- 国际版 USD
 */
const PRICING_DATA_INTL = {
  USD: {
    pro: {
      monthly: 9.99,
      yearly: 99.99,
    },
    enterprise: {
      monthly: 24.99,
      yearly: 249.99,
    },
  },
} as const;

/**
 * 加油包配置表 - 国际版
 */
export const CREDIT_PACKAGES_INTL: Record<CreditPackageTypeIntl, {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  currency: string;
  validityDays: number;
}> = {
  basic: {
    id: "credit-basic-100-intl",
    name: "Basic Credit Package",
    description: "100 code generations, valid for 30 days",
    credits: 100,
    price: 4.99,
    currency: "USD",
    validityDays: 30,
  },
  standard: {
    id: "credit-standard-300-intl",
    name: "Standard Credit Package",
    description: "300 code generations, valid for 30 days",
    credits: 300,
    price: 12.49,
    currency: "USD",
    validityDays: 30,
  },
  premium: {
    id: "credit-premium-1000-intl",
    name: "Premium Credit Package",
    description: "1000 code generations, valid for 30 days",
    credits: 1000,
    price: 37.49,
    currency: "USD",
    validityDays: 30,
  },
};

/**
 * 根据订阅类型和计费周期获取价格
 */
export function getPricingByPlanIntl(
  planType: PlanTypeIntl,
  billingCycle: BillingCycleIntl
): { price: number; currency: string } {
  if (planType === "free") {
    return { price: 0, currency: "USD" };
  }

  const prices = PRICING_DATA_INTL.USD[planType];
  if (!prices) {
    throw new Error(`Invalid plan type: ${planType}`);
  }

  let price = prices[billingCycle];

  // 测试模式：使用 $0.01
  if (isPaymentTestModeIntl) {
    price = TEST_MODE_AMOUNT_INTL;
  }

  return { price, currency: "USD" };
}

/**
 * 根据货币类型和计费周期获取金额
 */
export function getAmountByCurrencyIntl(
  currency: string,
  billingCycle: BillingCycleIntl
): number {
  const prices = PRICING_DATA_INTL[currency as keyof typeof PRICING_DATA_INTL];
  return prices ? prices.pro[billingCycle] : 0;
}

/**
 * 定义订阅天数
 */
export function getDaysByBillingCycleIntl(billingCycle: BillingCycleIntl): number {
  return billingCycle === "monthly" ? 30 : 365;
}

/**
 * 格式化价格显示
 */
export function formatPriceIntl(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * 获取支持的支付方式
 */
export function getSupportedPaymentMethodsIntl(): PaymentMethodIntl[] {
  return ["stripe", "paypal"];
}

/**
 * 检查是否为有效的支付方式
 */
export function isValidPaymentMethodIntl(method: string): method is PaymentMethodIntl {
  return ["stripe", "paypal"].includes(method);
}

/**
 * 获取加油包配置
 */
export function getCreditPackagePriceIntl(packageType: CreditPackageTypeIntl): {
  credits: number;
  price: number;
  currency: string;
  validity: number;
  nameZh: string;
  nameEn: string;
} {
  const pkg = CREDIT_PACKAGES_INTL[packageType];
  if (!pkg) {
    throw new Error(`Invalid credit package type: ${packageType}`);
  }

  let price = pkg.price;
  if (isPaymentTestModeIntl) {
    price = TEST_MODE_AMOUNT_INTL;
  }

  return {
    credits: pkg.credits,
    price,
    currency: pkg.currency,
    validity: pkg.validityDays,
    nameZh: packageType === 'basic' ? '基础加油包' : packageType === 'standard' ? '标准加油包' : '高级加油包',
    nameEn: pkg.name,
  };
}
