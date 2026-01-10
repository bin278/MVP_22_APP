# 🇨🇳 国内版/🌍 国际版数据库切换

> 通过环境变量一键切换腾讯云CloudBase(国内)和Supabase(国际版)数据库

## 🚀 快速开始

### 国内版 (推荐中国大陆用户)

```bash
# Windows
scripts\quick-switch-db.bat

# Linux/Mac
chmod +x scripts/quick-switch-db.sh
./scripts/quick-switch-db.sh
```

选择 `1) 国内版`,然后编辑 `.env.local` 填写腾讯云配置。

### 国际版 (推荐海外用户)

```bash
# Windows
scripts\quick-switch-db.bat

# Linux/Mac
chmod +x scripts/quick-switch-db.sh
./scripts/quick-switch-db.sh
```

选择 `2) 国际版`,然后编辑 `.env.local` 填写Supabase配置。

## 📋 配置模板

### 国内版配置 (.env.cloudbase.example)

```bash
DATABASE_PROVIDER=cloudbase
TENCENT_CLOUD_ENV_ID=your-env-id
TENCENT_CLOUD_SECRET_ID=your-secret-id
TENCENT_CLOUD_SECRET_KEY=your-secret-key
```

### 国际版配置 (.env.supabase.example)

```bash
DATABASE_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🧪 测试配置

```bash
npm run config:test
```

## 📚 详细文档

查看完整指南: [docs/CN-INTL-MIGRATION-GUIDE.md](docs/CN-INTL-MIGRATION-GUIDE.md)

## 📁 核心文件

```
lib/database/
├── index.ts              # 数据库切换逻辑
├── cloudbase.ts         # CloudBase 适配器
├── supabase.ts          # Supabase 适配器
└── adapters/
    ├── cloudbase-user.ts    # CloudBase 用户适配器
    └── supabase-user.ts     # Supabase 用户适配器

scripts/
├── quick-switch-db.bat       # Windows 快速切换
├── quick-switch-db.sh        # Linux/Mac 快速切换
└── test-database-switch.js   # 配置测试

.env.cloudbase.example         # 国内版配置模板
.env.supabase.example          # 国际版配置模板
```

## ⚙️ NPM 脚本

```bash
npm run config:cn          # 复制国内版配置
npm run config:intl        # 复制国际版配置
npm run config:test        # 测试配置
npm run db:test-switch     # 测试数据库切换
```

## 🎯 使用示例

### API 层自动切换

```typescript
import { getDatabaseProvider, getDatabaseClient } from '@/lib/database'

// 自动选择数据库
const provider = getDatabaseProvider() // 'cloudbase' | 'supabase'
const db = getDatabaseClient()

// 统一的接口
const { data, error } = await db
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()
```

### 用户适配器

```typescript
import { getUserAdapter } from '@/lib/database'

const userAdapter = await getUserAdapter()

// 自动使用当前配置的数据库
const { data: user } = await userAdapter.getUserById(userId)
await userAdapter.updateUser(userId, { name: 'New Name' })
```

## 💡 关键特性

✅ **一键切换** - 修改环境变量即可切换数据库
✅ **统一接口** - API层保持一致,无需修改业务代码
✅ **类型安全** - 完整的TypeScript类型支持
✅ **数据模型兼容** - 两个版本使用相同的表结构
✅ **支付适配** - 国内版支持微信/支付宝,国际版支持Stripe/PayPal

## 📖 更多信息

- [完整实施总结](CN-INTL-SETUP-SUMMARY.md)
- [详细切换指南](docs/CN-INTL-MIGRATION-GUIDE.md)
- [腾讯云CloudBase文档](https://cloud.tencent.com/document/product/876)
- [Supabase文档](https://supabase.com/docs)
