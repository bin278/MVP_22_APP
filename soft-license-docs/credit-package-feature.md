# 加油包功能实现文档

## ✅ 功能概述

加油包是用户可以额外购买的代码生成次数包，提供灵活的使用方式。

### 三种加油包配置

| 加油包 | 价格 | 次数 | 有效期 | 适用场景 |
|-------|------|------|--------|---------|
| **基础包** (basic) | ¥9.9 | 100次 | 30天 | 轻度用户，偶尔需要 |
| **标准包** (standard) | ¥24.9 | 300次 | 30天 | 中度用户，频繁使用 |
| **高级包** (premium) | ¥79.9 | 1000次 | 60天 | 重度用户，长期项目 |

**测试模式**: 开发环境或 `PAYMENT_TEST_MODE=true` 时，所有加油包价格为 **¥0.01**

---

## 📋 目录结构

### 1. 类型定义

**文件**: [lib/database/types.ts](lib/database/types.ts)

```typescript
// 加油包类型
export type CreditPackageType = "basic" | "standard" | "premium";

// 加油包配置
export interface CreditPackageConfig {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  credits: number;
  price: number;
  currency: string;
  validityDays: number;
}

// 用户加油包记录
export interface UserCreditPackage {
  id: string;
  user_id: string;
  package_id: string;
  package_type: CreditPackageType;
  credits_total: number;
  credits_remaining: number;
  status: 'active' | 'expired' | 'used_up';
  purchase_date: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}
```

### 2. 支付配置

**文件**: [lib/payment/payment-config-cn.ts](lib/payment/payment-config-cn.ts)

```typescript
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
```

### 3. 购买API

**端点**: `POST /api/payment/cn/credit-package/create`

**文件**: [app/api/payment/cn/credit-package/create/route.ts](app/api/payment/cn/credit-package/create/route.ts)

**请求参数**:
```typescript
{
  packageType: "basic" | "standard" | "premium",
  method: "wechat" | "alipay",
  mode: "qrcode" | "page"
}
```

**响应**:
```typescript
{
  success: true,
  orderId: string,
  qrCodeUrl: string,  // 微信支付二维码
  paymentUrl: string, // 支付宝支付链接
  amount: number,
  packageConfig: CreditPackageConfig
}
```

### 4. 支付回调处理

**文件**:
- [app/api/payment/cn/wechat/notify/route.ts](app/api/payment/cn/wechat/notify/route.ts) (微信)
- [app/api/payment/cn/alipay/notify/route.ts](app/api/payment/cn/alipay/notify/route.ts) (支付宝)

**处理逻辑**:
```typescript
// 检查支付类型
const paymentType = payment.metadata?.type;

if (paymentType === "credit_package") {
  // 处理加油包购买
  await handleCreditPackagePurchase(payment, now);
} else {
  // 处理订阅购买
  await handleSubscriptionPurchase(payment, now);
}
```

**加油包创建**:
```typescript
async function handleCreditPackagePurchase(payment: any, now: string) {
  const db = getCloudBaseDatabase();
  const { packageType, packageId, packageName, credits, validityDays } = payment.metadata || {};

  // 计算过期日期
  const purchaseDate = new Date(now);
  const expiryDate = new Date(purchaseDate);
  expiryDate.setDate(expiryDate.getDate() + (validityDays || 30));

  // 创建加油包记录
  await db.collection("user_credit_packages").add({
    user_id: payment.user_id,
    package_id: packageId,
    package_type: packageType || "basic",
    credits_total: credits || 100,
    credits_remaining: credits || 100,
    status: "active",
    purchase_date: purchaseDate.toISOString(),
    expiry_date: expiryDate.toISOString(),
    created_at: now,
    updated_at: now,
    metadata: {
      packageName,
      paymentId: payment._id,
    },
  });
}
```

---

## 🔄 使用逻辑

### 1. 查询使用统计（包含加油包）

