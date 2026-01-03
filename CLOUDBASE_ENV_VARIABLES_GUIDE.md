# CloudBase 环境变量使用指南

## 📋 概述

在腾讯云 CloudBase 环境中，前端代码无法直接访问 `process.env`，所有环境变量必须通过后端 API 获取。本指南说明如何正确配置和使用环境变量。

## 🔧 环境变量配置

### 1. CloudBase 控制台配置

在 CloudBase 云托管控制台的环境变量中设置：

```bash
# 应用基础配置
NEXT_PUBLIC_APP_URL=https://your-cloudbase-domain.com
NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=your-env-id

# 微信登录配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# JWT配置 (微信登录必需)
# 生成方法: node scripts/generate-jwt-secret.js
JWT_SECRET=your_jwt_secret_key_at_least_32_characters

# 支付配置
WECHAT_PAY_APPID=your_wechat_pay_appid
ALIPAY_APP_ID=your_alipay_appid

# AI模型配置
DEEPSEEK_API_KEY=your_deepseek_key
GLM_API_KEY=your_glm_key
```

### 2. 环境变量获取方式

#### ❌ 错误方式（在CloudBase环境中无法工作）
```tsx
// 不要在客户端组件中直接使用process.env
function MyComponent() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL; // ❌ 无法获取
  const wechatAppId = process.env.WECHAT_APP_ID; // ❌ 无法获取
}
```

#### ✅ 正确方式（通过API获取）
```tsx
import { useEnv } from '@/hooks/use-env';

function MyComponent() {
  const { env, loading, error } = useEnv();

  if (loading) return <div>加载中...</div>;
  if (error) return <div>加载失败</div>;

  return (
    <div>
      <p>应用地址: {env.NEXT_PUBLIC_APP_URL}</p>
      <p>微信AppID: {env.WECHAT_APP_ID}</p>
      <p>部署区域: {env.DEPLOYMENT_REGION}</p>
    </div>
  );
}
```

## 📚 API 接口

### GET `/api/env`

获取前端可访问的环境变量。

**响应格式:**
```json
{
  "success": true,
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://your-domain.com",
    "NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID": "your-env-id",
    "WECHAT_APP_ID": "wxdcd6dda48f3245e1",
    "DEPLOYMENT_REGION": "cn",
    "NODE_ENV": "production"
  },
  "timestamp": "2025-12-22T15:30:00.000Z"
}
```

## 🔧 工具函数

### useEnv Hook

```tsx
import { useEnv } from '@/hooks/use-env';

function MyComponent() {
  const { env, loading, error } = useEnv();

  // env 包含所有前端需要访问的环境变量
  // loading: boolean - 是否正在加载
  // error: Error | null - 加载错误（如果有）
}
```

### getPublicEnv 函数

```tsx
import { getPublicEnv } from '@/lib/env-client';

// 异步获取环境变量
const env = await getPublicEnv();

// 同步获取（需要先调用getPublicEnv）
import { getPublicEnvSync } from '@/lib/env-client';
const env = getPublicEnvSync();
```

## 🎯 最佳实践

### 1. 延迟加载

对于非关键的环境变量，可以延迟加载：

```tsx
import { useEnv } from '@/hooks/use-env';

function MyComponent() {
  const [showDetails, setShowDetails] = useState(false);
  const { env, loading } = useEnv();

  return (
    <div>
      <button onClick={() => setShowDetails(true)}>
        显示详细信息
      </button>

      {showDetails && (
        <div>
          {loading ? '加载中...' : `App URL: ${env.NEXT_PUBLIC_APP_URL}`}
        </div>
      )}
    </div>
  );
}
```

### 2. 错误处理

```tsx
import { useEnv } from '@/hooks/use-env';

function MyComponent() {
  const { env, loading, error } = useEnv();

  if (error) {
    console.error('环境变量加载失败:', error);
    // 可以显示错误状态或使用默认值
    return <div>配置加载失败，请稍后重试</div>;
  }

  if (loading) {
    return <div>加载配置中...</div>;
  }

  // 正常渲染
  return <div>App URL: {env.NEXT_PUBLIC_APP_URL}, WeChat ID: {env.WECHAT_APP_ID}</div>;
}
```

### 3. 服务端渲染兼容

```tsx
// 在服务端组件中使用
import { getPublicEnvSync } from '@/lib/env-client';

export default function ServerComponent() {
  // 服务端可以直接访问process.env
  const env = getPublicEnvSync();

  return <div>App URL: {env.NEXT_PUBLIC_APP_URL}, WeChat ID: {env.WECHAT_APP_ID}</div>;
}
```

## ⚠️ 安全注意事项

### 敏感信息
- 永远不要在前端可访问的环境变量中包含敏感信息（如API密钥、数据库密码）
- 只有以 `NEXT_PUBLIC_` 开头的变量会被传递给前端

### 变量命名
- 前端需要访问的变量必须以 `NEXT_PUBLIC_` 开头
- 其他变量只在服务端可用

### 缓存策略
- 环境变量会被浏览器缓存，避免频繁请求
- 如需强制刷新，可以使用 `clearEnvCache()` 函数

## 🔍 调试技巧

### 检查环境变量
```tsx
// 在浏览器控制台中
fetch('/api/env')
  .then(res => res.json())
  .then(data => console.log('环境变量:', data));
```

### 开发环境
在本地开发时，环境变量仍然可以直接从 `process.env` 访问，但生产环境必须通过API获取。

## 📞 常见问题

### Q: 为什么环境变量获取不到？
A: 确保在CloudBase控制台正确设置了环境变量，并且应用已重新部署。

### Q: useEnv hook 一直显示 loading？
A: 检查 `/api/env` 接口是否正常响应，可能存在网络或配置问题。

### Q: 环境变量在服务端和客户端不一致？
A: 服务端可以直接访问 `process.env`，客户端必须通过API获取。这是正常行为。

---

**按照本指南配置后，您的应用将在 CloudBase 环境中正确访问所有必需的环境变量！** 🚀




