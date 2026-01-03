/**
 * 统一的支付配置 - 中国版 (CN)
 * 所有关于价格、货币的定义都在这里，只定义一次，避免重复
 *
 * 定价方案：
 * - Free: ¥0
 * - Pro: ¥19.9/月, ¥199/年
 * - Enterprise: ¥49.9/月, ¥499/年
 *
 * 加油包：
 * - 基础包: ¥9.9 - 100次 (30天有效)
 *
 * 测试模式：设置环境变量 PAYMENT_TEST_MODE=true 可将所有支付金额改为 0.01 元
 */

export type BillingCycle = "monthly" | "yearly";
export type PaymentMethodCN = "wechat" | "alipay";
export type PaymentModeCN = "qrcode" | "page"; // 二维码支付 / 电脑网站支付
export type PlanType = "free" | "pro" | "enterprise";

// 加油包类型
export type CreditPackageType = "basic" | "standard" | "premium";

/**
 * 是否为支付测试模式
 * 开发环境自动启用，生产环境需要显式设置 PAYMENT_TEST_MODE=true
 */
export const isPaymentTestMode =
  process.env.NODE_ENV === 'development' ||
  process.env.PAYMENT_TEST_MODE === "true";

/**
 * 测试模式金额（0.01 元）
 */
export const TEST_MODE_AMOUNT = 0.01;

/**
 * 定价表（唯一的价格定义来源）- 中国版 CNY
 */
const PRICING_DATA_CN = {
  CNY: {
    pro: {
      monthly: 19.9,
      yearly: 199,
    },
    enterprise: {
      monthly: 49.9,
      yearly: 499,
    },
  },
} as const;

/**
 * 加油包配置表
 */
export const CREDIT_PACKAGES_CN: Record<CreditPackageType, {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  credits: number;
  price: number;
  currency: string;
  validityDays: number;
}> = {
  basic: {
    id: "credit-basic-100",
    name: "Basic Credit Package",
    nameZh: "基础加油包",
    description: "100 code generations, valid for 30 days",
    descriptionZh: "100次代码生成，30天有效",
    credits: 100,
    price: 9.9,
    currency: "CNY",
    validityDays: 30,
  },
  standard: {
    id: "credit-standard-300",
    name: "Standard Credit Package",
    nameZh: "标准加油包",
    description: "300 code generations, valid for 30 days",
    descriptionZh: "300次代码生成，30天有效",
    credits: 300,
    price: 24.9,
    currency: "CNY",
    validityDays: 30,
  },
  premium: {
    id: "credit-premium-1000",
    name: "Premium Credit Package",
    nameZh: "高级加油包",
    description: "1000 code generations, valid for 60 days",
    descriptionZh: "1000次代码生成，60天有效",
    credits: 1000,
    price: 79.9,
    currency: "CNY",
    validityDays: 60,
  },
};

/**
 * 导出定价表供前端显示
 */
export const PRICING_TABLE_CN = PRICING_DATA_CN;

/**
 * 计划优先级（用于升级/降级判断）
 */
export const PLAN_PRIORITY_CN: Record<PlanType, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

/**
 * 根据支付方式和计划类型获取定价信息
 * @param method 支付方式
 * @param planType 计划类型
 * @returns 定价配置（货币和金额）
 */
export function getPricingByMethodCN(method: PaymentMethodCN, planType: PlanType = "pro") {
  // 中国版统一使用人民币
  const currency = "CNY";
  const planPricing = planType === "free"
    ? { monthly: 0, yearly: 0 }
    : PRICING_DATA_CN[currency][planType];

  return {
    currency,
    monthly: planPricing.monthly,
    yearly: planPricing.yearly,
  };
}

/**
 * 根据货币类型、账单周期和计划类型获取金额
 * @param currency 货币类型
 * @param billingCycle 账单周期
 * @param planType 计划类型
 * @returns 金额
 */
export function getAmountByCurrencyCN(
  currency: string,
  billingCycle: BillingCycle,
  planType: PlanType = "pro"
): number {
  if (planType === "free") return 0;

  const prices = PRICING_DATA_CN[currency as keyof typeof PRICING_DATA_CN];
  if (!prices) return 0;

  const planPrices = prices[planType as keyof typeof prices];
  return planPrices ? planPrices[billingCycle] : 0;
}

/**
 * 定义会员天数
 */
export function getDaysByBillingCycleCN(billingCycle: BillingCycle): number {
  return billingCycle === "monthly" ? 30 : 365;
}

/**
 * 获取加油包配置
 * @param packageType 加油包类型
 * @returns 加油包配置
 */
export function getCreditPackageConfigCN(packageType: CreditPackageType = "basic") {
  return CREDIT_PACKAGES_CN[packageType];
}

/**
 * 获取加油包价格
 * @param packageType 加油包类型
 * @returns 价格（如果测试模式则返回 0.01）
 */
export function getCreditPackagePriceCN(packageType: CreditPackageType = "basic"): number {
  const packageConfig = CREDIT_PACKAGES_CN[packageType];
  if (isPaymentTestMode) {
    return TEST_MODE_AMOUNT;
  }
  return packageConfig.price;
}

/**
 * 检查是否可以升级/降级计划
 * @param currentPlan 当前计划
 * @param targetPlan 目标计划
 * @returns { canUpgrade, canDowngrade, isSamePlan }
 */
export function checkPlanTransitionCN(currentPlan: PlanType, targetPlan: PlanType) {
  const currentPriority = PLAN_PRIORITY_CN[currentPlan];
  const targetPriority = PLAN_PRIORITY_CN[targetPlan];

  return {
    canUpgrade: targetPriority > currentPriority,
    canDowngrade: false, // 根据业务规则：不可降级
    isSamePlan: currentPriority === targetPriority,
  };
}

/**
 * 格式化价格显示（中国版）
 */
export function formatPriceCN(amount: number, currency: string = "CNY"): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * 获取年度订阅折扣百分比
 */
export function getYearlyDiscountCN(planType: PlanType): number {
  if (planType === "free") return 0;

  const pricing = PRICING_DATA_CN.CNY[planType];
  const monthlyTotal = pricing.monthly * 12;
  const yearlyPrice = pricing.yearly;

  return Math.round((1 - yearlyPrice / monthlyTotal) * 100);
}

/**
 * 支付方式显示名称
 */
export const PAYMENT_METHOD_NAMES_CN: Record<PaymentMethodCN, string> = {
  wechat: "微信支付",
  alipay: "支付宝",
};

/**
 * 支付方式图标
 */
export const PAYMENT_METHOD_ICONS_CN: Record<PaymentMethodCN, string> = {
  wechat: "wechat",
  alipay: "alipay",
};

