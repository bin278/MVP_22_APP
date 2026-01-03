# 订阅过期清理功能 - 用户升级场景处理

## ✅ 已修复的问题

### 原始问题
当用户升级订阅时，批量清理 API 会**无条件**将用户降级为 `free`，即使用户刚刚购买了新的订阅。

### 修复方案
批量清理 API 现在会智能检查用户是否有其他活跃订阅：

```typescript
// ✅ 修复后的逻辑 (app/api/subscription/cleanup-expired/route.ts:86-145)

// 1. 检查用户是否有其他活跃订阅
const activeSubsResult = await db
  .collection("user_subscriptions")
  .where({
    user_id: subscription.user_id,
    status: "active",
  })
  .get();

// 2. 过滤出未过期的活跃订阅（排除当前要处理的订阅）
const hasActiveSubscription = activeSubsResult.data.some((activeSub: any) =>
  activeSub._id !== subscription._id &&
  activeSub.subscription_end >= now
);

// 3. 只有当用户没有其他活跃订阅时，才降级为 free
if (!hasActiveSubscription) {
  await db.collection("users").doc(userId).update({
    subscription_plan: "free",
  });
} else {
  // 用户有其他活跃订阅（刚升级），保持当前计划
  console.log('用户有其他活跃订阅，保持当前计划');
}
```

---

## 🔄 用户升级流程

### 正常的升级流程

1. **支付成功** → `app/api/payment/cn/wechat/notify/route.ts`
   ```typescript
   await cloudbaseAdapter.createSubscription({
     user_id: payment.user_id,
     subscription_end: subscriptionEndDate.toISOString(), // 未来日期
     status: "active",
     plan_type: planType || "pro",
   });
   ```
   - 创建**新的**订阅记录
   - `subscription_end` = 当前时间 + 30天（未来）
   - `status` = "active"

2. **用户订阅状态**
   - 用户资料中的 `subscription_plan` 更新为 `"pro"`
   - 旧订阅记录仍存在，但已过期
   - 新订阅记录有效

3. **批量清理时的智能处理**
   - ✅ 检测到旧订阅已过期 → 标记为 `"expired"`
   - ✅ 检测到新订阅有效 → 保持 `"active"`
   - ✅ 检测到用户有有效订阅 → **不降级**，保持 `"pro"`

---

## 📊 场景对比

| 场景 | 订阅情况 | 清理后的结果 |
|------|----------|--------------|
| **场景 1: 订阅过期** | 只有1个过期订阅 | 旧订阅 → `expired`<br>用户 → `free` ✅ |
| **场景 2: 用户升级** | 1个过期 + 1个有效 | 旧订阅 → `expired` ✅<br>新订阅 → `active` ✅<br>用户 → `pro` ✅ |
| **场景 3: 续费** | 1个即将过期 + 1个新订阅 | 旧订阅 → `expired` ✅<br>新订阅 → `active` ✅<br>用户 → `pro` ✅ |

---

## 🧪 测试升级场景

### 1. 创建测试场景

```bash
# 为用户创建升级场景: 一个过期订阅 + 一个新订阅
node scripts/test-upgrade-scenario.mjs <userId>
```

这个脚本会:
- 创建一个 10 天前过期的旧订阅
- 创建一个 30 天后过期的新订阅
- 更新用户的 `subscription_plan` 为 `"pro"`

### 2. 运行批量清理

```bash
# 查看过期订阅统计
TOKEN=your_token node scripts/test-cleanup-function.mjs
```

或者使用浏览器测试工具:
```
file:///f:/project1/china/11/scripts/test-cleanup-in-browser.html
```

### 3. 验证结果

清理后应该看到:
- ✅ 旧订阅: `status = "expired"`
- ✅ 新订阅: `status = "active"` (保持不变)
- ✅ 用户计划: `subscription_plan = "pro"` (不会降级为 `free`)

---

## 🎯 关键代码位置

### 1. 批量清理 API (已修复)
**文件**: [app/api/subscription/cleanup-expired/route.ts:86-145](app/api/subscription/cleanup-expired/route.ts#L86-L145)

**关键逻辑**:
- 第 88-101 行: 检查用户是否有其他活跃订阅
- 第 113-126 行: 只有在没有其他活跃订阅时才降级

### 2. 自动过期检测 (不受影响)
**文件**: [lib/subscription/usage-tracker.ts:154-164](lib/subscription/usage-tracker.ts#L154-L164)

**说明**: 自动检测逻辑不受影响，因为它只更新过期的订阅记录，不会影响用户的其他订阅。

### 3. 支付回调 (创建新订阅)
**文件**: [app/api/payment/cn/wechat/notify/route.ts:80-86](app/api/payment/cn/wechat/notify/route.ts#L80-L86)

**说明**: 支付成功时创建的新订阅总是使用未来日期，不会被误删。

---

## 📝 相关文件

### 核心功能
- ✅ [app/api/subscription/cleanup-expired/route.ts](app/api/subscription/cleanup-expired/route.ts) - 批量清理 API (已优化)
- ✅ [lib/subscription/usage-tracker.ts](lib/subscription/usage-tracker.ts) - 自动过期检测

### 测试工具
- ✅ [scripts/test-upgrade-scenario.mjs](scripts/test-upgrade-scenario.mjs) - 测试升级场景
- ✅ [scripts/test-cleanup-function.mjs](scripts/test-cleanup-function.mjs) - 批量清理测试
- ✅ [scripts/test-cleanup-in-browser.html](scripts/test-cleanup-in-browser.html) - 浏览器测试工具

### 文档
- ✅ [soft-license-docs/subscription-cleanup-test-guide.md](soft-license-docs/subscription-cleanup-test-guide.md) - 完整测试指南

---

## ✅ 修复总结

### 修复前
```typescript
// ❌ 问题代码 (已移除)
await db.collection("users").doc(userId).update({
  subscription_plan: "free", // 无条件降级!
});
```

### 修复后
```typescript
// ✅ 修复后的代码
if (!hasActiveSubscription) {
  // 只有在没有其他活跃订阅时才降级
  await db.collection("users").doc(userId).update({
    subscription_plan: "free",
  });
} else {
  // 用户有其他活跃订阅（刚升级），保持当前计划
  console.log('用户有其他活跃订阅，保持当前计划');
}
```

### 优势
1. ✅ **智能检测**: 自动识别用户是否有其他有效订阅
2. ✅ **安全升级**: 升级后的用户不会被误降级
3. ✅ **详细日志**: 清晰记录每个用户的处理情况
4. ✅ **向后兼容**: 不影响原有的过期清理逻辑

---

## 🎉 结论

现在订阅过期清理功能已经完全支持用户升级场景！

- ✅ 订阅过期的用户会被正确降级
- ✅ 刚升级的用户不会被误降级
- ✅ 所有场景都有完整的测试工具
- ✅ 详细的日志记录便于调试

你可以使用 `test-upgrade-scenario.mjs` 脚本创建测试场景，然后运行批量清理 API 来验证功能是否正常工作。
