# 国际版登录集成指南

本指南详细说明如何配置和使用国际版的邮箱登录和Google OAuth登录功能。

## 📋 目录

- [快速开始](#快速开始)
- [Supabase认证配置](#supabase认证配置)
- [Google OAuth配置](#google-oauth配置)
- [API接口](#api接口)
- [前端集成](#前端集成)
- [测试](#测试)

## 🚀 快速开始

### 1. 环境变量配置

```bash
# 复制国际版配置模板
cp .env.supabase.example .env.local
```

编辑 `.env.local`:

```bash
# 数据库和认证提供商
DATABASE_PROVIDER=supabase
AUTH_PROVIDER=supabase

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 应用URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase项目设置

#### 启用Email认证

1. 访问 [Supabase控制台](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Authentication** > **Providers**
4. 启用 **Email** provider
5. 保存设置

#### 启用Google OAuth

1. 在Supabase控制台的 **Authentication** > **Providers**
2. 启用 **Google** provider
3. 记录下 **Callback URL** (格式: `https://your-project.supabase.co/auth/v1/callback`)

### 3. Google Cloud Console配置

#### 创建OAuth 2.0凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 选择或创建一个项目
3. 点击 **创建凭据** > **OAuth客户端ID**
4. 应用类型选择 **Web应用**
5. 添加授权重定向URI:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. 记录下 **客户端ID** 和 **客户端密钥**

#### 在Supabase中配置Google

1. 回到Supabase控制台
2. 进入 **Authentication** > **Providers** > **Google**
3. 粘贴Google OAuth客户端ID和密钥
4. 保存设置

## 📊 Supabase认证配置

### 验证认证设置

在Supabase控制台中:

1. **Authentication** > **URL Configuration**
   - Site URL: `http://localhost:3000` (开发环境)
   - Redirect URLs: 添加 `http://localhost:3000/**`

2. **Authentication** > **Email Templates**
   - 自定义确认邮件和密码重置邮件(可选)

3. **Authentication** > **Providers**
   - Email: **Enabled**
   - Google: **Enabled**

### 创建用户表

确保已在Supabase中创建 `users` 表:

```sql
-- 在 Supabase SQL Editor 中运行
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  name text,
  avatar text,
  subscription_plan text default 'free',
  subscription_status text default 'active',
  region text default 'international',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 启用RLS (可选)
alter table users enable row level security;

-- 允许认证用户访问自己的数据
create policy "Users can view own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

## 🔑 Google OAuth配置

### Google OAuth流程图

```
用户点击"Google登录"
    ↓
前端调用 /api/auth/login-intl (GET) 获取OAuth URL
    ↓
用户跳转到Google授权页面
    ↓
用户授权后,Google重定向到 Supabase
    ↓
Supabase创建用户会话并重定向回应用
    ↓
前端接收授权码(code)
    ↓
前端调用登录API,使用code换取token
```

### 获取Google客户端ID

1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 创建OAuth 2.0客户端ID
3. 配置授权重定向URI:
   - `https://your-project.supabase.co/auth/v1/callback`
4. 复制客户端ID和密钥
5. 在Supabase控制台的Google provider配置中粘贴

## 🔌 API接口

### 1. 用户注册

**端点:** `POST /api/auth/register-intl`

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name" // 可选
}
```

**响应:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "subscription_plan": "free"
  },
  "message": "Registration successful! Please sign in."
}
```

**错误响应:**
```json
{
  "error": "Email already registered. Please sign in."
}
```

### 2. 邮箱密码登录

**端点:** `POST /api/auth/login-intl`

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "subscription_plan": "free"
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "tokenMeta": {
    "provider": "supabase",
    "authMethod": "email"
  }
}
```

### 3. Google OAuth登录

#### 步骤1: 获取OAuth URL

**端点:** `GET /api/auth/login-intl`

**响应:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "provider": "google"
}
```

#### 步骤2: 用户授权后使用token登录

**端点:** `POST /api/auth/login-intl`

**请求体:**
```json
{
  "provider": "google",
  "accessToken": "google_access_token",
  "idToken": "google_id_token"
}
```

**响应:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "User Name",
    "avatar": "https://lh3.googleusercontent.com/...",
    "subscription_plan": "free"
  },
  "accessToken": "eyJhbGci...",
  "tokenMeta": {
    "provider": "supabase",
    "authMethod": "google"
  }
}
```

### 4. Google OAuth回调

**端点:** `GET /api/auth/callback/google`

**参数:**
- `code`: 授权码
- `error`: 错误信息(如果有)

**行为:**
- 成功: 重定向到 `/login?code=xxx&provider=google`
- 失败: 重定向到 `/login?error=xxx`

## 💻 前端集成

### 使用Supabase客户端SDK

```typescript
// 安装Supabase JS库
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 邮箱登录示例

```typescript
// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

if (error) {
  console.error('Login failed:', error.message)
} else {
  console.log('Logged in:', data.user)
  // 保存session
  const token = data.session.access_token
  localStorage.setItem('accessToken', token)
}
```

### Google登录示例

```typescript
// 方法1: 使用Supabase内置OAuth (推荐)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${location.origin}/api/auth/callback/google`
  }
})

