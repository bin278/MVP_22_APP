# 国际版使用次数追踪 - 数据库设置指南

## 问题描述

国际版（Supabase）的用户在使用代码生成功能后，剩余次数没有减少。

## 根本原因

**数据库表缺失**：`recommendation_usage` 表、`user_subscriptions` 表和 `user_credit_packages` 表没有在 Supabase 数据库中创建。

## 解决方案

### 步骤 1: 执行数据库设置脚本

1. 登录 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New Query**
5. 复制并执行以下脚本之一：

**选项 A: 安全脚本（推荐）**
- 脚本: [setup-intl-usage-tracking-safe.sql](setup-intl-usage-tracking-safe.sql)
- 优点: 不会删除现有数据，只添加缺失的表和策略
- 适用场景: 首次设置或已有部分表的情况

**选项 B: 完全重置脚本**
- 脚本: [setup-intl-usage-tracking-clean.sql](setup-intl-usage-tracking-clean.sql)
- 警告: 会删除现有数据！
- 适用场景: 需要完全重建表结构或遇到严重错误时

```bash
# 或使用 Supabase CLI
supabase db execute -f scripts/setup-intl-usage-tracking-safe.sql
```

### 步骤 2: 验证表创建

执行验证查询（包含在脚本末尾），你应该看到以下表结构：

#### user_subscriptions
| 列名 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户 ID |
| plan_type | varchar | 计划类型 (free/pro/enterprise) |
| status | varchar | 状态 (active/cancelled/expired) |
| subscription_start | timestamp | 订阅开始时间 |
| subscription_end | timestamp | 订阅结束时间 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

#### user_credit_packages
| 列名 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户 ID |
| package_type | varchar | 加油包类型 (basic/standard/premium) |
| package_id | varchar | 加油包 ID |
| credits_total | integer | 总次数 |
| credits_remaining | integer | 剩余次数 |
| price | decimal | 价格 |
| currency | varchar | 货币 |
| status | varchar | 状态 (active/expired/used_up) |
| expiry_date | timestamp | 过期时间 |
| purchase_date | timestamp | 购买时间 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

#### recommendation_usage
| 列名 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户 ID |
| metadata | jsonb | 元数据（包含模型、生成类型等） |
| created_at | timestamp | 创建时间 |

#### recommendation_history
| 列名 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户 ID |
| recommendation | jsonb | 推荐内容 |
| created_at | timestamp | 创建时间 |

### 步骤 3: 初始化用户订阅

对于现有用户，需要初始化他们的订阅记录：

```sql
-- 为所有现有用户添加 FREE 订阅
INSERT INTO public.user_subscriptions (user_id, plan_type, status, subscription_start)
SELECT id, 'free', 'active', NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions);
```

### 步骤 4: 测试

1. 在应用中完成一次代码生成
2. 运行诊断脚本检查使用情况：
```bash
node scripts/check-intl-usage.js <user_id>
```

你应该看到：
- 本月已使用次数: 1
- 剩余次数: 29

## 使用次数扣除逻辑

### 优先级

1. **加油包优先**: 如果用户有活跃的加油包且有剩余次数，优先从加油包扣除（先进先出）
2. **订阅额度**: 如果没有加油包或加油包已用完，从订阅限额扣除

### 统计计算

```
总可用次数 = 订阅限额 + 所有活跃加油包的剩余次数
剩余次数 = 总可用次数 - 本月已使用次数
```

### 加油包扣除规则

- **先进先出 (FIFO)**: 按购买时间排序，先扣除最早购买的加油包
- **过期检查**: 自动标记过期加油包为 `expired`
- **用完标记**: 加油包次数为 0 时，标记为 `used_up`

注意：**从加油包扣除时，不会增加 `recommendation_usage` 表的记录数**

## 常见问题

### Q: 为什么使用了代码生成，`recommendation_usage` 表的记录数没有增加？

**A**: 这通常意味着使用次数是从加油包扣除的。这是正常行为。检查 `user_credit_packages` 表，你应该能看到某个加油包的 `credits_remaining` 减少了 1。

### Q: 加油包次数没有减少？

**A**:
1. 检查服务器日志，确认走的是国际版还是国内版
2. 检查环境变量 `DATABASE_PROVIDER=supabase` 和 `AUTH_PROVIDER=supabase`
3. 使用诊断脚本查看加油包状态

### Q: 如何确认是国际版还是国内版？

**A**: 查看服务器日志中的 `🌍 部署环境检查`:

```
🌍 部署环境检查: {
  isChinaDeployment: false,  // false = 国际版
  authProvider: 'supabase',
  dbProvider: 'supabase'
}
```

或者检查 `.env.local` 文件:

```bash
# 国际版
DATABASE_PROVIDER=supabase
AUTH_PROVIDER=supabase

# 国内版
DATABASE_PROVIDER=cloudbase
AUTH_PROVIDER=cloudbase
```

## 相关文件

- `lib/subscription/usage-tracker.ts` - 使用次数追踪逻辑
- `lib/config/deployment.config.ts` - 部署环境配置
- `scripts/check-intl-usage.js` - 诊断脚本
- `scripts/setup-intl-usage-tracking.sql` - 数据库设置脚本
- `app/api/test-intl-usage/route.ts` - 测试 API 端点
- `scripts/test-usage-deduction.js` - 简单的测试脚本
