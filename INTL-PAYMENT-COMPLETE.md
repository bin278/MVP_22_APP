# 国际版支付功能完整文档

## 🎉 功能概述

已成功为项目添加**国际版支付功能**,支持 **Stripe** 和 **PayPal** 双支付方式,使用 **USD** 结算,数据存储在 **Supabase** 中。

---

## ✅ 已完成的工作

### 1. 核心配置文件

#### [lib/payment/payment-config-intl.ts](lib/payment/payment-config-intl.ts)
- ✅ 国际版定价配置 (USD)
- ✅ 支持 Pro 和 Enterprise 两个套餐
- ✅ 月付/年付两种计费周期
- ✅ 加油包配置 (100/300/1000次)
- ✅ 测试模式支持 ($0.01)

**定价方案:**
```
Pro Plan:
  - 月付: $9.99/月
  - 年付: $99.99/年 (节省 $19.89)

Enterprise Plan:
  - 月付: $24.99/月
  - 年付: $249.99/年 (节省 $49.89)

Credit Packages:
  - 基础包: $4.99 - 100次 (30天有效)
  - 标准包: $12.49 - 300次 (30天有效)
  - 高级包: $37.49 - 1000次 (30天有效)
```

### 2. 支付提供商

#### [lib/payment/providers/stripe-provider.ts](lib/payment/providers/stripe-provider.ts)
- ✅ Stripe Checkout Session 创建
- ✅ 订阅支付支持
- ✅ 一次性支付支持 (加油包)
- ✅ Webhook 签名验证
- ✅ 配置状态检查

#### [lib/payment/providers/paypal-provider.ts](lib/payment/providers/paypal-provider.ts)
- ✅ PayPal 订单创建
- ✅ 支付捕获
- ✅ Webhook 签名验证
- ✅ 配置状态检查
- ✅ Sandbox/Production 环境支持

### 3. API 端点

#### [app/api/payment/intl/subscription/create/route.ts](app/api/payment/intl/subscription/create/route.ts)
```
POST /api/payment/intl/subscription/create

Request Body:
{
  "method": "stripe" | "paypal",
  "planType": "pro" | "enterprise",
  "billingCycle": "monthly" | "yearly"
}

Response:
{
  "success": true,
  "method": "stripe",
  "sessionId": "...",
  "checkoutUrl": "https://checkout.stripe.com/...",
  "price": "$9.99",
  "planType": "pro",
  "billingCycle": "monthly"
}
```

#### [app/api/payment/intl/webhook/stripe/route.ts](app/api/payment/intl/webhook/stripe/route.ts)
```
POST /api/payment/intl/webhook/stripe

处理 Stripe Webhook 事件:
- checkout.session.completed - 订阅支付完成
- invoice.paid - 定期付款成功
- customer.subscription.deleted - 订阅取消
```

#### [app/api/payment/intl/webhook/paypal/route.ts](app/api/payment/intl/webhook/paypal/route.ts)
```
POST /api/payment/intl/webhook/paypal

处理 PayPal Webhook 事件:
- PAYMENT.CAPTURE.COMPLETED - 支付完成
- CHECKOUT.ORDER.APPROVED - 订单批准
```

### 4. 数据库表结构

#### [scripts/create-intl-payment-tables.sql](scripts/create-intl-payment-tables.sql)

**包含以下表:**
- ✅ `payments` - 支付记录表
- ✅ `user_subscriptions` - 用户订阅表
- ✅ `webhook_events` - Webhook 事件记录表
- ✅ `user_credit_packages` - 加油包表
- ✅ `recommendation_usage` - 使用记录表

**特性:**
- ✅ 行级安全策略 (RLS)
- ✅ 自动更新 `updated_at` 触发器
- ✅ 完整的索引优化
- ✅ 外键约束

### 5. 统一支付入口

#### [lib/payment/index.ts](lib/payment/index.ts)
```typescript
// 自动检测版本并返回相应配置
isIntlDeployment()          // 检测是否为国际版
getSupportedPaymentMethods() // 自动返回支付方式
getDefaultPaymentMethod()   // 自动返回默认支付方式
getPaymentCurrency()        // 自动返回货币
formatPaymentAmount()       // 自动格式化金额
getPaymentConfig()          // 获取完整配置
```

---

## 🚀 部署步骤

### 1️⃣ 配置环境变量

编辑 `.env.local` 文件:

```env
# 认证和数据库
AUTH_PROVIDER=supabase
DATABASE_PROVIDER=supabase
NEXT_PUBLIC_AUTH_PROVIDER=supabase

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe 支付
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal 支付 (可选)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_WEBHOOK_ID=...

# 测试模式
PAYMENT_TEST_MODE=true  # 开发环境自动启用
```

