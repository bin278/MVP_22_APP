# 国内版/国际版版本隔离指南

## 🔒 隔离保证

本项目实现了国内版和国际版的完全隔离,确保两个版本可以独立运行,互不影响。

## 📋 环境变量配置

### 国内版 (默认)

```bash
# .env.local
DATABASE_PROVIDER=cloudbase
# AUTH_PROVIDER 不设置或设置为 cloudbase

TENCENT_CLOUD_ENV_ID=your-env-id
TENCENT_CLOUD_SECRET_ID=your-secret-id
TENCENT_CLOUD_SECRET_KEY=your-secret-key
```

**关键点:**
- `DATABASE_PROVIDER=cloudbase` - 使用腾讯云数据库
- `AUTH_PROVIDER` 不设置 - 默认使用CloudBase认证
- 所有国内版功能正常工作

### 国际版

```bash
# .env.local
DATABASE_PROVIDER=supabase
AUTH_PROVIDER=supabase

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**关键点:**
- `DATABASE_PROVIDER=supabase` - 使用Supabase数据库
- `AUTH_PROVIDER=supabase` - 使用Supabase认证
- 所有国际版功能正常工作

## 🔌 API端点隔离

### 国内版专用API

这些API只在 `DATABASE_PROVIDER=cloudbase` 时可用:

- **POST** `/api/auth/login` - 邮箱登录 (CloudBase)
- **POST** `/api/auth/register` - 用户注册 (CloudBase)
- **GET** `/api/auth/wechat` - 微信登录
- **GET** `/api/auth/wechat/callback` - 微信OAuth回调

### 国际版专用API

这些API只在 `DATABASE_PROVIDER=supabase` 且 `AUTH_PROVIDER=supabase` 时可用:

- **POST** `/api/auth/login-intl` - 邮箱登录 (Supabase)
- **POST** `/api/auth/register-intl` - 用户注册 (Supabase)
- **GET** `/api/auth/login-intl` - 获取Google OAuth URL
- **GET** `/api/auth/callback/google` - Google OAuth回调

### 隔离机制

**如果国际版API在国内版模式下被调用:**

```javascript
// 检查数据库提供商
if (dbProvider !== 'supabase') {
  return NextResponse.json({
    error: 'This API is for international version only. Use /api/auth/login for CN version.'
  }, { status: 400 });
}
```

**响应:**
```json
{
  "error": "This API is for international version (Supabase) only. Please use /api/auth/login for CN version (CloudBase)."
}
```

## 🔐 认证中间件隔离

### lib/auth/auth.ts

```typescript
function getAuthProvider(): 'supabase' | 'cloudbase' {
  // 默认使用cloudbase,只有明确设置AUTH_PROVIDER=supabase时才使用supabase
  const provider = process.env.AUTH_PROVIDER || '';
  return provider === 'supabase' ? 'supabase' : 'cloudbase';
}
```

**工作原理:**
1. 默认情况下(不设置`AUTH_PROVIDER`),使用CloudBase认证
2. 只有明确设置 `AUTH_PROVIDER=supabase` 时才使用Supabase认证
3. 这确保国内版默认行为不受影响

### requireAuth() 函数

```typescript
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authProvider = getAuthProvider();

  if (authProvider === 'cloudbase') {
    // CloudBase认证 (国内版)
    // 验证JWT token或Session token
  } else {
    // Supabase认证 (国际版)
    // 验证Supabase access token
  }
}
```

## 🧪 验证版本隔离

### 运行验证脚本

```bash
node scripts/verify-version-isolation.js
```

**输出示例(国内版):**
```
==================================================
🔒 版本隔离验证
==================================================

📊 当前配置:
   DATABASE_PROVIDER: cloudbase
   AUTH_PROVIDER: 未设置 (默认: cloudbase)

🌍 当前版本:
   ✅ 国内版 (腾讯云 CloudBase)
   数据库: 腾讯云 CloudBase
   认证: CloudBase Auth + JWT
   可用功能: 邮箱登录、微信登录

==================================================
✅ 版本隔离验证完成!
==================================================
```

### 手动验证

#### 测试国内版

```bash
# 1. 确保使用国内版配置
cat .env.local | grep DATABASE_PROVIDER
# 应该显示: DATABASE_PROVIDER=cloudbase

# 2. 启动开发服务器
npm run dev

# 3. 测试国内版API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 4. 测试国际版API被拦截
curl -X POST http://localhost:3000/api/auth/login-intl \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 预期响应: 400错误
```

#### 测试国际版

```bash
# 1. 切换到国际版配置
npm run config:intl

# 2. 编辑.env.local填写Supabase配置

# 3. 重启开发服务器
npm run dev

# 4. 测试国际版API
curl -X POST http://localhost:3000/api/auth/login-intl \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 5. 运行测试脚本
node scripts/test-intl-login.js
```

## 🔄 版本切换

### 从国内版切换到国际版

```bash
# 1. 复制国际版配置
npm run config:intl

