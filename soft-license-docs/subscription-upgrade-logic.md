# 用户升级订阅套餐完整流程

## 📋 目录
1. [升级流程概览](#升级流程概览)
2. [价格配置](#价格配置)
3. [升级检查逻辑](#升级检查逻辑)
4. [支付创建流程](#支付创建流程)
5. [支付成功处理](#支付成功处理)
6. [订阅创建逻辑](#订阅创建逻辑)
7. [与过期清理的交互](#与过期清理的交互)

---

## 升级流程概览

### 完整流程图

```
用户点击升级
    ↓
POST /api/subscription/upgrade (检查升级资格)
    ↓
返回价格和支付信息
    ↓
用户确认并选择支付方式
    ↓
POST /api/payment/cn/create (创建支付订单)
    ↓
用户扫码/跳转支付
    ↓
支付成功 → 微信/支付宝回调
    ↓
POST /api/payment/cn/{method}/notify (支付通知)
    ↓
创建新的订阅记录
    ↓
更新用户订阅计划
```

---

## 价格配置

### 定价表 (lib/payment/payment-config-cn.ts:34-45)

```typescript
const PRICING_DATA_CN = {
  CNY: {
    pro: {
      monthly: 19.9,   // Pro 月付: ¥19.9
      yearly: 199,     // Pro 年付: ¥199
    },
    enterprise: {
      monthly: 49.9,   // Enterprise 月付: ¥49.9
      yearly: 499,     // Enterprise 年付: ¥499
    },
  },
}
```

### 计划优先级 (lib/payment/payment-config-cn.ts:55-59)

```typescript
export const PLAN_PRIORITY_CN: Record<PlanType, number> = {
  free: 0,         // 免费版
  pro: 1,          // 专业版
  enterprise: 2,   // 企业版
};
```

### 订阅天数 (lib/payment/payment-config-cn.ts:105-107)

```typescript
export function getDaysByBillingCycleCN(billingCycle: BillingCycle): number {
  return billingCycle === "monthly" ? 30 : 365;  // 月付30天，年付365天
}
```

---

## 升级检查逻辑

### API 端点: POST /api/subscription/upgrade

**位置**: [app/api/subscription/upgrade/route.ts:50-182](app/api/subscription/upgrade/route.ts#L50-L182)

### 请求参数

```typescript
{
  targetPlan: "pro" | "enterprise",      // 目标计划
  billingCycle: "monthly" | "yearly",    // 账单周期
  paymentMethod: "wechat" | "alipay",    // 支付方式
}
```

### 处理流程

#### 1️⃣ 验证请求参数 (第64-76行)

```typescript
const validationResult = upgradeSchema.safeParse(body);
if (!validationResult.success) {
  return NextResponse.json({
    success: false,
    error: "Invalid input",
    details: validationResult.error.errors,
  }, { status: 400 });
}
```

#### 2️⃣ 获取用户当前计划 (第105行)

```typescript
const currentPlan = await getUserPlan(userId);  // 从数据库查询实际计划
```

#### 3️⃣ 检查升级资格 (第107行)

```typescript
const transition = checkPlanTransitionCN(currentPlan, targetPlan);
```

**检查逻辑** (lib/payment/payment-config-cn.ts:115-124):

```typescript
export function checkPlanTransitionCN(currentPlan: PlanType, targetPlan: PlanType) {
  const currentPriority = PLAN_PRIORITY_CN[currentPlan];
  const targetPriority = PLAN_PRIORITY_CN[targetPlan];

  return {
    canUpgrade: targetPriority > currentPriority,    // 只能升级，不能降级
    canDowngrade: false,                             // 禁止降级
    isSamePlan: currentPriority === targetPriority,  // 同级续订
  };
}
```

#### 4️⃣ 处理三种情况

##### 情况 A: 同级续订 (第112-125行)

```typescript
if (transition.isSamePlan) {
  return NextResponse.json({
    success: true,
    action: "renew",           // 续订
    amount: getAmountByCurrencyCN(currency, billingCycle, targetPlan),
    message: "您可以续订当前计划。"
  });
}
```

**示例**: Pro 月付 → Pro 月付 (续费)

##### 情况 B: 不支持的降级 (第127-139行)

```typescript
if (!transition.canUpgrade) {
  return NextResponse.json({
    success: false,
    error: "不支持降级。您只能从免费版升级到专业版，或从专业版升级到企业版。"
  }, { status: 400 });
}
```

**示例**: Pro → Free (❌ 不允许)

##### 情况 C: 升级到更高级计划 (第141-174行)

```typescript
// 获取当前订阅信息
const currentSubscription = await getActiveSubscription(userId);

// 计算剩余天数（用于按比例抵扣）
if (currentSubscription) {
  const endDate = new Date(currentSubscription.subscription_end);
  const now = new Date();
  const remainingMs = endDate.getTime() - now.getTime();
  prorateCreditDays = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));

  if (prorateCreditDays > 0) {
    message = `您当前的订阅还剩 ${prorateCreditDays} 天。升级后，这些天数将转换为新计划的抵扣额度。`;
  }
}

// 计算升级价格
const upgradeAmount = getAmountByCurrencyCN(currency, billingCycle, targetPlan);

return NextResponse.json({
  success: true,
  action: "upgrade",
  amount: upgradeAmount,
  prorateCreditDays,  // 剩余天数（可用于抵扣）
  message,
});
```

**示例**: Free → Pro, Pro → Enterprise

---

## 支付创建流程

### API 端点: POST /api/payment/cn/create

**位置**: [app/api/payment/cn/create/route.ts:38-199](app/api/payment/cn/create/route.ts#L38-L199)

### 请求参数

```typescript
{
  method: "wechat" | "alipay",          // 支付方式
  mode: "qrcode" | "page",              // 支付模式
  amount: number,                       // 金额
  currency: "CNY",                      // 货币
  planType: "pro" | "enterprise",       // 计划类型
  billingCycle: "monthly" | "yearly",   // 账单周期
  returnUrl?: string,                   // 支付完成后的回跳地址
}
```

### 处理流程

#### 1️⃣ 验证用户认证 (第41-47行)

```typescript
const authResult = await requireAuth(request);
if (!authResult.success) {
  return NextResponse.json({
    success: false,
    error: "未授权，请先登录"
  }, { status: 401 });
}
```

#### 2️⃣ 测试模式处理 (第70-75行)

```typescript
let finalAmount = amount;
if (isPaymentTestMode) {
  finalAmount = TEST_MODE_AMOUNT;  // 0.01 元
  console.log(`🧪 测试模式：支付金额改为 ¥${finalAmount}`);
}
```

**测试模式自动启用条件**:
- 开发环境 (`NODE_ENV === 'development'`)
- 或显式设置 `PAYMENT_TEST_MODE=true`

#### 3️⃣ 防重复支付检查 (第77-121行)

```typescript
// 检查1分钟内是否有相同金额的支付请求
const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

const recentPaymentsResult = await db
  .collection("payments")
  .where({
    user_id: userId,
    amount: finalAmount,
    status: cmd.in(["pending", "completed"]),
    created_at: cmd.gte(oneMinuteAgo),
  })
  .limit(1)
  .get();

if (recentPayments.length > 0) {
  return NextResponse.json({
    success: false,
    error: "您有一个待处理的支付请求，请稍后再试",
    code: "DUPLICATE_PAYMENT_REQUEST",
  }, { status: 429 });
}
```

#### 4️⃣ 创建支付订单 (第136-143行)

```typescript
const orderResult = await adapter.createOrder(finalAmount, userId, method, {
  currency,
  description: `${planType}会员 - ${billingCycle}`,
  billingCycle,
  planType,
  mode: actualMode,
  returnUrl: paymentReturnUrl,
});
```

**返回**:
- 微信支付: 二维码 URL (`qrCodeUrl`)
- 支付宝: 支付页面 URL (`paymentUrl`) 或二维码 URL

#### 5️⃣ 记录支付到数据库 (第155-163行)

```typescript
const paymentResult = await cloudbaseAdapter.createPayment({
  user_id: userId,
  amount: finalAmount,
  currency,
  status: "pending",
  payment_method: method,
  transaction_id: orderResult.orderId,
  metadata: {
    days: getDaysByBillingCycleCN(billingCycle),  // 30 或 365
    billingCycle,
    planType,
    paymentMethod: method,
    paymentMode: actualMode,
  },
});
```

#### 6️⃣ 返回支付信息 (第181-191行)

```typescript
return NextResponse.json({
  success: true,
  orderId: orderResult.orderId,
  mode: actualMode,
  qrCodeUrl: orderResult.qrCodeUrl,    // 微信支付二维码
  paymentUrl: orderResult.paymentUrl,  // 支付宝支付链接
  method,
  amount: finalAmount,
  currency,
  testMode: isPaymentTestMode,
});
```

---

## 支付成功处理

### API 端点: POST /api/payment/cn/{method}/notify

**位置**:
- 微信: [app/api/payment/cn/wechat/notify/route.ts:38-103](app/api/payment/cn/wechat/notify/route.ts#L38-L103)
- 支付宝: [app/api/payment/cn/alipay/notify/route.ts](app/api/payment/cn/alipay/notify/route.ts)

### 处理流程

#### 1️⃣ 验证支付通知签名

确保通知来自微信/支付宝官方服务器。

#### 2️⃣ 查找支付记录 (第46-54行)

```typescript
const paymentsCollection = getCloudBaseDatabase().collection("payments");

const result = await paymentsCollection
  .where({
    transaction_id: orderId,
    status: "pending",
  })
  .get();

const payment = result.data?.[0];
```

#### 3️⃣ 更新支付状态 (第64-72行)

```typescript
await paymentsCollection.doc(payment._id).update({
  status: "completed",
  completed_at: now,
  updated_at: now,
  metadata: {
    ...payment.metadata,
    wechatTransactionId: result.transactionId,  // 微信交易号
  },
});
```

#### 4️⃣ 创建用户订阅 (第74-86行)

```typescript
const { days, planType, billingCycle } = payment.metadata || {};
const subscriptionEndDate = new Date();
subscriptionEndDate.setDate(subscriptionEndDate.getDate() + (days || 30));

await cloudbaseAdapter.createSubscription({
  user_id: payment.user_id,
  subscription_end: subscriptionEndDate.toISOString(),
  status: "active",
  plan_type: planType || "pro",
  currency: payment.currency || "CNY",
});
```

**关键点**:
- `subscription_end` = 当前时间 + 天数 (月付30天，年付365天)
- `status` = "active"
- `plan_type` = 支付时选择的计划

---

## 订阅创建逻辑

### 方法: createSubscription()

**位置**: [lib/database/adapters/cloudbase-user.ts:219-247](lib/database/adapters/cloudbase-user.ts#L219-L247)

### 完整逻辑

```typescript
async createSubscription(
  subscription: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>
): Promise<MutationResult> {
  const collection = this.db.collection("user_subscriptions");
  const now = nowISO();

  const newSubscription = {
    ...subscription,
    created_at: now,
    updated_at: now,
  };

  // 1. 创建新的订阅记录
  const result = await collection.add(newSubscription);

  // 2. 同时更新用户的订阅状态
  await this.updateUser(subscription.user_id, {
    subscription_plan: subscription.plan_type,
    subscription_status: subscription.status,
  });

  return { success: true, id: result.id };
}
```

### 关键特性

✅ **创建新订阅，不更新旧订阅**
- 每次支付都创建**全新的**订阅记录
- 旧的订阅记录保留，不会被修改

✅ **同时更新用户表**
- 更新 `users.subscription_plan` 为新计划
- 更新 `users.subscription_status` 为 "active"

✅ **允许一个用户有多个订阅**
- 可能的订阅状态:
  - 1个过期订阅 + 1个活跃订阅 (升级场景)
  - 多个过期订阅 + 1个活跃订阅 (多次续费)

---

## 与过期清理的交互

### 问题场景

用户升级后会有两个订阅:
1. **旧订阅**: `status="active"`, `subscription_end` = 过去日期 (已过期)
2. **新订阅**: `status="active"`, `subscription_end` = 未来日期 (有效)

### 批量清理的智能处理 (已优化)

**位置**: [app/api/subscription/cleanup-expired/route.ts:86-145](app/api/subscription/cleanup-expired/route.ts#L86-L145)

```typescript
// 1. 检查用户是否有其他活跃订阅
const activeSubsResult = await db
  .collection("user_subscriptions")
  .where({
    user_id: subscription.user_id,
    status: "active",
  })
  .get();

// 2. 过滤出未过期的活跃订阅（排除当前要处理的订阅）
const hasActiveSubscription = activeSubsResult.data.some((activeSub) =>
  activeSub._id !== subscription._id &&
  activeSub.subscription_end >= now
);

// 3. 只有当用户没有其他活跃订阅时，才降级为 free
if (!hasActiveSubscription) {
  // 真正过期了 → 降级为 free
  await db.collection("users").doc(userId).update({
    subscription_plan: "free",
  });
} else {
  // 用户刚升级 → 保持 pro/enterprise
  console.log('用户有其他活跃订阅，保持当前计划');
}
```

### 处理结果对比

| 场景 | 旧订阅状态 | 新订阅状态 | 用户计划 |
|------|-----------|-----------|----------|
| **订阅过期** | expired | ❌ 无 | free ✅ |
| **用户升级** | expired ✅ | active ✅ | pro/enterprise ✅ |

---

## 📊 数据库状态变化

### 用户升级前

**users 集合**:
```json
{
  "_id": "user123",
  "subscription_plan": "free",
  "subscription_status": "inactive"
}
```

**user_subscriptions 集合**: (无记录)

### 用户升级后

**users 集合**:
```json
{
  "_id": "user123",
  "subscription_plan": "pro",          // ✅ 更新为 pro
  "subscription_status": "active"       // ✅ 更新为 active
}
```

**user_subscriptions 集合**:
```json
[
  {
    "_id": "sub_new",
    "user_id": "user123",
    "plan_type": "pro",
    "status": "active",
    "subscription_end": "2025-02-15T00:00:00.000Z",  // 30天后
    "created_at": "2025-01-16T00:00:00.000Z"
  }
]
```

### 批量清理后 (假设用户之前有旧订阅)

**user_subscriptions 集合**:
```json
[
  {
    "_id": "sub_old",
    "user_id": "user123",
    "plan_type": "free",
    "status": "expired",                // ✅ 标记为 expired
    "subscription_end": "2025-01-10T00:00:00.000Z"  // 已过期
  },
  {
    "_id": "sub_new",
    "user_id": "user123",
    "plan_type": "pro",
    "status": "active",                 // ✅ 保持 active
    "subscription_end": "2025-02-15T00:00:00.000Z"
  }
]
```

**users 集合**:
```json
{
  "_id": "user123",
  "subscription_plan": "pro",           // ✅ 保持 pro (不会降级)
  "subscription_status": "active"
}
```

---

## 🎯 关键总结

### ✅ 支持的操作

| 操作 | 允许? | 说明 |
|------|------|------|
| Free → Pro | ✅ | 升级 |
| Free → Enterprise | ✅ | 升级 |
| Pro → Enterprise | ✅ | 升级 |
| Pro → Pro | ✅ | 续订 |
| Enterprise → Enterprise | ✅ | 续订 |
| Pro → Free | ❌ | 不支持降级 |
| Enterprise → Pro | ❌ | 不支持降级 |

### 💰 定价

- **Pro 月付**: ¥19.9/月
- **Pro 年付**: ¥199/年 (折扣 ~17%)
- **Enterprise 月付**: ¥49.9/月
- **Enterprise 年付**: ¥499/年 (折扣 ~17%)

### 🔄 订阅周期

- **月付**: 30天
- **年付**: 365天

### ⚙️ 测试模式

开发环境或 `PAYMENT_TEST_MODE=true` 时，所有支付金额自动改为 **¥0.01**

### 🧹 过期清理

- ✅ 自动检测过期订阅 (用户访问时)
- ✅ 批量清理过期订阅 (API接口)
- ✅ 智能处理升级场景 (不误降级)

---

## 📁 相关文件

### 核心逻辑
- [app/api/subscription/upgrade/route.ts](app/api/subscription/upgrade/route.ts) - 升级资格检查
- [app/api/payment/cn/create/route.ts](app/api/payment/cn/create/route.ts) - 创建支付
- [app/api/payment/cn/wechat/notify/route.ts](app/api/payment/cn/wechat/notify/route.ts) - 微信支付回调
- [app/api/payment/cn/alipay/notify/route.ts](app/api/payment/cn/alipay/notify/route.ts) - 支付宝回调
- [lib/database/adapters/cloudbase-user.ts](lib/database/adapters/cloudbase-user.ts) - 订阅创建

### 配置
- [lib/payment/payment-config-cn.ts](lib/payment/payment-config-cn.ts) - 价格和规则配置

### 清理
- [app/api/subscription/cleanup-expired/route.ts](app/api/subscription/cleanup-expired/route.ts) - 批量清理API
- [lib/subscription/usage-tracker.ts](lib/subscription/usage-tracker.ts) - 自动过期检测

---

## 🔍 常见问题

### Q1: 用户升级时，旧订阅会被删除吗?
**A**: 不会。旧订阅保留，但会被批量清理 API 标记为 "expired"。

### Q2: 如果用户升级时还有剩余天数怎么办?
**A**: 系统会计算剩余天数 (`prorateCreditDays`)，并提示用户这些天数可以抵扣。但实际计算需要在业务逻辑中实现（当前代码只计算，未实际抵扣）。

### Q3: 支付成功后，用户立即获得新计划吗?
**A**: 是的。支付回调会立即创建新订阅并更新用户的 `subscription_plan`。

### Q4: 批量清理会误删刚升级的用户吗?
**A**: 不会。清理逻辑会检查用户是否有其他活跃订阅，只有在没有其他活跃订阅时才会降级。

### Q5: 用户可以同时有多个活跃订阅吗?
**A**: 理论上可以，但系统只识别最新的有效订阅。旧订阅会被标记为 "expired"。

### Q6: 年付和月付可以混着买吗?
**A**: 可以。每次支付都会创建新的订阅记录，系统会识别最新的有效订阅。

---

## 📝 未来改进建议

1. **按比例抵扣**: 实际使用剩余天数抵扣新计划的费用
2. **升级优惠**: 升级到更高级计划时给予折扣
3. **订阅转移**: 将旧订阅的剩余时间转移到新订阅
4. **多订阅管理**: 允许用户查看和管理所有历史订阅
5. **自动续费**: 实现订阅到期前自动续费功能
