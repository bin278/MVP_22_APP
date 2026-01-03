# 订阅过期清理功能测试指南

## 📋 功能概述

已实现的订阅过期自动清理功能包含两个部分:

### 1. 自动过期检测 (懒加载清理)
- 当用户访问应用时自动检测订阅是否过期
- 如果过期,异步更新数据库中的订阅状态为 "expired"
- 不影响用户访问体验(零停机)
- 位置: `lib/subscription/usage-tracker.ts:154-164`

### 2. 批量手动清理
- API 接口用于批量清理所有过期订阅
- 同时更新 `user_subscriptions` 和 `users` 集合
- 位置: `app/api/subscription/cleanup-expired/route.ts`

---

## 🧪 测试方法

### 方法 1: 使用浏览器测试工具 (推荐)

1. **打开测试页面**
   ```bash
   # 在浏览器中打开
   file:///f:/project1/china/11/scripts/test-cleanup-in-browser.html
   # 或部署到你的服务器后访问
   ```

2. **获取 Access Token**
   - 登录到你的应用
   - 按 F12 打开浏览器控制台
   - 执行以下代码获取 token:
   ```javascript
   JSON.parse(localStorage.getItem('app-auth-state') || '{}').accessToken
   ```
   - 复制返回的 token

3. **测试 API**
   - 将 token 粘贴到测试页面的输入框
   - 点击 "设置 Token"
   - 点击 "查看过期订阅统计" - 查看 API 是否正常工作
   - 点击 "执行批量清理" - 清理所有过期订阅(可选)

---

### 方法 2: 使用命令行测试脚本

#### 步骤 1: 查看过期订阅统计

```bash
# 设置环境变量
TOKEN=your_access_token_here

# 运行测试脚本
TOKEN=$TOKEN node scripts/test-cleanup-function.mjs
```

这个脚本会:
- 查询所有过期订阅
- 显示过期订阅的详细信息(ID、用户ID、计划类型、过期天数)
- 如果有过期订阅,询问是否执行批量清理

#### 步骤 2: 测试自动过期检测功能

首先创建一个已过期的测试订阅:

```bash
# 1. 获取一个用户ID(可以是你的测试用户)
# 2. 为该用户创建过期订阅
node scripts/test-create-expired-subscription.mjs <userId>

# 示例:
node scripts/test-create-expired-subscription.mjs abc123xyz
```

这个脚本会:
- 创建一个状态为 "active" 但日期已过期的订阅
- 更新用户的订阅计划为 "pro"
- 输出测试步骤和验证方法

然后:
1. 使用该用户账户登录应用
2. 访问任何需要检查订阅的页面(如生成代码页面)
3. 查看浏览器控制台,应该看到:
   ```
   [CloudBase Plan] User xxx subscription expired at 2024-xx-xx
   [Subscription Cleanup] Updating expired subscription xxx
   [Subscription Cleanup] Successfully marked subscription xxx as expired
   ```
4. 刷新页面,用户的订阅计划应该降级为 "free"

---

### 方法 3: 手动 API 测试

使用 curl 或 Postman 测试:

#### 查看过期订阅统计 (GET)

```bash
curl -X GET http://localhost:3000/api/subscription/cleanup-expired \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**响应示例:**
```json
{
  "success": true,
  "stats": {
    "totalActive": 10,
    "expired": 2,
    "active": 8
  },
  "expiredSubscriptions": [
    {
      "id": "sub123",
      "userId": "user456",
      "plan": "pro",
      "subscriptionEnd": "2024-01-15T00:00:00.000Z",
      "daysSinceExpiry": 14
    }
  ]
}
```

#### 执行批量清理 (POST)

```bash
curl -X POST http://localhost:3000/api/subscription/cleanup-expired \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**响应示例:**
```json
{
  "success": true,
  "message": "Cleaned up 2 expired subscriptions",
  "cleaned": 2,
  "failed": 0,
  "results": [
    {
      "subscriptionId": "sub123",
      "userId": "user456",
      "plan": "pro",
      "expiredAt": "2024-01-15T00:00:00.000Z",
      "success": true
    }
  ]
}
```

---

## ✅ 验证清单

测试完成后,请验证以下几点:

### 自动过期检测
- [ ] 创建过期订阅后,用户访问应用时控制台有日志输出
- [ ] 过期订阅的 status 字段被更新为 "expired"
- [ ] 用户的 subscription_plan 被降级为 "free"
- [ ] 用户无法继续使用付费功能

