# 🔧 环境变量配置指南

## 🚨 当前问题
你的数据库环境变量没有正确配置，导致支付成功后订阅状态无法更新。

## 📋 配置步骤

### 1. 获取 Supabase 配置信息
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings → API**
4. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJxxxxx`
   - **service_role secret key**: `eyJxxxxx`

### 2. 获取 Stripe 配置信息
1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 进入 **Developers → API keys**
3. 复制以下信息：
   - **Secret key**: `sk_test_xxxxx`
   - **Publishable key**: `pk_test_xxxxx`

### 3. 获取 Stripe Webhook 密钥
1. 在 Stripe Dashboard 中进入 **Developers → Webhooks**
2. 创建 webhook，URL 为：`https://yourdomain.com/api/payment/webhook/stripe`
3. 复制 **Webhook signing secret**: `whsec_xxxxx`

### 4. 编辑 .env.local 文件

在项目根目录找到 `.env.local` 文件，添加以下配置：

```env
# -------- Supabase 数据库配置 --------
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# -------- Stripe 支付配置 --------
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 5. 在 Supabase 中创建数据库表

1. 在 Supabase Dashboard 中进入 **SQL Editor**
2. 复制 `supabase-subscription-schema.sql` 文件的全部内容
3. 点击 **Run** 执行 SQL

### 6. 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

## ✅ 验证配置

运行以下命令验证配置：

```bash
node -e "
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗');
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗');
console.log('Stripe Secret:', process.env.STRIPE_SECRET_KEY ? '✓' : '✗');
"
```

## 🧪 测试功能

配置完成后：

1. 访问 `http://localhost:3000/profile` 测试订阅状态显示
2. 访问 `http://localhost:3000/payment` 测试支付流程
3. 完成支付后检查订阅状态是否正确更新

## 🔍 故障排除

### 问题：环境变量仍然显示未设置
**解决方案**：
- 确保文件名为 `.env.local`（注意点号）
- 确保文件在项目根目录
- 重启开发服务器
- 检查文件内容格式是否正确

### 问题：数据库连接失败
**解决方案**：
- 验证 Supabase URL 格式正确
- 检查 API keys 是否正确复制
- 确保项目状态为活跃

### 问题：支付成功但订阅未更新
**解决方案**：
- 检查 webhook 是否正确配置
- 查看服务器日志中的 webhook 处理信息
- 验证数据库表是否正确创建












