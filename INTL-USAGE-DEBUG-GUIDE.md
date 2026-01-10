# 国际版使用次数扣除调试指南

## 问题描述

用户报告国际版使用了一次代码生成后，剩余生成次数没有减少。

## 调试工具

### 1. 使用诊断脚本（推荐）

#### 检查用户使用情况

```bash
node scripts/check-intl-usage.js <user_id>
```

这个脚本会显示：
- 用户订阅状态
- 加油包详情（剩余次数、过期时间）
- 本月已使用次数
- 最近的10条使用记录
- 总结（剩余次数计算）

#### 示例输出

```
================================================================================
📊 检查用户使用情况: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
================================================================================

1️⃣ 检查用户订阅状态
--------------------------------------------------------------------------------
ℹ️  未找到订阅记录，用户为 FREE 计划

2️⃣ 检查加油包
--------------------------------------------------------------------------------
✅ 找到 1 个加油包:
   1. basic:
      总次数: 100, 剩余: 95
      状态: active, 过期时间: 2025-02-08T12:00:00.000Z
      购买时间: 2025-01-09T12:00:00.000Z

3️⃣ 计算当前周期
--------------------------------------------------------------------------------
当前时间: 2025-01-09T15:30:00.000Z
月度周期开始: 2025-01-01T00:00:00.000Z
月度周期结束: 2025-01-31T23:59:59.000Z

4️⃣ 检查本月推荐使用记录
--------------------------------------------------------------------------------
✅ 本月已使用次数: 5

5️⃣ 最近的10条使用记录
--------------------------------------------------------------------------------
✅ 找到 5 条最近记录:
   1. 2025-01-09T15:25:00.000Z
      元数据: {"model":"deepseek-chat","type":"code_generation"}
   ...

6️⃣ 总结
--------------------------------------------------------------------------------
当前计划: FREE
本月限额: 30
已使用: 5
剩余次数: 25

加油包额外次数: 95
总可用次数: 125

================================================================================
✅ 检查完成
================================================================================
```

### 2. 使用测试 API 端点

#### 测试使用次数扣除

```bash
curl -X POST http://localhost:3000/api/test-intl-usage \
  -H "Content-Type: application/json" \
  -d '{"userId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}'
```

这个 API 会：
1. 获取使用前的统计信息
2. 记录一次使用
3. 获取使用后的统计信息
4. 对比变化并分析结果

#### 示例响应

```json
{
  "success": true,
  "result": {
    "success": true
  },
  "stats": {
    "before": {
      "userId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "planType": "free",
      "currentPeriodUsage": 5,
      "periodLimit": 125,
      "remainingUsage": 120,
      "isUnlimited": false
    },
    "after": {
      "userId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "planType": "free",
      "currentPeriodUsage": 5,
      "periodLimit": 124,
      "remainingUsage": 119,
      "isUnlimited": false
    },
    "diff": {
      "usageDiff": 0,
      "remainingDiff": -1,
      "limitDiff": -1
    }
  }
}
```

#### 分析结果

- **usageDiff = 0**: `recommendation_usage` 表没有新增记录（从加油包扣除）
- **usageDiff = 1**: `recommendation_usage` 表新增了一条记录（从订阅额度扣除）
- **remainingDiff = -1**: 剩余次数正确减少
- **limitDiff = -1**: 总限额减少（加油包次数扣除）

### 3. 查看服务器日志

启动开发服务器并查看详细日志：

```bash
npm run dev
```

日志会显示：
- `📝 [recordRecommendationUsage] 开始记录使用...`
- `🌍 部署环境检查`: 显示是 CN 还是 INTL
- `🌍 [recordRecommendationUsageSupabase] 开始记录使用 - 国际版`
- `🔍 查询活跃的加油包...`
- `📊 加油包查询结果`: 显示找到的加油包
- `💰 准备从加油包扣除次数`: 如果从加油包扣除
- `📝 准备插入推荐使用记录到 recommendation_usage 表`: 如果从订阅额度扣除

## 使用次数扣除逻辑

### 优先级

1. **加油包优先**: 如果用户有活跃的加油包且有剩余次数，优先从加油包扣除（先进先出）
2. **订阅额度**: 如果没有加油包或加油包已用完，从订阅限额扣除

### 加油包扣除规则

- **先进先出 (FIFO)**: 按购买时间排序，先扣除最早购买的加油包
- **过期检查**: 自动标记过期加油包为 `expired`
- **用完标记**: 加油包次数为 0 时，标记为 `used_up`

### 统计计算

```
总可用次数 = 订阅限额 + 所有活跃加油包的剩余次数
剩余次数 = 总可用次数 - 本月已使用次数
```

注意：**从加油包扣除时，不会增加 `recommendation_usage` 表的记录数**

## 常见问题

### Q1: 为什么使用了代码生成，`recommendation_usage` 表的记录数没有增加？

**A**: 这通常意味着使用次数是从加油包扣除的。这是正常行为。检查 `user_credit_packages` 表，你应该能看到某个加油包的 `credits_remaining` 减少了 1。

### Q2: 加油包次数没有减少？

**A**:
1. 检查服务器日志，确认走的是国际版还是国内版
2. 检查环境变量 `DATABASE_PROVIDER=supabase` 和 `AUTH_PROVIDER=supabase`
3. 使用诊断脚本查看加油包状态

### Q3: 如何确认是国际版还是国内版？

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

## 数据库表结构

### recommendation_usage

```sql
user_id          uuid
metadata         jsonb
created_at       timestamp
```

### user_credit_packages

```sql
id               uuid
user_id          uuid
package_type     text (basic|standard|premium)
credits_total    integer
credits_remaining integer
status           text (active|expired|used_up)
expiry_date      timestamp
purchase_date    timestamp
created_at       timestamp
updated_at       timestamp
```

## 相关文件

- `lib/subscription/usage-tracker.ts`: 使用次数追踪逻辑
- `lib/config/deployment.config.ts`: 部署环境配置
- `scripts/check-intl-usage.js`: 诊断脚本
- `app/api/test-intl-usage/route.ts`: 测试 API 端点