// 方法2: 手动处理OAuth流程
// 1. 获取OAuth URL
const response = await fetch('/api/auth/login-intl')
const { authUrl } = await response.json()

// 2. 跳转到Google授权页面
window.location.href = authUrl

// 3. 在回调页面处理授权结果
const urlParams = new URLSearchParams(window.location.search)
const code = urlParams.get('code')

if (code) {
  // 使用授权码登录
  const loginResponse = await fetch('/api/auth/login-intl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google', code }),
  })

  const { user, accessToken } = await loginResponse.json()
  // 保存token
  localStorage.setItem('accessToken', accessToken)
}
```

### React组件示例

```typescript
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // 邮箱登录
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      alert('Login failed: ' + error.message)
    } else {
      // 保存token
      localStorage.setItem('accessToken', data.session.access_token)
      // 重定向
      window.location.href = '/generate'
    }
  }

  // Google登录
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback/google`
      }
    })

    if (error) {
      alert('Google login failed: ' + error.message)
    }
  }

  return (
    <form onSubmit={handleEmailLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <button type="button" onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </form>
  )
}
```

## 🧪 测试

### 测试邮箱注册和登录

```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问登录页面
http://localhost:3000/login

# 3. 测试注册
curl -X POST http://localhost:3000/api/auth/register-intl \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'

# 4. 测试登录
curl -X POST http://localhost:3000/api/auth/login-intl \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### 测试Google OAuth

1. 访问登录页面
2. 点击"Sign in with Google"
3. 授权应用访问Google账号
4. 验证是否成功登录并重定向回应用

### 验证用户创建

在Supabase控制台中:

1. 进入 **Authentication** > **Users**
2. 查看新注册的用户
3. 进入 **Table Editor** > **users**
4. 验证用户记录已正确创建

## 🔒 安全注意事项

1. **环境变量**: 永远不要将 `SUPABASE_SERVICE_ROLE_KEY` 提交到版本控制
2. **HTTPS**: 生产环境必须使用HTTPS
3. **密码策略**: 实施强密码策略
4. **会话管理**: 使用安全的token存储方案
5. **CSRF保护**: 启用Supabase的CSRF保护

## 🐛 故障排除

### 问题: 注册失败 "User already registered"

**解决方案**: 用户已存在,请使用登录功能

### 问题: Google OAuth回调失败

**解决方案**:
1. 检查Google Cloud Console中的重定向URI配置
2. 确认Supabase中的Google provider配置正确
3. 验证 `NEXT_PUBLIC_APP_URL` 环境变量

### 问题: "Provider not configured"

**解决方案**:
1. 检查 `AUTH_PROVIDER=supabase` 是否在 `.env.local` 中
2. 重启开发服务器

### 问题: RLS策略阻止访问

**解决方案**:
```sql
-- 允许服务角色完全访问
grant all on all tables in public to service_role;
```

## 📚 更多资源

- [Supabase Auth文档](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0文档](https://developers.google.com/identity/protocols/oauth2)
- [Supabase JavaScript客户端](https://supabase.com/docs/reference/javascript)

---

**最后更新**: 2026-01-07
**版本**: 1.0.0