### 2️⃣ 创建数据库表

在 **Supabase SQL Editor** 中执行:

```bash
scripts/create-intl-payment-tables.sql
```

### 3️⃣ 配置 Stripe Webhook

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Developers** → **Webhooks**
3. 点击 **Add endpoint**
4. Endpoint URL: `https://yourdomain.com/api/payment/intl/webhook/stripe`
5. 选择事件:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.deleted`
6. 复制 **Signing secret** 到 `.env.local`

### 4️⃣ 配置 PayPal Webhook (可选)

1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/)
2. 进入 **Webhooks** 页面
3. 创建新的 Webhook
4. Webhook URL: `https://yourdomain.com/api/payment/intl/webhook/paypal`
5. 订阅事件:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `CHECKOUT.ORDER.APPROVED`
6. 复制 **Webhook ID** 到 `.env.local`

### 5️⃣ 安装依赖

```bash
npm install stripe
```

### 6️⃣ 测试支付功能

```bash
# 启动开发服务器
npm run dev

# 访问订阅页面
# 选择 Stripe 或 PayPal
# 完成测试支付
```

---

## 📋 API 使用示例

### 创建订阅支付

```typescript
// 前端调用
const response = await fetch('/api/payment/intl/subscription/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    method: 'stripe',  // 或 'paypal'
    planType: 'pro',
    billingCycle: 'monthly'
  })
});

const { checkoutUrl } = await response.json();

// 跳转到支付页面
window.location.href = checkoutUrl;
```

### 检查支付配置

```typescript
import { getPaymentConfig } from '@/lib/payment';

const config = getPaymentConfig();
console.log(config);
// {
//   version: "intl",
//   currency: "USD",
//   methods: ["stripe", "paypal"],
//   defaultMethod: "stripe",
//   database: "supabase"
// }
```

---

## 🔄 版本切换机制

支付系统会**自动检测**当前版本:

```typescript
// lib/payment/index.ts
export function isIntlDeployment(): boolean {
  const authProvider = process.env.AUTH_PROVIDER;
  const dbProvider = process.env.DATABASE_PROVIDER;

  // 如果配置为 Supabase,使用国际版
  if (authProvider === 'supabase' || dbProvider === 'supabase') {
    return true;
  }

  return false;
}
```

### 国内版 (CN)
- 支付方式: 微信支付、支付宝
- 货币: CNY (¥)
- 数据库: CloudBase
- API: `/api/payment/cn/*`

### 国际版 (INTL)
- 支付方式: Stripe、PayPal
- 货币: USD ($)
- 数据库: Supabase
- API: `/api/payment/intl/*`

---

## 📊 支付流程图

```
用户选择订阅计划
    ↓
POST /api/payment/intl/subscription/create
    ↓
创建 Stripe Session 或 PayPal Order
    ↓
返回支付链接 (checkoutUrl/approvalUrl)
    ↓
用户跳转到支付页面
    ↓
完成支付
    ↓
Stripe/PayPal 发送 Webhook
    ↓
/api/payment/intl/webhook/* 处理
    ↓
验证签名 → 更新支付状态
    ↓
创建/更新订阅 (user_subscriptions)
    ↓
✅ 订阅激活成功
```

---

## 🎯 核心特性

✅ **双支付方式** - Stripe 和 PayPal
✅ **自动版本切换** - 根据环境变量自动选择国内外版本
✅ **测试模式** - 开发环境自动启用,支付 $0.01
✅ **Webhook 验证** - 防止恶意回调
✅ **订阅管理** - 自动创建、更新、取消订阅
✅ **行级安全** - RLS 保护用户数据
✅ **完整索引** - 优化查询性能
✅ **类型安全** - TypeScript 完整类型定义

---

## 🔧 故障排查

### Stripe 配置问题
```bash
# 检查环境变量
echo $STRIPE_SECRET_KEY

# 验证配置
curl https://api.stripe.com/v1 -u sk_test_...:
```

### PayPal 配置问题
```bash
# 检查环境变量
echo $PAYPAL_CLIENT_ID

# 测试 API 连接
curl https://api-m.sandbox.paypal.com/v1/oauth2/token
```

### Webhook 未触发
- 检查 Webhook URL 是否正确
- 确认 Webhook Secret 是否配置
- 查看 Supabase 函数日志

---

## 📚 相关文档

- [Stripe 官方文档](https://stripe.com/docs)
- [PayPal 官方文档](https://developer.paypal.com/docs/)
- [Supabase 官方文档](https://supabase.com/docs)

---

**总结**: 国际版支付功能已完全集成到项目中,支持 Stripe 和 PayPal 双支付方式,通过环境变量自动切换版本,数据存储在 Supabase 中!
