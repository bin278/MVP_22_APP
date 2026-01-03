# PayPal Sandbox 账户问题修复指南

## ⚠️ 错误提示

**"您正在登录卖家的账户进行此次购物。请更改您的登录信息，然后重试。"**

## 🔍 问题原因

PayPal Sandbox 不允许使用**商家/卖家账户**为自己完成支付。你需要使用**个人/买家账户**来测试支付流程。

## ✅ 解决方案

### 方法 1: 创建新的买家测试账户（推荐）

1. **访问 PayPal Developer Dashboard**
   - 打开 https://developer.paypal.com/
   - 登录你的账户

2. **创建买家测试账户**
   - 进入 **Dashboard** → **Accounts** → **Sandbox** → **Accounts**
   - 点击 **Create account** 或 **Create test account**
   - 选择账户类型：**Personal**（个人账户）
   - 填写账户信息：
     - Email: `buyer-test@example.com`（或任意邮箱）
     - Password: 设置一个密码（记住它）
     - Country: 选择你的国家
   - 点击 **Create**

3. **使用买家账户登录**
   - 在 PayPal 支付页面，使用刚创建的**个人账户**登录
   - 不要使用商家账户登录

### 方法 2: 使用现有的个人测试账户

如果你已经有个人测试账户：

1. **查看现有账户**
   - 访问 https://developer.paypal.com/
   - 进入 **Dashboard** → **Accounts** → **Sandbox** → **Accounts**
   - 找到类型为 **Personal** 的账户

2. **获取账户信息**
   - 点击账户查看详情
   - 记录邮箱和密码
   - 如果密码是隐藏的，可以重置密码

3. **使用个人账户登录**
   - 在 PayPal 支付页面使用这个个人账户登录

## 📝 PayPal Sandbox 账户类型说明

| 账户类型 | 用途 | 能否完成支付 |
|---------|------|-------------|
| **Personal**（个人） | 买家账户 | ✅ 可以完成支付 |
| **Business**（商家） | 卖家账户 | ❌ 不能为自己支付 |

## 🔄 完整测试流程

### 1. 准备测试账户

确保你有：
- ✅ 1个 **Personal**（个人）账户 - 用于完成支付
- ✅ 1个 **Business**（商家）账户 - 用于接收支付（可选）

### 2. 创建支付订单

在你的应用中：
1. 选择订阅计划
2. 选择 PayPal 支付方式
3. 点击 **Pay Now**

### 3. 使用买家账户登录

在 PayPal 支付页面：
1. **不要**使用商家账户登录
2. 使用**个人账户**登录：
   - Email: `你的个人测试账户邮箱`
   - Password: `你的个人测试账户密码`

### 4. 完成支付

1. 确认订单详情
2. 点击 **Pay Now** 或 **Continue**
3. 支付成功后自动跳转回你的应用

## 🛠️ 快速创建测试账户步骤

### 步骤 1: 访问 PayPal Developer Dashboard

```
https://developer.paypal.com/dashboard/accounts/sandbox
```

### 步骤 2: 创建个人账户

1. 点击 **Create account** 或 **Create test account**
2. 选择 **Personal**（个人）
3. 填写信息：
   ```
   Email: buyer-test@yourdomain.com
   Password: Test123456!
   Country: United States (或你的国家)
   ```
4. 点击 **Create**

### 步骤 3: 记录账户信息

创建后，记录：
- ✅ Email 地址
- ✅ Password（如果显示）
- ✅ 账户类型（应该是 Personal）

### 步骤 4: 使用账户测试

在支付页面使用这个账户登录。

## 💡 测试账户管理技巧

### 创建多个测试账户

建议创建多个测试账户用于不同场景：

1. **买家账户 1** - 正常支付测试
   - Email: `buyer1@test.com`
   - Type: Personal

2. **买家账户 2** - 支付失败测试
   - Email: `buyer2@test.com`
   - Type: Personal

3. **商家账户** - 接收支付（可选）
   - Email: `merchant@test.com`
   - Type: Business

### 账户密码重置

如果忘记密码：
1. 在 PayPal Developer Dashboard 中找到账户
2. 点击账户详情
3. 点击 **Reset password** 或 **Change password**
4. 设置新密码

## 🔍 验证账户类型

在 PayPal Developer Dashboard 中：
- **Personal** 账户显示为 👤 图标
- **Business** 账户显示为 🏢 图标

确保使用 **Personal** 账户登录支付页面。

## ⚠️ 常见错误

### 错误 1: 使用商家账户登录
**症状**: "您正在登录卖家的账户进行此次购物"
**解决**: 使用 Personal 账户登录

### 错误 2: 账户密码错误
**症状**: 登录失败
**解决**: 在 PayPal Developer Dashboard 中重置密码

### 错误 3: 账户未激活
**症状**: 无法登录
**解决**: 确保账户已创建并激活

## 📚 相关资源

- [PayPal Sandbox 文档](https://developer.paypal.com/docs/api-basics/sandbox/)
- [创建测试账户指南](https://developer.paypal.com/docs/api-basics/sandbox/test-accounts/)
- [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)

## ✅ 检查清单

完成以下步骤后，应该可以正常测试支付：

- [ ] 在 PayPal Developer Dashboard 中创建了 Personal 账户
- [ ] 记录了账户的 Email 和 Password
- [ ] 在支付页面使用 Personal 账户登录（不是 Business 账户）
- [ ] 成功完成支付测试

---

**提示**: 如果仍然遇到问题，确保：
1. 使用的是 Sandbox 环境（不是 Production）
2. PayPal Client ID 和 Secret 是 Sandbox 环境的
3. 账户类型是 Personal（个人账户）




