### 批量清理 API
- [ ] GET 请求返回正确的过期订阅统计
- [ ] POST 请求成功清理所有过期订阅
- [ ] 清理后 users 集合中的 subscription_plan 同步更新
- [ ] API 返回详细的成功/失败报告

### 数据一致性
- [ ] 过期订阅的 updated_at 字段被正确更新
- [ ] 没有过期但 status="active" 的订阅被误清理
- [ ] 清理失败时有详细的错误日志

---

## 🔄 用户升级场景处理

### 问题分析

当用户升级订阅时:
1. 系统会创建**新的**订阅记录(未来日期)
2. 旧的订阅记录仍保持 `status: "active"` (但已过期)
3. 用户可能有多个 "active" 订阅

### 解决方案

批量清理 API 已经过优化，会智能处理升级场景:

#### ✅ 清理逻辑 (已优化)

```typescript
// 1. 检查用户是否有其他活跃订阅
const activeSubsResult = await db
  .collection("user_subscriptions")
  .where({
    user_id: subscription.user_id,
    status: "active",
  })
  .get();

// 2. 过滤出未过期的活跃订阅
const hasActiveSubscription = activeSubsResult.data.some((activeSub) =>
  activeSub._id !== subscription._id &&
  activeSub.subscription_end >= now
);

// 3. 只有当用户没有其他活跃订阅时，才降级为 free
if (!hasActiveSubscription) {
  // 降级为 free
  await db.collection("users").doc(userId).update({
    subscription_plan: "free",
  });
} else {
  // 保持当前计划 (用户刚升级)
  console.log('用户有其他活跃订阅，保持当前计划');
}
```

### 测试升级场景

创建一个测试场景，模拟用户从过期订阅升级到新订阅:

```bash
# 1. 创建升级场景 (一个过期订阅 + 一个新订阅)
node scripts/test-upgrade-scenario.mjs <userId>

# 2. 运行批量清理
TOKEN=your_token node scripts/test-cleanup-function.mjs

# 3. 验证结果:
# ✅ 旧订阅 → status = "expired"
# ✅ 新订阅 → status = "active" (保持不变)
# ✅ 用户计划 → subscription_plan = "pro" (不会降级为 free)
```

### 关键区别

| 场景 | 旧订阅 | 新订阅 | 用户计划降级? |
|------|--------|--------|--------------|
| **订阅过期** | expired | 无 | ✅ 是 (free) |
| **用户升级** | expired | ✅ 有效 | ❌ 否 (保持 pro) |

---

## 📊 监控建议

在生产环境中,建议定期运行批量清理:

### 定时任务 (使用 Vercel Cron 或其他调度器)

```javascript
// app/api/cron/cleanup-subscriptions/route.ts
export async function GET(request: NextRequest) {
  // 验证 cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 调用清理 API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscription/cleanup-expired`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
    },
  });

  const data = await response.json();

  return NextResponse.json({
    success: true,
    cleaned: data.cleaned,
    timestamp: new Date().toISOString(),
  });
}
```

### Vercel Cron 配置 (vercel.json)

```json
{
  "crons": [{
    "path": "/api/cron/cleanup-subscriptions",
    "schedule": "0 2 * * *"
  }]
}
```

---

## 🗑️ 清理测试数据

测试完成后,记得清理测试数据:

```bash
# 连接到 CloudBase 数据库
# 删除测试订阅记录
db.user_subscriptions.deleteMany({
  metadata: { test: true }
})
```

---

## ❓ 常见问题

### Q1: 自动清理会影响性能吗?
A: 不会。更新操作是异步执行的,不会阻塞用户请求。即使更新失败,用户仍会被正确降级到免费版。

### Q2: 批量清理需要多长时间?
A: 取决于过期订阅数量。通常几百条订阅在几秒内就能完成。

### Q3: 清理失败会怎样?
A: 详细的错误信息会记录在日志中,并且清理结果会返回具体哪些订阅清理失败,可以针对性重试。

### Q4: 如何防止重复清理?
A: 清理后订阅的 status 变为 "expired",下次查询时不会被包含在 active 订阅中,因此不会重复清理。

---

## 📝 相关文件

- 核心逻辑: `lib/subscription/usage-tracker.ts`
- 批量清理 API: `app/api/subscription/cleanup-expired/route.ts`
- 浏览器测试工具: `scripts/test-cleanup-in-browser.html`
- 命令行测试: `scripts/test-cleanup-function.mjs`
- 创建测试订阅: `scripts/test-create-expired-subscription.mjs`
