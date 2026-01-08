# 国际版(Supabase)登录完整流程文档

## 📋 目录
- [流程概述](#流程概述)
- [详细步骤](#详细步骤)
- [代码实现](#代码实现)
- [安全性说明](#安全性说明)

## 🔄 流程概述

```
用户输入邮箱密码
    ↓
提交登录表单
    ↓
signIn(email, password) - Supabase客户端
    ↓
Supabase Auth验证
    ↓
生成JWT token (access_token + refresh_token)
    ↓
自动存储到localStorage
    ↓
触发onAuthStateChange事件
    ↓
更新AuthContext全局状态
    ↓
页面重定向到首页
    ↓
用户可以访问需要认证的API
```

## 📝 详细步骤

### 1. 用户输入 (app/login/page.tsx)

```tsx
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // 调用 signIn 函数
    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      // 登录成功,会自动跳转(由onAuthStateChange处理)
      router.push('/generate')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}
```

### 2. signIn 函数 (lib/auth-context.tsx)

```typescript
const signIn = async (email: string, password: string) => {
  const client = getClient()

  if (!client) {
    // Mock模式 - 开发环境未配置Supabase时
    console.log('Mock signin:', email)
    return { error: null }
  }

  // 使用Supabase Auth登录
  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  return { error }
}
```

### 3. Supabase客户端初始化

```typescript
// lib/auth-context.tsx
import { createClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('Supabase未配置,使用Mock模式')
    return null
  }

  if (url.includes('your-project-id') || key.includes('your-supabase')) {
    console.warn('Supabase使用占位符配置')
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, key)
  }

  return supabaseClient
}
```

### 4. AuthContext - 全局状态管理

```typescript
// lib/auth-context.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = getClient()
    if (!client) {
      setLoading(false)
      return
    }

    // 获取当前session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听auth状态变化
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const client = getClient()
    if (!client) {
      // Mock模式
      setUser({ id: 'mock-user', email } as User)
      setSession({} as Session)
      return
    }

    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    const client = getClient()
    if (!client) {
      setUser(null)
      setSession(null)
      return
    }

    await client.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 5. API调用认证

```typescript
// 服务器端API - 验证token
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.substring(7)

  // 使用Supabase Admin验证token
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Token有效,处理请求
  return NextResponse.json({ user })
}
```

```typescript
// 客户端API调用
const { session } = useAuth()

const fetchData = async () => {
  const response = await fetch('/api/conversations/list', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
  // ...
}
```

### 6. Token自动刷新

Supabase SDK自动处理token刷新:

```javascript
// Supabase SDK内部逻辑
if (accessToken即将过期) {
  const { data } = await supabase.auth.refreshSession()
  // 新token自动存储到localStorage
  // 触发onAuthStateChange事件
}
```

### 7. Google OAuth登录流程

```typescript
// 前端组件
const handleGoogleSignIn = async () => {
  const client = getClient()

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback/google`
    }
  })

  if (error) {
    console.error('Google sign in error:', error)
  }
  // 用户会被重定向到Google授权页面
}

// OAuth回调处理
// app/api/auth/callback/google/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=oauth-failed', request.url)
    )
  }

  // 重定向回前端,Supabase会自动处理token
  return NextResponse.redirect(
    new URL('/generate', request.url)
  )
}
```

## 🔒 安全性说明

### JWT Token结构

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "role": "authenticated",
    "iat": 1234567890,
    "exp": 1234571490
  }
}
```

### Token验证流程

```
客户端发送请求
    ↓
Authorization: Bearer eyJhbGci...
    ↓
服务器接收请求
    ↓
提取token
    ↓
调用supabaseAdmin.auth.getUser(token)
    ↓
Supabase验证签名和过期时间
    ↓
返回用户信息或错误
```

### RLS (Row Level Security)

```sql
-- 数据库级别的安全
create policy "Users can view own data"
  on users for select
  using (auth.uid() = id);

-- auth.uid() 自动从token中提取用户ID
-- 即使API被绕过,数据库也会阻止未授权访问
```

## 📊 完整的数据流

```
┌─────────────────┐
│  登录页面        │
│  (app/login)    │
└────────┬────────┘
         │
         │ 用户输入email+password
         ↓
┌─────────────────┐
│  AuthContext    │
│  signIn()       │
└────────┬────────┘
         │
         │ client.auth.signInWithPassword()
         ↓
┌─────────────────┐
│  Supabase Auth  │
│  API            │
└────────┬────────┘
         │
         │ 验证凭据,生成JWT
         ↓
┌─────────────────┐
│  浏览器          │
│  localStorage    │
│  - access_token  │
│  - refresh_token │
└────────┬────────┘
         │
         │ onAuthStateChange触发
         ↓
┌─────────────────┐
│  AuthContext    │
│  更新全局状态    │
│  - setUser()     │
│  - setSession()  │
└────────┬────────┘
         │
         │ 页面重定向
         ↓
┌─────────────────┐
│  首页/应用页面   │
└────────┬────────┘
         │
         │ API请求携带token
         ↓
┌─────────────────┐
│  API路由         │
│  验证token       │
│  返回数据        │
└─────────────────┘
```

## 🎯 关键点总结

### ✅ 登录成功后
1. **JWT Token自动存储** - 存储在localStorage
2. **AuthContext更新** - 全局状态更新
3. **自动token刷新** - Supabase SDK自动处理
4. **页面导航** - 跳转到应用主页

### ✅ 安全性
1. **Supabase Auth** - 行业标准认证
2. **JWT签名验证** - 防止token伪造
3. **RLS保护** - 数据库级别安全
4. **自动刷新** - 减少暴露窗口

### ✅ 用户体验
1. **无缝登录** - Session自动同步
2. **持久化登录** - 刷新页面保持登录
3. **错误处理** - 清晰的错误提示
4. **加载状态** - 登录中显示加载

## 🔧 调试技巧

### 检查登录状态

```javascript
// 在浏览器控制台
const { data } = await supabase.auth.getSession()
console.log('Session:', data.session)

const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)
```

### 检查Token

```javascript
// 查看localStorage
console.log('Access Token:', localStorage.getItem('sb-your-project-id-auth-token'))
console.log('Refresh Token:', localStorage.getItem('sb-your-project-id-refresh-token'))
```

### 监听Auth事件

```javascript
// 在AuthProvider中添加
client.auth.onAuthStateChange((event, session) => {
  console.log('Event:', event) // INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
  console.log('Session:', session)
})
```

## 📚 相关文档

- [Supabase Auth文档](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript客户端](https://supabase.com/docs/reference/javascript)
- [JWT最佳实践](https://supabase.com/docs/guides/auth/server-side-rendering)

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-07
**适用于**: 国际版 (Supabase)
