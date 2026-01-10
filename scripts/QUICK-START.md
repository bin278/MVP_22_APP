# 🚀 快速开始 - 国际版使用次数追踪设置

## 问题
国际版用户使用代码生成后，剩余次数没有减少。

## 原因
Supabase 数据库缺少必要的表。

## 解决方案（3 步）

### 1️⃣ 执行数据库脚本

在 Supabase SQL Editor 中执行：
- **推荐（新项目）**: [setup-intl-usage-tracking-safe.sql](setup-intl-usage-tracking-safe.sql)
- **修复现有表**: [fix-intl-usage-tables.sql](fix-intl-usage-tables.sql) ⭐ 如果表已存在
- **完全重置**: [setup-intl-usage-tracking-clean.sql](setup-intl-usage-tracking-clean.sql)

### 2️⃣ 重启开发服务器

```bash
npm run dev
```

### 3️⃣ 测试

完成一次代码生成，然后运行诊断：
```bash
node scripts/check-intl-usage.js <user_id>
```

预期结果：
- 本月已使用次数: 1
- 剩余次数: 29

## 详细文档

查看完整文档: [README-INTL-USAGE-SETUP.md](README-INTL-USAGE-SETUP.md)

## 脚本说明

| 脚本 | 用途 | 优点 | 缺点 |
|------|------|------|------|
| `fix-intl-usage-tables.sql` ⭐ | **修复现有表结构** | 保留数据，添加缺失列 | - |
| `setup-intl-usage-tracking-safe.sql` | 安全设置，只添加缺失项 | 不删除现有数据 | 可能需要多次执行 |
| `setup-intl-usage-tracking-clean.sql` | 完全重建表结构 | 干净的表结构 | 会删除现有数据 |

## 故障排除

### 错误: "column does not exist"
**解决**: 使用 `fix-intl-usage-tables.sql` 脚本，它会添加缺失的列。

### 错误: "policy already exists"
**解决**: 所有脚本都会先删除旧策略再创建新策略。

### 错误: "table already exists"
**解决**: 使用 `CREATE TABLE IF NOT EXISTS` 语法（已包含在脚本中）。

### 使用次数仍然没有扣除
**检查**:
1. 环境变量: `DATABASE_PROVIDER=supabase` 和 `AUTH_PROVIDER=supabase`
2. 查看服务器日志中的 `🌍 部署环境检查`
3. 确认表已创建: 在 Supabase Table Editor 中查看表列表
4. 运行诊断: `node scripts/check-intl-usage.js <user_id>`

### 错误: "null value in column 'usage_date' violates not-null constraint"
**原因**: 表结构中有额外的 `usage_date` 列
**解决**: 执行 [fix-usage-date-column.sql](fix-usage-date-column.sql) 脚本删除该列