**文件**: [lib/subscription/usage-tracker.ts:359-406](lib/subscription/usage-tracker.ts#L359-L406)

**逻辑**:
```typescript
// 查询有效的加油包
const creditPackagesResult = await db
  .collection("user_credit_packages")
  .where({
    user_id: userId,
    status: "active",
  })
  .get();

// 累加加油包剩余次数到限额
let totalCreditPackageRemaining = 0;

for (const pkg of creditPackagesResult.data) {
  // 检查是否过期
  if (pkg.expiry_date < now) {
    // 标记为过期
    await db.collection("user_credit_packages").doc(pkg._id).update({
      status: "expired",
    });
    continue;
  }

  totalCreditPackageRemaining += pkg.credits_remaining;
}

// 加油包次数加到总限额
periodLimit += totalCreditPackageRemaining;
```

**示例计算**:

| 用户计划 | 计划限额 | 加油包剩余 | 总限额 | 已使用 | 剩余 |
|---------|---------|-----------|--------|--------|------|
| Free | 30 | 0 | 30 | 5 | 25 |
| Free | 30 | 100 | 130 | 5 | 125 |
| Pro | 500 | 200 | 700 | 300 | 400 |

### 2. 记录使用（优先扣除加油包）

**文件**: [lib/subscription/usage-tracker.ts:515-580](lib/subscription/usage-tracker.ts#L515-L580)

**逻辑**:
```typescript
// 1. 查询用户的活跃加油包
const creditPackagesResult = await db
  .collection("user_credit_packages")
  .where({
    user_id: userId,
    status: "active",
  })
  .get();

// 2. 找到最早购买的有效加油包（先进先出）
let targetPackage = null;
for (const pkg of creditPackagesResult.data) {
  // 检查是否过期
  if (pkg.expiry_date < now) {
    await db.collection("user_credit_packages").doc(pkg._id).update({
      status: "expired",
    });
    continue;
  }

  // 找到第一个有剩余次数的
  if (pkg.credits_remaining > 0) {
    targetPackage = pkg;
    break;
  }
}

// 3. 如果找到加油包，扣除次数
if (targetPackage) {
  const newCreditsRemaining = targetPackage.credits_remaining - 1;

  await db.collection("user_credit_packages").doc(targetPackage._id).update({
    credits_remaining: newCreditsRemaining,
    updated_at: nowISO,
  });

  // 如果用完了，标记为 used_up
  if (newCreditsRemaining === 0) {
    await db.collection("user_credit_packages").doc(targetPackage._id).update({
      status: "used_up",
    });
  }

  return { success: true }; // 不记录到 recommendation_usage
}

// 4. 没有加油包或已用完，记录到 recommendation_usage
await db.collection("recommendation_usage").add({
  user_id: userId,
  metadata: metadata || {},
  created_at: nowISO,
});
```

**优先级**: 加油包 > 订阅额度

---

## 📊 数据库表结构

### user_credit_packages 集合

```javascript
{
  _id: string,                    // 加油包记录ID
  user_id: string,                // 用户ID
  package_id: string,             // 加油包配置ID (如 "credit-basic-100")
  package_type: string,           // 加油包类型 ("basic" | "standard" | "premium")
  credits_total: number,          // 总次数 (100, 300, 1000)
  credits_remaining: number,      // 剩余次数
  status: string,                 // 状态 ("active" | "expired" | "used_up")
  purchase_date: string,          // 购买日期 (ISO 8601)
  expiry_date: string,            // 过期日期 (ISO 8601)
  created_at: string,             // 创建时间
  updated_at: string,             // 更新时间
  metadata: {
    packageName: string,         // 加油包名称
    paymentId: string,            // 支付记录ID
  }
}
```

---

## 🧪 测试场景

### 场景 1: Free 用户购买基础加油包

**初始状态**:
- 计划: Free (30次/月)
- 已使用: 5次
- 剩余: 25次

**操作**:
1. 购买基础加油包 (100次, ¥9.9)
2. 支付成功

**结果**:
- 计划: Free (30次/月)
- 加油包: 100次剩余
- **总限额**: 30 + 100 = 130次
- **剩余**: 125次

### 场景 2: 优先扣除加油包次数

**初始状态**:
- 计划: Pro (500次/月)
- 加油包: 基础包 100次剩余
- 总限额: 600次
- 已使用: 50次 (计划)

**操作**:
1. 生成代码 1次

**结果**:
- 加油包剩余: 99次 (优先扣除)
- 计划已使用: 50次 (不变)
- 总剩余: 99 + (500 - 50) = 549次

### 场景 3: 多个加油包（先进先出）

**初始状态**:
- 计划: Free (30次/月)
- 加油包1: 基础包 30次剩余 (购买于 1月1日)
- 加油包2: 标准包 100次剩余 (购买于 1月15日)
- 总限额: 30 + 30 + 100 = 160次

**操作**:
1. 生成代码 50次

**结果**:
- 加油包1: 0次 (用完，status = "used_up")
- 加油包2: 80次剩余
- 计划: 0次使用
- 总剩余: 0 + 80 + 30 = 110次

### 场景 4: 加油包过期

**初始状态**:
- 加油包: 基础包 50次剩余
- 购买日期: 2024-01-01
- 过期日期: 2024-01-31
- 当前日期: 2024-02-01

**操作**:
1. 生成代码

**结果**:
- 加油包: 已过期 (status = "expired")
- 从计划限额扣除

---

## 💡 核心逻辑

### 1. 先进先出 (FIFO)

多个加油包时，按购买时间先后顺序使用：
```
购买顺序: 基础包 → 标准包 → 高级包
使用顺序: 基础包 → 标准包 → 高级包
```

### 2. 优先级

```
加油包次数 > 订阅计划次数
```

**好处**:
- 用户购买的额外次数优先使用
- 最大化加油包的价值
- 订阅次数作为兜底

### 3. 自动过期检测

在查询使用统计时自动检查并标记过期的加油包：
```typescript
if (pkg.expiry_date < now) {
  await db.collection("user_credit_packages").doc(pkg._id).update({
    status: "expired",
  });
}
```

### 4. 自动用完检测

当加油包次数用完时自动标记：
```typescript
if (newCreditsRemaining === 0) {
  await db.collection("user_credit_packages").doc(pkg._id).update({
    status: "used_up",
  });
}
```

---

## 🔌 API 使用示例

### 1. 创建加油包支付订单

```bash
curl -X POST http://localhost:3000/api/payment/cn/credit-package/create \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageType": "basic",
    "method": "wechat",
    "mode": "qrcode"
  }'
```

**响应**:
```json
{
  "success": true,
  "orderId": "wx_1234567890",
  "qrCodeUrl": "weixin://wxpay/bizpayurl?pr=xxxxx",
  "amount": 0.01,
  "packageConfig": {
    "id": "credit-basic-100",
    "nameZh": "基础加油包",
    "credits": 100,
    "validityDays": 30
  }
}
```

### 2. 查询使用统计（包含加油包）

```bash
curl -X GET http://localhost:3000/api/subscription/check-usage \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应**:
```json
{
  "success": true,
  "usage": {
    "current": 5,          // 计划已使用
    "limit": 130,          // 总限额 (30 + 100)
    "remaining": 125,      // 总剩余
    "isUnlimited": false
  }
}
```

---

## 📁 相关文件

### 核心功能
- [lib/database/types.ts](lib/database/types.ts) - 类型定义
- [lib/payment/payment-config-cn.ts](lib/payment/payment-config-cn.ts) - 加油包配置
- [lib/subscription/usage-tracker.ts](lib/subscription/usage-tracker.ts) - 使用统计和记录

### API
- [app/api/payment/cn/credit-package/create/route.ts](app/api/payment/cn/credit-package/create/route.ts) - 购买API
- [app/api/payment/cn/wechat/notify/route.ts](app/api/payment/cn/wechat/notify/route.ts) - 微信回调
- [app/api/payment/cn/alipay/notify/route.ts](app/api/payment/cn/alipay/notify/route.ts) - 支付宝回调

---

## ✅ 功能特性

- ✅ 三种加油包类型 (100/300/1000次)
- ✅ 支付宝和微信支付
- ✅ 测试模式自动启用
- ✅ 先进先出使用逻辑
- ✅ 优先扣除加油包次数
- ✅ 自动过期检测
- ✅ 自动用完检测
- ✅ 完整的错误处理
- ✅ 详细的日志记录

---

## 🎯 使用场景

### 适合购买加油包的用户

1. **Free 用户**: 本月 30 次不够用，不想升级到 Pro
2. **临时项目**: 短期需要大量生成代码
3. **试用体验**: 想先付费试用，再决定是否订阅
4. **补充次数**: Pro 用户本月 500 次用完了

### 优势

- ✅ **灵活**: 按需购买，不强制订阅
- ✅ **经济**: 基础包只需 ¥9.9 (100次)
- ✅ **无门槛**: 所有用户都可以购买
- ✅ **叠加**: 可与订阅叠加使用
- ✅ **有效期**: 30-60天，时间充足

---

## 💰 收益分析

### 用户价值

| 用户类型 | 月费 | 加油包 | 总支出 | 总次数 | 性价比 |
|---------|------|--------|--------|--------|--------|
| Free | ¥0 | ¥9.9 | ¥9.9 | 130次 | ¥0.076/次 |
| Pro | ¥19.9 | ¥0 | ¥19.9 | 500次 | ¥0.040/次 |
| Free + 2加油包 | ¥0 | ¥19.8 | ¥19.8 | 230次 | ¥0.086/次 |
| Pro + 加油包 | ¥19.9 | ¥9.9 | ¥29.8 | 600次 | ¥0.050/次 |

**结论**: Pro 用户性价比最高，但加油包为 Free 用户提供了灵活的补充方案。

---

## 🔮 未来改进

1. **优惠活动**: 节日打折、满减活动
2. **订阅用户折扣**: Pro/Enterprise 用户购买加油包享受折扣
3. **赠送功能**: 购买加油包赠送好友
4. **批量购买**: 一次性购买多个加油包享受优惠
5. **定时任务**: 加油包即将过期时发送提醒
6. **数据统计**: 用户加油包使用情况分析

---

## 📝 总结

加油包功能为用户提供了：
- **灵活性**: 不强制订阅，按需购买
- **经济性**: ¥9.9 起步，价格亲民
- **便利性**: 即买即用，立即生效
- **可靠性**: 先进先出，自动管理

这个功能特别适合：
- 轻度用户补充次数
- 临时项目大量使用
- 试用体验后再订阅

结合订阅系统，形成了完整的变现体系！
