# 🎯 国际版使用次数扣除问题 - 完整解决方案

## 问题描述

用户报告：国际版使用了一次代码生成后，剩余生成次数没有减少。

## 根本原因

Supabase 数据库中缺少必要的表结构，导致使用记录无法保存。

### 缺失的表
1. ❌ `user_subscriptions` - 用户订阅信息
2. ❌ `user_credit_packages` - 加油包记录
3. ❌ `recommendation_usage` - 使用记录
4. ❌ `recommendation_history` - 推荐历史

## 解决方案

### 📋 可用的脚本

根据你的情况选择合适的脚本：

| 脚本文件 | 适用场景 | 特点 |
|---------|---------|------|
| **[fix-intl-usage-tables.sql](scripts/fix-intl-usage-tables.sql)** ⭐ | 表已存在但结构不完整 | 保留数据，添加缺失列 |
| [setup-intl-usage-tracking-safe.sql](scripts/setup-intl-usage-tracking-safe.sql) | 新项目或表不存在 | 安全创建，不删除数据 |
| [setup-intl-usage-tracking-clean.sql](scripts/setup-intl-usage-tracking-clean.sql) | 需要完全重建 | 删除所有表和数据 |

### 🔧 执行步骤

#### 方法 1: 使用 Supabase Dashboard（推荐）

1. 登录 https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New Query**
5. 根据你的情况选择并复制脚本内容
6. 点击 **Run** 执行

#### 方法 2: 使用 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接到项目
supabase link --project-ref YOUR_PROJECT_REF

# 执行脚本
supabase db execute -f scripts/fix-intl-usage-tables.sql
```

### 📝 执行后验证

脚本执行后会自动显示：
- ✅ 表创建状态
- 📊 用户订阅统计
- ✅ 完成提示

### 🧪 测试功能

1. **重启开发服务器**
   ```bash
   npm run dev
   ```

2. **在应用中完成一次代码生成**

3. **运行诊断脚本**
   ```bash
   node scripts/check-intl-usage.js <user_id>
   ```

4. **预期结果**
   ```
   本月已使用次数: 1
   剩余次数: 29
   ```

## 代码逻辑说明

### 扣除优先级

1. **加油包优先** - 如果用户有活跃加油包，优先扣除
2. **订阅额度** - 加油包用完后，从订阅限额扣除

### 记录方式

- **从加油包扣除**: `credits_remaining - 1`，不记录到 `recommendation_usage`
- **从订阅扣除**: 在 `recommendation_usage` 表插入新记录

### 计算公式

```
总可用次数 = 订阅限额 + 所有活跃加油包的剩余次数
剩余次数 = 总可用次数 - 本月已使用次数
```

## 相关文件

### 核心代码
- [lib/subscription/usage-tracker.ts](lib/subscription/usage-tracker.ts) - 使用次数追踪逻辑
- [lib/config/deployment.config.ts](lib/config/deployment.config.ts) - 部署环境配置
- [lib/subscription/features.ts](lib/subscription/features.ts) - 订阅计划配置

### 诊断工具
- [scripts/check-intl-usage.js](scripts/check-intl-usage.js) - 使用情况诊断
- [scripts/test-usage-deduction.js](scripts/test-usage-deduction.js) - 简单测试脚本
- [app/api/test-intl-usage/route.ts](app/api/test-intl-usage/route.ts) - 测试 API 端点

### 数据库脚本
- [scripts/fix-intl-usage-tables.sql](scripts/fix-intl-usage-tables.sql) - 修复表结构
- [scripts/setup-intl-usage-tracking-safe.sql](scripts/setup-intl-usage-tracking-safe.sql) - 安全设置
- [scripts/setup-intl-usage-tracking-clean.sql](scripts/setup-intl-usage-tracking-clean.sql) - 完全重建

### 文档
- [scripts/QUICK-START.md](scripts/QUICK-START.md) - 快速开始指南
- [scripts/README-INTL-USAGE-SETUP.md](scripts/README-INTL-USAGE-SETUP.md) - 完整文档
- [INTL-USAGE-DEBUG-GUIDE.md](INTL-USAGE-DEBUG-GUIDE.md) - 调试指南

## 日志说明

代码中添加了详细的日志输出，用于调试：

```bash
# 记录使用时的日志
📝 [recordRecommendationUsage] 开始记录使用...
🌍 部署环境检查: { isChinaDeployment: false, ... }
🌍 [recordRecommendationUsageSupabase] 开始记录使用 - 国际版
🔍 [recordRecommendationUsageSupabase] 查询活跃的加油包...
📊 [recordRecommendationUsageSupabase] 加油包查询结果: { count: 0, ... }
📝 [recordRecommendationUsageSupabase] 准备插入推荐使用记录到 recommendation_usage 表...
✅ [recordRecommendationUsageSupabase] 成功记录使用到 recommendation_usage 表
```

## 常见问题

### Q1: 执行脚本时提示 "column does not exist"
**A**: 说明表已存在但结构不完整。使用 `fix-intl-usage-tables.sql` 脚本。

### Q2: 执行脚本时提示 "policy already exists"
**A**: 所有新脚本都会先删除旧策略再创建新策略，不会报错。

### Q3: 使用了代码生成，但 `recommendation_usage` 表没有新增记录
**A**: 检查是否有加油包。如果有加油包，会从加油包扣除，不会记录到 `recommendation_usage` 表。

### Q4: 如何确认是国际版还是国内版？
**A**: 查看服务器日志中的 `🌍 部署环境检查` 或检查 `.env.local` 文件：
```bash
# 国际版
DATABASE_PROVIDER=supabase
AUTH_PROVIDER=supabase

# 国内版
DATABASE_PROVIDER=cloudbase
AUTH_PROVIDER=cloudbase
```

### Q5: 如何查看详细的使用统计？
**A**: 运行诊断脚本：
```bash
node scripts/check-intl-usage.js <user_id>
```

## 总结

1. ✅ **问题已识别**: Supabase 数据库缺少必要的表
2. ✅ **解决方案已创建**: 提供了 3 个不同的脚本
3. ✅ **代码逻辑已优化**: 添加了详细的日志输出
4. ✅ **诊断工具已就绪**: 可以快速定位问题
5. ✅ **文档已完善**: 包含完整的使用指南和故障排除

执行相应的数据库脚本后，使用次数扣除功能就会正常工作！
