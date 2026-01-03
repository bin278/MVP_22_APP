# 环境变量 API 配置指南

## 概述

在腾讯云等部署环境中，前端无法直接访问环境变量。为了解决这个问题，我们实现了一个 API 路由来提供前端需要的环境变量。

## 工作原理

1. **API 路由** (`/api/env`): 后端 API 路由返回前端需要的公共环境变量
2. **客户端工具** (`lib/env-client.ts`): 提供获取和管理环境变量的工具函数
3. **React Hook** (`hooks/use-env.ts`): 在 React 组件中方便地获取环境变量

## 环境变量列表

以下环境变量会通过 API 返回给前端：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

**注意**: 敏感信息（如 `STRIPE_SECRET_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 等）不会通过 API 返回，它们只在服务器端使用。

## 使用方法

### 1. 在 React 组件中使用 Hook

```tsx
import { useEnv } from '@/hooks/use-env'

function MyComponent() {
  const { env, loading, error } = useEnv()
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>Supabase URL: {env?.NEXT_PUBLIC_SUPABASE_URL}</div>
}
```

### 2. 直接使用工具函数

```tsx
import { getPublicEnv } from '@/lib/env-client'

async function myFunction() {
  const env = await getPublicEnv()
  console.log('Supabase URL:', env.NEXT_PUBLIC_SUPABASE_URL)
}
```

### 3. 同步获取（仅在已初始化后）

```tsx
import { getPublicEnvSync } from '@/lib/env-client'

// 注意：需要先调用 getPublicEnv() 初始化缓存
function MyComponent() {
  useEffect(() => {
    getPublicEnv() // 初始化
  }, [])
  
  const env = getPublicEnvSync() // 同步获取
}
```

## Supabase 客户端初始化

Supabase 客户端现在支持从 API 获取环境变量：

```tsx
import { createSupabaseClient } from '@/lib/supabase'

// 异步创建客户端（客户端使用）
const client = await createSupabaseClient()
if (client) {
  const { data } = await client.from('table').select()
}
```

`AuthProvider` 会自动处理 Supabase 客户端的初始化，无需手动调用。

## 缓存机制

环境变量会被缓存，避免频繁请求：

- **浏览器缓存**: API 响应设置了 `Cache-Control: public, max-age=3600`
- **内存缓存**: 客户端工具函数会缓存环境变量，直到页面刷新

## 服务器端 vs 客户端

- **服务器端** (API routes, Server Components): 直接使用 `process.env`，无需通过 API
- **客户端** (Client Components): 通过 API 获取环境变量

## 部署到腾讯云

### 1. 在腾讯云配置环境变量

在腾讯云控制台设置以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. 验证配置

部署后，访问 `/api/env` 端点验证环境变量是否正确返回：

```bash
curl https://yourdomain.com/api/env
```

应该返回 JSON 格式的环境变量：

```json
{
  "NEXT_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_test_...",
  "NEXT_PUBLIC_APP_URL": "https://yourdomain.com"
}
```

## 故障排除

### 问题：环境变量返回为空

**原因**: 环境变量未在腾讯云正确配置

**解决**: 
1. 检查腾讯云控制台中的环境变量配置
2. 确保变量名正确（区分大小写）
3. 重启应用服务

### 问题：API 请求失败

**原因**: API 路由未正确部署或网络问题

**解决**:
1. 检查 `/api/env` 路由是否可访问
2. 查看服务器日志
3. 检查网络连接

### 问题：Supabase 客户端初始化失败

**原因**: 环境变量未正确获取

**解决**:
1. 检查浏览器控制台错误
2. 验证 `/api/env` 返回的数据
3. 确保 Supabase URL 和 Key 格式正确

## 安全注意事项

1. **只返回公共变量**: API 只返回 `NEXT_PUBLIC_*` 前缀的变量
2. **敏感信息保护**: 永远不会返回 Secret Keys、Service Role Keys 等敏感信息
3. **缓存控制**: 使用适当的缓存策略，避免频繁请求

## 开发环境

在开发环境中，如果 `process.env` 可用，代码会自动回退到直接使用 `process.env`，无需通过 API。

## 相关文件

- `app/api/env/route.ts` - API 路由实现
- `lib/env-client.ts` - 客户端工具函数
- `hooks/use-env.ts` - React Hook
- `lib/supabase.ts` - Supabase 客户端初始化






