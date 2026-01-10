# 国内版/国际版数据库切换实施总结

## 📋 实施内容

本次更新为项目添加了完整的国内版(腾讯云CloudBase)和国际版(Supabase)数据库切换支持。

## ✅ 完成的工作

### 1. 数据库适配器架构

#### 创建的文件
- [lib/database/supabase.ts](lib/database/supabase.ts) - Supabase数据库适配器
- [lib/database/adapters/supabase-user.ts](lib/database/adapters/supabase-user.ts) - Supabase用户适配器

#### 更新的文件
- [lib/database/index.ts](lib/database/index.ts) - 添加数据库切换逻辑
- [lib/database/types.ts](lib/database/types.ts) - 更新类型定义以支持双数据库

### 2. API 层更新

#### 修改的文件
- [app/api/generate/route.ts](app/api/generate/route.ts) - 代码生成API现在支持根据环境变量自动选择数据库

### 3. 配置文件

#### 创建的文件
- [.env.cloudbase.example](.env.cloudbase.example) - 国内版环境变量模板
- [.env.supabase.example](.env.supabase.example) - 国际版环境变量模板
- [scripts/setup-supabase-db.sql](scripts/setup-supabase-db.sql) - Supabase数据库迁移脚本
- [scripts/test-database-switch.js](scripts/test-database-switch.js) - 数据库切换测试脚本

#### 更新的文件
- [package.json](package.json) - 添加新的npm脚本

### 4. 文档

#### 创建的文件
- [docs/CN-INTL-MIGRATION-GUIDE.md](docs/CN-INTL-MIGRATION-GUIDE.md) - 完整的切换指南

## 🚀 快速开始

### 国内版 (腾讯云 CloudBase)

```bash
# 1. 复制配置文件
npm run config:cn

# 2. 编辑 .env.local 填写腾讯云配置
# TENCENT_CLOUD_ENV_ID=
# TENCENT_CLOUD_SECRET_ID=
# TENCENT_CLOUD_SECRET_KEY=

# 3. 测试配置
npm run config:test

# 4. 启动应用
npm run dev
```

### 国际版 (Supabase)

```bash
# 1. 复制配置文件
npm run config:intl

# 2. 编辑 .env.local 填写 Supabase 配置
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=

# 3. 在 Supabase SQL Editor 运行迁移脚本
# 复制 scripts/setup-supabase-db.sql 的内容并执行

# 4. 测试配置
npm run config:test

# 5. 启动应用
npm run dev
```

## 📁 新增文件列表

```
lib/database/
├── supabase.ts                      # Supabase 适配器
└── adapters/
    └── supabase-user.ts            # Supabase 用户适配器

.env.cloudbase.example              # 国内版配置模板
.env.supabase.example               # 国际版配置模板

scripts/
├── setup-supabase-db.sql           # Supabase 数据库迁移
└── test-database-switch.js         # 配置测试脚本

docs/
└── CN-INTL-MIGRATION-GUIDE.md      # 切换指南
```

## 🔧 核心功能

### 1. 数据库自动切换

通过 `DATABASE_PROVIDER` 环境变量控制:
```bash
DATABASE_PROVIDER=cloudbase   # 国内版
DATABASE_PROVIDER=supabase    # 国际版
```

### 2. 统一的API接口

无论使用哪个数据库,API层保持一致:
```typescript
import { getDatabaseClient, getDatabaseProvider } from '@/lib/database'

const provider = getDatabaseProvider()
const db = getDatabaseClient()
```

### 3. 用户适配器

支持统一的用户、订阅和支付操作:
```typescript
const userAdapter = await getUserAdapter()
const user = await userAdapter.getUserById(userId)
```

## 📊 数据库表结构

两个版本使用相同的数据模型:

- **users** - 用户信息
- **conversations** - 对话记录
- **conversation_files** - 对话文件
- **user_subscriptions** - 用户订阅
- **payments** - 支付记录

## 🧪 测试

### 运行测试脚本
```bash
npm run config:test
```

输出示例:
```
=================================================
🔍 数据库切换测试
=================================================

📊 当前配置:
   数据库提供商: cloudbase
   环境变量文件: .env.local

🇨🇳 国内版模式 (腾讯云 CloudBase)
------------------------------------------------
   ENV_ID: ✅ 已配置
   SECRET_ID: ✅ 已配置
   SECRET_KEY: ✅ 已配置

✅ 配置验证通过!
```

## 💡 使用示例

### 代码生成API

```typescript
// app/api/generate/route.ts
const provider = getDatabaseProvider()

if (provider === 'cloudbase') {
  // 保存到 CloudBase
  const result = await add('conversations', data)
} else {
  // 保存到 Supabase
  const result = await supabaseAdd('conversations', data)
}
```

### 用户操作

```typescript
// 自动使用当前配置的数据库
const userAdapter = await getUserAdapter()
const { data, error } = await userAdapter.createUser({
  email: 'user@example.com',
  name: 'User Name',
  subscription_plan: 'free'
})
```

## 🎯 下一步

1. **测试国内版**: 确保 CloudBase 数据库集合已创建
2. **测试国际版**: 运行 Supabase 迁移脚本
3. **验证代码生成**: 测试代码保存到正确的数据库
4. **配置支付**: 根据版本选择支付方式(国内:微信/支付宝,国际:Stripe/PayPal)

## 📚 相关文档

- [完整切换指南](docs/CN-INTL-MIGRATION-GUIDE.md)
- [CloudBase 文档](https://cloud.tencent.com/document/product/876)
- [Supabase 文档](https://supabase.com/docs)

## ⚠️ 注意事项

1. **不要同时配置两个数据库** - 每次只能使用一个数据库提供商
2. **环境变量优先级** - `.env.local` > `.env`
3. **密钥安全** - 不要将 Service Role Key 提交到版本控制
4. **数据库迁移** - 切换数据库前备份现有数据

## 🐛 故障排除

### 问题: 配置验证失败
**解决方案**: 运行 `npm run config:test` 查看详细错误信息

### 问题: CloudBase 报错 "DATABASE_COLLECTION_NOT_EXIST"
**解决方案**: 在 CloudBase 控制台手动创建集合

### 问题: Supabase 报错 "relation does not exist"
**解决方案**: 运行 `scripts/setup-supabase-db.sql` 迁移脚本

---

**实施日期**: 2026-01-07
**实施人**: Claude Code
**版本**: v1.0.0
