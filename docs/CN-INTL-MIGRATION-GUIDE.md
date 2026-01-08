# 国内版与国际版数据库切换指南

本项目支持通过环境变量在**国内版**(腾讯云 CloudBase)和**国际版**(Supabase)之间切换。

## 📋 目录

- [快速开始](#快速开始)
- [国内版配置](#国内版配置)
- [国际版配置](#国际版配置)
- [数据库架构](#数据库架构)
- [API适配器](#api适配器)
- [常见问题](#常见问题)

## 🚀 快速开始

### 选择版本

1. **国内版** (推荐用于中国大陆)
   ```bash
   cp .env.cloudbase.example .env.local
   # 编辑 .env.local 填写腾讯云 CloudBase 配置
   ```

2. **国际版** (推荐用于海外用户)
   ```bash
   cp .env.supabase.example .env.local
   # 编辑 .env.local 填写 Supabase 配置
   ```

3. **启动应用**
   ```bash
   npm install
   npm run dev
   ```

## 🇨🇳 国内版配置

### 环境变量

```bash
# 数据库提供商
DATABASE_PROVIDER=cloudbase

# 腾讯云 CloudBase
TENCENT_CLOUD_ENV_ID=your-env-id
TENCENT_CLOUD_SECRET_ID=your-secret-id
TENCENT_CLOUD_SECRET_KEY=your-secret-key
```

### CloudBase 设置步骤

1. 访问 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 创建新环境或选择现有环境
3. 在「环境设置」中获取:
   - 环境ID (Env ID)
   - Secret ID
   - Secret Key
4. 在「数据库」中创建以下集合:
   - `users` - 用户信息
   - `conversations` - 对话记录
   - `conversation_files` - 对话文件
   - `user_subscriptions` - 用户订阅
   - `payments` - 支付记录

### 支付配置

国内版支持:
- **支付宝**: 配置 `ALIPAY_APP_ID`, `ALIPAY_PRIVATE_KEY`
- **微信支付**: 配置 `WECHAT_PAY_MCH_ID`, `WECHAT_PAY_API_KEY`

## 🌍 国际版配置

### 环境变量

```bash
# 数据库提供商
DATABASE_PROVIDER=supabase

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Supabase 设置步骤

1. 访问 [Supabase 官网](https://supabase.com) 创建项目
2. 在 Project Settings > API 中获取:
   - Project URL
   - anon public key
   - service_role key (保密!)
3. 在 SQL Editor 中运行迁移脚本:
   ```bash
   # 复制 scripts/setup-supabase-db.sql 的内容到 Supabase SQL Editor 执行
   ```

### 支付配置

国际版支持:
- **Stripe**: 配置 `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **PayPal**: 配置 `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`

## 🗄️ 数据库架构

### 通用表结构

两个版本使用相同的数据模型:

#### users (用户表)
```
- id: UUID
- email: TEXT (唯一)
- name: TEXT
- avatar: TEXT
- subscription_plan: TEXT (free/basic/pro)
- subscription_status: TEXT (active/inactive)
- region: TEXT (china/international)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### conversations (对话表)
```
- id: UUID
- user_id: UUID (外键 -> users)
- title: TEXT
- type: TEXT (generation/chat)
- prompt: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### conversation_files (对话文件表)
```
- id: UUID
- conversation_id: UUID (外键 -> conversations)
- file_path: TEXT
- file_content: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### user_subscriptions (用户订阅表)
```
- id: UUID
- user_id: UUID (外键 -> users)
- plan_type: TEXT
- status: TEXT (active/inactive/cancelled)
- subscription_end: TIMESTAMP
- currency: TEXT (CNY/USD)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### payments (支付记录表)
```
- id: UUID
- user_id: UUID (外键 -> users)
- amount: NUMERIC
- currency: TEXT
- status: TEXT (pending/completed/failed)
- payment_method: TEXT
- transaction_id: TEXT
- subscription_id: UUID (外键 -> user_subscriptions)
- metadata: JSON
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- completed_at: TIMESTAMP
```

## 🔌 API 适配器

### 适配器架构

```
lib/database/
├── index.ts                 # 数据库切换逻辑
├── cloudbase.ts            # CloudBase 适配器
├── supabase.ts             # Supabase 适配器
└── adapters/
    ├── cloudbase-user.ts   # CloudBase 用户适配器
    └── supabase-user.ts    # Supabase 用户适配器
```

### 使用示例

```typescript
// 自动根据 DATABASE_PROVIDER 选择数据库
import { getDatabaseClient, getDatabaseProvider } from '@/lib/database'

// 获取当前数据库提供商
const provider = getDatabaseProvider() // 'cloudbase' | 'supabase'

// 使用统一的数据库接口
const db = getDatabaseClient()
const { data, error } = await db
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// 使用用户适配器
import { getUserAdapter } from '@/lib/database'
const userAdapter = await getUserAdapter()
const { data: user } = await userAdapter.getUserById(userId)
```

### 代码示例: 保存生成的代码

```typescript
// app/api/generate/route.ts
import { getDatabaseProvider } from '@/lib/database'

const provider = getDatabaseProvider()
console.log(`💾 Saving to ${provider}...`)

if (provider === 'cloudbase') {
  // 使用 CloudBase
  const { add } = await import('@/lib/database/cloudbase')
  const result = await add('conversations', data)
} else {
  // 使用 Supabase
  const { add } = await import('@/lib/database/supabase')
  const result = await add('conversations', data)
}
```

## 🔧 常见问题

### Q: 如何切换数据库?

A: 修改 `.env.local` 中的 `DATABASE_PROVIDER` 变量:
```bash
# 切换到国内版
DATABASE_PROVIDER=cloudbase

# 切换到国际版
DATABASE_PROVIDER=supabase
```

### Q: 两个版本的数据库可以同时使用吗?

A: 不可以。每次只能使用一个数据库提供商。应用会根据 `DATABASE_PROVIDER` 环境变量自动选择。

### Q: 数据可以迁移吗?

A: 可以,但需要手动编写迁移脚本。两个数据库的数据模型兼容,可以导出/导入。

### Q: 如何测试数据库连接?

A: 访问 `/api/test-db` 端点:
```bash
curl http://localhost:3000/api/test-db
```

### Q: CloudBase 报错 "DATABASE_COLLECTION_NOT_EXIST"

A: 需要在 CloudBase 控制台手动创建集合:
1. 访问 https://console.cloud.tencent.com/tcb
2. 选择你的环境
3. 点击「数据库」
4. 创建所需集合并设置权限

### Q: Supabase 报错 "relation does not exist"

A: 需要运行数据库迁移脚本:
1. 访问 https://app.supabase.com
2. 选择你的项目
3. 点击「SQL Editor」
4. 运行 `scripts/setup-supabase-db.sql`

## 📚 相关文档

- [腾讯云 CloudBase 文档](https://cloud.tencent.com/document/product/876)
- [Supabase 文档](https://supabase.com/docs)
- [Stripe 文档](https://stripe.com/docs)
- [PayPal 文档](https://developer.paypal.com/docs/)

## 🆘 获取帮助

如果遇到问题:
1. 检查环境变量是否正确配置
2. 查看控制台日志获取详细错误信息
3. 访问 `/api/test-db` 测试数据库连接
4. 查看项目 Issues 或提交新问题
