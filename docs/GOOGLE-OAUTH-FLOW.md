# 国际版 Google OAuth 登录完整流程

## 📋 目录
- [流程概述](#流程概述)
- [前置配置](#前置配置)
- [完整流程](#完整流程)
- [代码实现](#代码实现)
- [错误处理](#错误处理)
- [测试验证](#测试验证)

## 🔄 流程概述

Google OAuth登录使用Supabase Auth作为中间层,提供安全的第三方登录:

```
用户点击"Google登录"
    ↓
AuthContext.signInWithGoogle()
    ↓
Supabase Auth生成OAuth URL
    ↓
重定向到Google授权页面
    ↓
用户同意授权
    ↓
Google重定向到 /google-callback
    ↓
携带 authorization code 或 access_token
    ↓
Callback页面处理响应
    ↓
Supabase建立session
    ↓
重定向到 /generate
```

## ⚙️ 前置配置

### 1. Supabase项目配置

登录[Supabase Dashboard](https://supabase.com/dashboard):

1. **创建项目**
   ```
   - 访问 https://supabase.com/dashboard
   - 点击 "New Project"
   - 选择组织,填写项目信息
   - 等待项目创建完成(约2分钟)
   ```

2. **启用Google Provider**
   ```
   - 导航到 Authentication → Providers
   - 找到 "Google" provider
   - 点击启用开关
   - 保存配置
   ```

3. **配置重定向URL**
   ```
   - 在 Authentication → URL Configuration
   - 添加以下URL到 "Redirect URLs":
     * http://localhost:3000/google-callback (开发环境)
     * https://yourdomain.com/google-callback (生产环境)
   - 保存配置
   ```

4. **获取API密钥**
   ```
   - 导航到 Project Settings → API
   - 复制以下信息:
     * Project URL (NEXT_PUBLIC_SUPABASE_URL)
     * anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
     * service_role key (SUPABASE_SERVICE_ROLE_KEY)
   ```

### 2. 环境变量配置

在 `.env.local` 中添加:

```bash
# 数据库提供商
DATABASE_PROVIDER=supabase

# 认证提供商 (关键!)
AUTH_PROVIDER=supabase

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**重要提示:**
- `AUTH_PROVIDER=supabase` 是必需的!
- 没有 `AUTH_PROVIDER`,默认使用CloudBase(国内版)
- Google登录只在Supabase模式下可用

### 3. Google Cloud配置 (可选)

Supabase默认提供Google OAuth配置,但如果需要自定义:

1. **创建Google Cloud项目**
   ```
   - 访问 https://console.cloud.google.com
   - 创建新项目
   ```

2. **配置OAuth同意屏幕**
   ```
   - 导航到 APIs & Services → OAuth consent screen
   - 选择用户类型 (外部或内部)
   - 填写应用信息:
     * 应用名称: "Your App Name"
     * 应用 logo: 上传logo
     * 支持邮箱: 添加your@email.com
     * 授权域名: supabase.com (使用Supabase托管)
   - 添加授权范围:
     * ../auth/userinfo.email
     * ../auth/userinfo.profile
     * openid
   ```

3. **创建OAuth 2.0客户端**
   ```
   - 导航到 APIs & Services → Credentials
   - 创建 OAuth 2.0 客户端ID
   - 应用类型: Web application
   - 已授权的重定向 URI:
     * https://your-project.supabase.co/auth/v1/callback
   - 复制客户端ID和客户端密钥
   ```

4. **在Supabase中配置**
   ```
   - 回到 Supabase Dashboard
   - Authentication → Providers → Google
   - 粘贴 Google Client ID 和 Client Secret
   - 保存配置
   ```

## 📝 完整流程

### 步骤1: 用户点击Google登录按钮

**位置:** [app/login/page.tsx](../app/login/page.tsx)

```tsx
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle()
    if (error) {
      console.error('Google登录失败:', error.message)
    }
    // Supabase会自动处理重定向
  }

  return (
    <button onClick={handleGoogleSignIn}>
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        {/* Google图标 */}
      </svg>
      Continue with Google
    </button>
  )
}
```

### 步骤2: signInWithGoogle发起OAuth请求

**位置:** [lib/auth-context.tsx](../lib/auth-context.tsx#L289-L340)

```typescript
const signInWithGoogle = async () => {
  // 1. 检查Supabase配置
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return { error: { message: 'Supabase未配置' } }
  }

  // 2. 创建Supabase客户端
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 3. 发起OAuth请求
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/google-callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })

  if (error) {
    return { error: { message: error.message } }
  }

  // 4. Supabase自动处理重定向
  return { error: null }
}
```

**控制台输出:**
```
🔄 开始Google OAuth登录流程...
✅ 重定向到Google授权页面...
```

### 步骤3: Google授权页面

用户看到的URL类似:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=xxx.apps.googleusercontent.com
  &redirect_uri=https://your-project.supabase.co/auth/v1/callback
  &response_type=code
  &scope=openid%20email%20profile
  &state=xxx
```

**用户操作:**
1. 选择Google账户
2. 查看权限请求(邮箱、个人资料)
3. 点击"允许"

### 步骤4: Google回调到Supabase

Google重定向到:
```
https://your-project.supabase.co/auth/v1/callback?
  code=4/0AX4XfWh...
  &state=xxx
```

### 步骤5: Supabase处理授权

Supabase服务器:
1. 接收authorization code
2. 使用code换取access_token
3. 获取用户信息(email, name, picture)
4. 创建或更新用户记录
5. 生成JWT session
6. 重定向到你的callback页面

### 步骤6: 前端Callback页面处理

**位置:** [app/google-callback/page.tsx](../app/google-callback/page.tsx#L15-L139)

#### 场景A: Authorization Code Flow (推荐)

```typescript
useEffect(() => {
  const handleCallback = async () => {
    // 1. 检查URL中的code
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (code) {
      console.log('🔑 检测到authorization code (PKCE Flow)')

      // 2. 交换code for session
      const supabase = createClient(url, key)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('❌ Code exchange error:', error)
        setStatus('error')
        setMessage('Failed to exchange code for session: ' + error.message)
        return
      }

      console.log('✅ Session已建立:', data.session?.user?.email)
      setStatus('success')
      setMessage('Google authentication successful!')

      // 3. 跳转到首页
      setTimeout(() => {
        router.push('/generate')
      }, 1000)
    }
  }

  handleCallback()
}, [router])
```

#### 场景B: Implicit Flow (旧方式)

```typescript
// 检查hash中的token
const hash = window.location.hash
if (hash && hash.includes('access_token')) {
  console.log('🔑 检测到access_token in hash (Implicit Flow)')

  // Supabase SDK会自动处理hash并建立session
  setTimeout(async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      console.log('✅ Session已建立:', session.user?.email)
      setStatus('success')
      router.push('/generate')
    }
  }, 2000)
}
```

#### 场景C: 错误处理

```typescript
// 检查URL中的错误参数
const error = urlParams.get('error')
const errorDescription = urlParams.get('error_description')

if (error) {
  console.error('❌ OAuth error:', error, errorDescription)
  setStatus('error')
  setMessage(getErrorMessage(error, errorDescription))

  // 3秒后跳转回登录页
  setTimeout(() => {
    router.push('/login?error=' + error)
  }, 3000)
  return
}
```

### 步骤7: Session建立

**Session结构:**
```typescript
{
  access_token: string,      // JWT token, 1小时有效
  refresh_token: string,     // 刷新token, 30天有效
  user: {
    id: string,              // UUID
    email: string,
    email_confirmed_at: string,
    phone: string,
    phone_confirmed_at: string,
    last_sign_in_at: string,
    created_at: string,
    updated_at: string,
    app_metadata: {},
    user_metadata: {
      full_name: string,
      avatar_url: string,
      provider: 'google',
      providers: ['google']
    },
    identities: [
      {
        id: string,
        user_id: string,
        identity_data: { ... },
        provider: 'google',
        last_sign_in_at: string,
        created_at: string,
        updated_at: string
      }
    ]
  },
  expires_at: number         // timestamp
}
```

**存储位置:**
```javascript
localStorage.setItem('sb-<project-id>-auth-token', JSON.stringify(session))
```

### 步骤8: AuthContext自动更新

**位置:** [lib/auth-context.tsx](../lib/auth-context.tsx#L168-L214)

```typescript
// 监听auth-state-manager的变化
const handleAuthStateChanged = () => {
  const authUser = getAuthUser()
  const isAuth = isAuthenticated()
  const authState = getStoredAuthState()

  if (authUser && isAuth && authState) {
    console.log('[Auth Context] 认证状态更新：用户已登录')
    // 更新全局状态
    setUser(cloudBaseUser)
    setSession(sessionData)
  }
}

window.addEventListener('auth-state-changed', handleAuthStateChanged)
```

**控制台输出:**
```
[Auth Context] 认证状态更新：用户已登录
[Auth Context] 用户: user@gmail.com
```

### 步骤9: 重定向到应用首页

```typescript
// Callback页面
setTimeout(() => {
  router.push('/generate')
}, 1000)
```

用户已登录,可以访问需要认证的API。

### 步骤10: API调用认证

**客户端调用:**
```typescript
const { session } = useAuth()

const response = await fetch('/api/conversations/list', {
  headers: {
    'Authorization': `Bearer ${session.accessToken}`
  }
})
```

**服务器验证:**
```typescript
// lib/auth/auth.ts
export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.substring(7) // 移除 "Bearer "

  if (authProvider === 'supabase') {
    // 验证Supabase token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return { error: 'Invalid token', user: null }
    }

    return { user, error: null }
  }
}
```

## 🔐 安全性说明

### OAuth 2.0 安全特性

1. **PKCE (Proof Key for Code Exchange)**
   ```
   - 防止授权码拦截攻击
   - Supabase自动生成code_verifier和code_challenge
   - 只有发起请求的客户端能交换code
   ```

2. **State参数**
   ```
   - 防止CSRF攻击
   - Supabase自动生成并验证state
   - 确保回调请求来自真实的OAuth流程
   ```

3. **Token验证**
   ```typescript
   // 服务器端验证
   const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

   // 验证:
   // 1. JWT签名 (使用Supabase secret)
   // 2. Token过期时间
   // 3. 用户是否存在于数据库
   ```

### RLS (Row Level Security)

```sql
-- 自动应用用户权限
create policy "Users can view own data"
  on conversations for select
  using (auth.uid() = user_id);

-- auth.uid() 从JWT中提取
-- 即使API被绕过,数据库也会阻止未授权访问
```

## ❌ 错误处理

### 常见错误场景

#### 1. 用户拒绝授权

```
URL: /google-callback?error=access_denied
```

**处理:**
```typescript
if (error === 'access_denied') {
  setStatus('error')
  setMessage('You denied the authentication request')
  setTimeout(() => {
    router.push('/login?error=access_denied')
  }, 3000)
}
```

#### 2. 授权码交换失败

```typescript
const { data, error } = await supabase.auth.exchangeCodeForSession(code)

if (error) {
  console.error('❌ Code exchange error:', error)
  setStatus('error')
  setMessage('Failed to exchange code for session: ' + error.message)
}
```

**可能原因:**
- Code已过期(5分钟有效期)
- Code已被使用(一次性)
- Supabase配置错误

#### 3. Session未建立

```typescript
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  console.warn('⚠️ Session未建立')
  setStatus('error')
  setMessage('Failed to establish session. Please try again.')
}
```

#### 4. Supabase未配置

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!supabaseUrl) {
  return { error: { message: 'Supabase未配置' } }
}
```

### 错误消息映射

```typescript
function getErrorMessage(error: string, description: string): string {
  const errorMessages: Record<string, string> = {
    'access_denied': 'You denied the authentication request',
    'invalid_request': 'The authentication request was invalid',
    'unauthorized_client': 'The client is not authorized',
    'unsupported_response_type': 'The response type is not supported',
    'invalid_scope': 'The requested scope is invalid',
    'server_error': 'The authentication server encountered an error',
    'temporarily_unavailable': 'The service is temporarily unavailable',
  }

  const message = errorMessages[error] || error
  return description ? `${message}: ${description}` : message
}
```

## 🧪 测试验证

### 1. 验证配置

```bash
# 运行验证脚本
node scripts/verify-version-isolation.js

# 预期输出(国际版):
# 📊 当前配置:
#    DATABASE_PROVIDER: supabase
#    AUTH_PROVIDER: supabase
#
# 🌍 当前版本:
#    ✅ 国际版 (Supabase)
#    可用功能: 邮箱登录、Google登录
```

### 2. 测试Google登录

#### 前端测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问登录页
http://localhost:3000/login

# 3. 点击 "Continue with Google"

# 4. 预期流程:
#    - 重定向到Google授权页面
#    - 选择账户并授权
#    - 重定向到 /google-callback
#    - 显示加载状态
#    - 显示成功消息
#    - 自动跳转到 /generate
```

#### 控制台日志

**成功流程:**
```
🔄 开始Google OAuth登录流程...
✅ 重定向到Google授权页面...

# 用户授权后

🔄 Google OAuth回调处理开始
🔑 检测到authorization code (PKCE Flow)
🔄 正在交换code for session...
✅ Session已建立: user@gmail.com
[Auth Context] 认证状态更新：用户已登录
```

**失败流程:**
```
🔄 开始Google OAuth登录流程...
✅ 重定向到Google授权页面...

# 用户拒绝授权

🔄 Google OAuth回调处理开始
❌ OAuth error: access_denied
```

### 3. 验证Session

**在浏览器控制台:**
```javascript
// 检查localStorage
const token = localStorage.getItem('sb-<project-id>-auth-token')
console.log('Token:', JSON.parse(token))

// 检查session
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(url, key)

const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User:', session.user)
```

### 4. 测试API调用

```bash
# 1. 登录后获取token
# (从浏览器控制台复制 access_token)

# 2. 测试API
curl -X GET http://localhost:3000/api/conversations/list \
  -H "Authorization: Bearer <your-access-token>"

# 预期: 返回对话列表
```

### 5. 测试Token刷新

```javascript
// 在浏览器控制台
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(url, key)

// 手动刷新session
const { data, error } = await supabase.auth.refreshSession()
console.log('New session:', data.session)
```

## 🎯 最佳实践

### 1. 错误处理

```typescript
try {
  const { error } = await signInWithGoogle()
  if (error) {
    // 显示用户友好的错误消息
    toast.error(error.message)
  }
} catch (error) {
  // 捕获未预期的错误
  console.error('Unexpected error:', error)
  toast.error('登录失败,请稍后重试')
}
```

### 2. 加载状态

```typescript
const [isLoading, setIsLoading] = useState(false)

const handleGoogleSignIn = async () => {
  setIsLoading(true)
  const { error } = await signInWithGoogle()
  setIsLoading(false)

  if (error) {
    toast.error(error.message)
  }
}

return (
  <button onClick={handleGoogleSignIn} disabled={isLoading}>
    {isLoading ? 'Signing in...' : 'Continue with Google'}
  </button>
)
```

### 3. 环境检查

```typescript
// 检查是否在Supabase模式
const isSupabase = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase'

{isSupabase && (
  <button onClick={handleGoogleSignIn}>
    Continue with Google
  </button>
)}
```

### 4. 日志记录

```typescript
// 记录关键事件
console.log('🔄 Google OAuth started')
console.log('✅ User authenticated:', user.email)
console.log('❌ Authentication failed:', error)
```

## 📊 完整数据流图

```
┌─────────────────────────────────────────────────────────────┐
│  1. 用户点击 "Continue with Google"                          │
│     (app/login/page.tsx)                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  2. AuthContext.signInWithGoogle()                           │
│     - 创建Supabase客户端                                     │
│     - 调用 signInWithOAuth({ provider: 'google' })          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Supabase生成OAuth URL                                    │
│     - 生成state参数(CSRF保护)                               │
│     - 生成code_verifier(PKCE)                               │
│     - 重定向到Google                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Google授权页面                                           │
│     - 用户选择账户                                           │
│     - 查看权限请求                                           │
│     - 点击 "允许" 或 "拒绝"                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ↓                     ↓
       ✅ 允许                ❌ 拒绝
              │                     │
              ↓                     ↓
┌─────────────────────┐    ┌──────────────────────┐
│  5a. Google回调      │    │  5b. 错误回调        │
│  Supabase            │    │  (error=access_denied)│
│  (code + state)      │    │                      │
└──────────┬──────────┘    └──────────┬───────────┘
           │                          │
           ↓                          ↓
┌─────────────────────┐    ┌──────────────────────┐
│  6a. Supabase处理   │    │  6b. 显示错误        │
│  - 交换code for token│   │  - 重定向到login      │
│  - 获取用户信息      │    │  - 显示错误消息      │
│  - 创建session       │    │                      │
│  - 重定向到callback  │    │                      │
└──────────┬──────────┘    └──────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────┐
│  7. /google-callback 页面                                    │
│     - 从URL提取code或token                                  │
│     - 调用 exchangeCodeForSession(code)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
       ✅ 成功                ❌ 失败
              │                     │
              ↓                     ↓
┌─────────────────────┐    ┌──────────────────────┐
│  8a. Session已建立   │    │  8b. 显示错误        │
│  - 存储到localStorage│   │  - 重定向到login      │
│  - 触发auth事件      │    │                      │
│  - 重定向到/generate │    │                      │
└──────────┬──────────┘    └──────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────┐
│  9. AuthContext更新全局状态                                  │
│     - setUser(session.user)                                 │
│     - setSession(session)                                   │
│     - 触发 re-render                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  10. 应用页面 (/generate)                                    │
│      - 用户已登录                                            │
│      - 可以调用需要认证的API                                 │
│      - { session } = useAuth()                              │
│      - Authorization: Bearer {token}                        │
└─────────────────────────────────────────────────────────────┘
```

## 🐛 故障排除

### 问题1: 点击Google登录无反应

**检查:**
```bash
# 1. 检查控制台是否有错误
# 2. 检查AUTH_PROVIDER是否设置
grep AUTH_PROVIDER .env.local
# 应该是: AUTH_PROVIDER=supabase

# 3. 检查Supabase配置
grep NEXT_PUBLIC_SUPABASE .env.local
```

**解决:**
- 确保 `AUTH_PROVIDER=supabase`
- 确保 Supabase URL 和 key 已设置
- 重启开发服务器

### 问题2: Google授权页面显示错误

**错误信息:** "redirect_uri_mismatch"

**解决:**
1. 在Supabase Dashboard添加重定向URL:
   ```
   http://localhost:3000/google-callback
   https://yourdomain.com/google-callback
   ```

2. 确保URL完全匹配(包括协议和端口)

### 问题3: 授权后跳转回登录页

**检查:**
```javascript
// 在callback页面控制台
console.log('URL:', window.location.href)
console.log('Hash:', window.location.hash)
console.log('SearchParams:', Object.fromEntries(urlParams))
```

**可能原因:**
- Code exchange失败
- Session未建立
- 网络错误

**解决:**
- 查看控制台错误日志
- 检查Supabase配置
- 尝试清除浏览器缓存

### 问题4: Session建立但API调用401

**检查:**
```typescript
// 确认token存在
const { session } = useAuth()
console.log('Token:', session?.accessToken)

// 确认服务器配置
console.log('AUTH_PROVIDER:', process.env.AUTH_PROVIDER)
```

**可能原因:**
- Token过期
- 服务器端认证中间件配置错误
- AUTH_PROVIDER未设置

**解决:**
- 刷新页面重新获取session
- 检查服务器端环境变量
- 确保requireAuth()正确验证Supabase token

## 📚 相关文档

- [Supabase Auth文档](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0文档](https://developers.google.com/identity/protocols/oauth2)
- [SUPABASE-AUTH-FLOW.md](./SUPABASE-AUTH-FLOW.md) - Supabase认证完整流程
- [INTL-LOGIN-GUIDE.md](./INTL-LOGIN-GUIDE.md) - 国际版登录指南
- [VERSION-ISOLATION-GUIDE.md](../VERSION-ISOLATION-GUIDE.md) - 版本隔离指南

## ✅ 总结

**Google OAuth登录提供:**
1. ✅ **便捷性** - 用户无需记忆密码
2. ✅ **安全性** - OAuth 2.0 + PKCE保护
3. ✅ **可靠性** - Supabase成熟认证系统
4. ✅ **隔离性** - 只在Supabase模式启用

**关键配置:**
- `AUTH_PROVIDER=supabase` (必需!)
- Supabase项目已创建
- Google provider已启用
- 重定向URL已配置

**测试清单:**
- [x] Google登录按钮可见
- [x] 点击后重定向到Google
- [x] 授权后跳转到callback页面
- [x] Session成功建立
- [x] 自动跳转到/generate
- [x] API调用携带token
- [x] Token自动刷新

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-07
**适用于**: 国际版 (Supabase)
