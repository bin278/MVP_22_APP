# 国际版支付数据库对比与更新

## 📊 表结构对比

### 当前项目 vs MVP_22 项目

| 表名 | 当前项目 | MVP_22 | 状态 | 说明 |
|-----|---------|---------|------|------|
| **subscriptions** | ✅ | ✅ | ✅ | 完全一致 |
| **user_subscriptions** | ⚠️ 简化版 | ✅ 完整版 | 🔄 需更新 | MVP_22 有更多字段 |
| **payments** | ⚠️ 简化版 | ✅ 完整版 | 🔄 需更新 | MVP_22 有更多字段 |
| **webhook_events** | ✅ | ✅ | ✅ | 完全一致 |
| **user_usage_stats** | ❌ 缺失 | ✅ | 🆕 需添加 | **重要!** |
| **user_credit_packages** | ✅ | ✅ | ✅ | 完全一致 |
| **recommendation_usage** | ⚠️ 基础版 | ✅ 完整版 | ✅ | 基本一致 |

---

## 🔍 主要差异

### 1️⃣ **user_subscriptions 表差异**

**当前项目字段:**
```sql
- id, user_id, plan_type, status, subscription_end, provider, metadata
- created_at, updated_at
```

**MVP_22 额外字段:**
```sql
+ subscription_tier TEXT (free, basic, pro, premium)  -- 订阅等级
+ current_period_start TIMESTAMP  -- 当前周期开始
+ current_period_end TIMESTAMP    -- 当前周期结束
+ cancel_at_period_end BOOLEAN    -- 周期结束后取消
+ stripe_subscription_id TEXT UNIQUE
+ stripe_customer_id TEXT
+ paypal_subscription_id TEXT
```

### 2️⃣ **payments 表差异**

**当前项目字段:**
```sql
- id, user_id, amount, currency, payment_method, payment_type
- plan_type, billing_cycle, status
- stripe_session_id, stripe_customer_id, paypal_order_id, paypal_payment_id
- metadata, created_at, updated_at
```

**MVP_22 额外字段:**
```sql
+ subscription_id UUID (REFERENCES subscriptions)  -- 关联订阅
+ transaction_id VARCHAR(255)  -- 第三方交易ID
+ stripe_payment_intent_id VARCHAR(255)
+ wechat_transaction_id VARCHAR(255)
+ wechat_prepay_id VARCHAR(255)
+ alipay_trade_no VARCHAR(255)
+ completed_at TIMESTAMP
```

### 3️⃣ **user_usage_stats 表** (当前项目缺失!)

**MVP_22 完整字段:**
```sql
CREATE TABLE user_usage_stats (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  requests_today INTEGER DEFAULT 0,
  requests_this_month INTEGER DEFAULT 0,
  last_request_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id)  -- 每个用户只有一条记录
);
```

**功能:**
- ✅ 追踪每日/每月请求次数
- ✅ 实现使用量限制
- ✅ 自动重置计数器
- ✅ 配合 `check_user_limits()` 函数使用

### 4️⃣ **辅助函数** (当前项目缺失!)

**MVP_22 包含的函数:**

#### 1. `get_user_subscription_tier(user_uuid UUID)`
- 获取用户当前订阅等级
- 返回: free, basic, pro, premium

#### 2. `can_user_use_model(user_uuid UUID, model_id TEXT)`
- 检查用户是否有权限使用特定模型
- 根据订阅等级返回布尔值

#### 3. `update_user_usage(user_uuid UUID)`
- 更新用户使用统计
- 自动重置日/月计数器

#### 4. `check_user_limits(user_uuid UUID)`
- 检查用户是否超过使用限制
- 返回 JSON 格式的限制信息

---

## ✅ 解决方案

### 使用新的 SQL 脚本

**文件:** [scripts/create-intl-payment-tables-v2.sql](scripts/create-intl-payment-tables-v2.sql)

这个脚本包含:

✅ 所有 MVP_22 的表结构
✅ 所有 MVP_22 的辅助函数
✅ 完整的索引优化
✅ 行级安全策略 (RLS)
✅ 触发器自动更新 updated_at

### 执行步骤

1. **备份现有数据** (如果有的话)
```sql
-- 可选:备份现有表
CREATE TABLE payments_backup AS SELECT * FROM payments;
CREATE TABLE user_subscriptions_backup AS SELECT * FROM user_subscriptions;
```

2. **执行新脚本**
在 Supabase SQL Editor 中执行:
```sql
scripts/create-intl-payment-tables-v2.sql
```

3. **验证表结构**
```sql
-- 检查所有表是否创建成功
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN (
  'subscriptions',
  'user_subscriptions',
  'payments',
  'webhook_events',
  'user_usage_stats',
  'user_credit_packages',
  'recommendation_usage'
)
ORDER BY table_name, column_name;
```

---

## 🎯 功能增强

使用新的数据库结构后,你的项目将支持:

### ✅ 完整的订阅系统
- 多等级订阅 (free, basic, pro, premium)
- 周期管理 (月付/年付)
- 自动续费支持
- 订阅取消功能

### ✅ 使用量追踪
- 每日请求次数统计
- 每月请求次数统计
- 自动重置功能
- 使用量限制检查

### ✅ 模型权限控制
- 根据订阅等级限制可用模型
- 灵活的权限配置
- 实时权限检查

### ✅ 支付集成
- Stripe 完整支持
- PayPal 完整支持
- 微信支付 (国内版)
- 支付宝 (国内版)

### ✅ 加油包系统
- 次卡购买
- 自动过期处理
- FIFO 消耗算法

---

## 📝 迁移建议

### 如果已有数据

1. **不要删除旧表**,使用 ALTER TABLE 添加缺失字段:

```sql
-- 为 user_subscriptions 添加缺失字段
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;

-- 创建 user_usage_stats 表
CREATE TABLE IF NOT EXISTS user_usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  requests_today INTEGER DEFAULT 0,
  requests_this_month INTEGER DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

2. **数据迁移**
```sql
-- 迁移现有订阅数据
INSERT INTO user_subscriptions (user_id, subscription_tier, status)
SELECT user_id,
       CASE plan_type
         WHEN 'pro' THEN 'pro'
         WHEN 'enterprise' THEN 'premium'
         ELSE 'free'
       END,
       status
FROM subscriptions
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions WHERE user_subscriptions.user_id = subscriptions.user_id
);
```

### 如果是新项目

直接执行完整的 SQL 脚本即可:
```bash
scripts/create-intl-payment-tables-v2.sql
```

---

## 🎉 总结

**当前项目缺少的关键功能:**

1. ❌ **user_usage_stats 表** - 使用量统计
2. ❌ **辅助函数** - 4个重要函数
3. ⚠️ **user_subscriptions 字段不完整**
4. ⚠️ **payments 字段不完整**

**解决方案:**
使用新的 [scripts/create-intl-payment-tables-v2.sql](scripts/create-intl-payment-tables-v2.sql) 脚本,完全匹配 MVP_22 的数据库结构!

---

**执行后你的项目将拥有与 MVP_22 完全一致的支付和订阅系统!** 🚀