# 2. 编辑.env.local,填写Supabase配置
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# AUTH_PROVIDER=supabase

# 3. 验证配置
node scripts/verify-version-isolation.js

# 4. 重启开发服务器
npm run dev
```

### 从国际版切换回国内版

```bash
# 1. 复制国内版配置
npm run config:cn

# 2. 编辑.env.local,填写腾讯云配置
# TENCENT_CLOUD_ENV_ID=your-env-id
# TENCENT_CLOUD_SECRET_ID=your-secret-id
# TENCENT_CLOUD_SECRET_KEY=your-secret-key
# 不设置 AUTH_PROVIDER (删除这一行)

# 3. 验证配置
node scripts/verify-version-isolation.js

# 4. 重启开发服务器
npm run dev
```

## ⚠️ 重要注意事项

### 1. 环境变量优先级

```bash
# 国内版 (默认,推荐)
DATABASE_PROVIDER=cloudbase
# AUTH_PROVIDER 不设置

# 国际版 (明确设置)
DATABASE_PROVIDER=supabase
AUTH_PROVIDER=supabase
```

### 2. 配置验证

**国内版配置检查:**
- ✅ `TENCENT_CLOUD_ENV_ID` 已设置
- ✅ `TENCENT_CLOUD_SECRET_ID` 已设置
- ✅ `TENCENT_CLOUD_SECRET_KEY` 已设置
- ✅ `AUTH_PROVIDER` 不设置或设置为 `cloudbase`

**国际版配置检查:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` 已设置
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已设置
- ✅ `SUPABASE_SERVICE_ROLE_KEY` 已设置
- ✅ `AUTH_PROVIDER=supabase`

### 3. 避免混合配置

**❌ 错误配置示例:**
```bash
# 混合配置 - 会导致问题
DATABASE_PROVIDER=cloudbase
AUTH_PROVIDER=supabase
```

**问题:**
- 数据库使用CloudBase
- 但认证使用Supabase
- 用户无法登录,因为两边数据不匹配

**✅ 正确配置:**
```bash
# 方案1: 国内版
DATABASE_PROVIDER=cloudbase
# AUTH_PROVIDER 不设置

# 方案2: 国际版
DATABASE_PROVIDER=supabase
AUTH_PROVIDER=supabase
```

## 📊 功能对比表

| 功能 | 国内版 | 国际版 | 说明 |
|------|--------|--------|------|
| 邮箱登录 | ✅ /api/auth/login | ✅ /api/auth/login-intl | API端点不同 |
| 微信登录 | ✅ | ❌ | 仅国内版支持 |
| Google登录 | ❌ | ✅ | 仅国际版支持 |
| 用户注册 | ✅ /api/auth/register | ✅ /api/auth/register-intl | API端点不同 |
| 数据库 | CloudBase | Supabase | 完全隔离 |
| 认证方式 | JWT + Session | Supabase Auth | 完全隔离 |
| 认证中间件 | 默认启用 | 需要AUTH_PROVIDER=supabase | 默认国内版 |

## 🐛 常见问题

### Q1: 国内版API调用失败

**检查:**
```bash
# 确认DATABASE_PROVIDER
grep DATABASE_PROVIDER .env.local
# 应该是: DATABASE_PROVIDER=cloudbase

# 确认腾讯云配置
grep TENCENT_CLOUD .env.local
```

### Q2: 国际版API返回400错误

**检查:**
```bash
# 确认两个环境变量都设置了
grep DATABASE_PROVIDER .env.local
# 应该是: DATABASE_PROVIDER=supabase

grep AUTH_PROVIDER .env.local
# 应该是: AUTH_PROVIDER=supabase
```

### Q3: Google登录不工作

**原因:** Google OAuth只在Supabase模式启用

**解决:**
```bash
# 确保是国际版配置
AUTH_PROVIDER=supabase

# 在Supabase控制台启用Google provider
```

### Q4: 版本切换后功能异常

**解决:**
```bash
# 1. 重启开发服务器
npm run dev

# 2. 清除浏览器缓存和localStorage

# 3. 运行验证脚本
node scripts/verify-version-isolation.js
```

## ✅ 隔离保证清单

- [x] 环境变量配置独立
- [x] API端点完全分离
- [x] 认证中间件自动检测
- [x] 默认使用国内版(安全)
- [x] 国际版需要明确配置
- [x] 跨版本调用被拦截
- [x] 错误消息清晰提示
- [x] 验证脚本可用

## 🎯 最佳实践

1. **开发环境**: 使用 `.env.local` 配置
2. **默认行为**: 不设置 `AUTH_PROVIDER`,默认国内版
3. **版本切换**: 使用快速切换脚本 `npm run config:cn` 或 `npm run config:intl`
4. **测试验证**: 每次切换后运行 `node scripts/verify-version-isolation.js`
5. **服务器重启**: 切换版本后务必重启开发服务器

---

**实施日期**: 2026-01-07
**版本**: 1.0.0
**状态**: ✅ 国内版和国际版完全隔离
