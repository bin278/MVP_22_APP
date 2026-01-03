# 🚨 CloudBase 生产环境认证失败 - 环境变量配置指南

## 📋 问题诊断

从你的生产环境日志来看，CloudBase初始化成功但认证全部失败（401 Unauthorized）。原因是生产环境中缺少必要的环境变量配置。

**关键错误信息：**
```
Authentication failed, token may be expired
/api/conversations/list: 401 (Unauthorized)
/api/github/status: 401 (Unauthorized)
/api/subscription/status: 401 (Unauthorized)
```

## 🔧 解决方案

### 步骤1：登录腾讯云CloudBase控制台

1. 访问 [腾讯云CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的环境：`cloud1-3gn61ziydcfe6a57`

### 步骤2：配置环境变量

在CloudBase控制台中找到 **环境变量** 设置，添加以下变量：

#### 📌 必需的环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `JWT_SECRET` | `your_secure_jwt_secret_here_please_change_this` | JWT令牌签名密钥（必须修改为强密码） |
| `NODE_ENV` | `production` | 明确标识生产环境 |
| `AUTH_PROVIDER` | `cloudbase` | 指定认证提供商 |
| `DATABASE_PROVIDER` | `cloudbase` | 指定数据库提供商 |

#### 🔐 AI API配置（代码生成必需）

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DEEPSEEK_API_KEY` | 你的DeepSeek API密钥 | AI代码生成必需 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | DeepSeek API地址 |
| `DEEPSEEK_MAX_TOKENS` | `4000` | 最大token数 |
| `DEEPSEEK_TEMPERATURE` | `0.7` | AI生成温度 |

#### 🔑 微信认证配置（如果使用微信登录）

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `WECHAT_APP_ID` | `wxdcd6dda48f3245e1` | 微信应用ID |

### 步骤3：生成安全的JWT密钥

在命令行中运行以下命令生成随机密钥：

```bash
# 使用Node.js生成32字节的随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将生成的密钥设置为 `JWT_SECRET` 的值。

### 步骤4：保存并重新部署

1. 在CloudBase控制台保存环境变量
2. 重新部署应用（选择"重新部署"而不是"增量部署"）

## ✅ 配置验证

部署完成后，你应该看到：

### 成功日志：
```
🔐 CloudBase认证服务已初始化
🔐 Environment check: NODE_ENV=production, isDev=false
生产环境：验证token...
✅ JWT token验证成功，用户: xxx
```

### 失败时可能看到的错误：
- `JWT_SECRET not configured` - JWT密钥未配置
- `Token expired` - 令牌过期
- `Invalid token` - 令牌无效

## 🔍 故障排除

### 如果仍有401错误：

1. **检查环境变量**
   ```bash
   # 可以通过API检查环境变量
   curl https://mornfront.mornscience.top/api/env
   ```

2. **检查JWT密钥**
   - 确保JWT_SECRET是强密码（至少32个字符）
   - 不要使用默认值

3. **检查NODE_ENV**
   - 确保设置为 `production`
   - 如果未设置，应用会进入开发模式，跳过认证

4. **检查数据库连接**
   - 确保CloudBase数据库中的用户表存在
   - 检查用户记录是否正确

### 常见问题：

**Q: 为什么本地开发正常，生产环境不行？**
A: 本地环境有默认的开发用户模拟，生产环境需要真实的JWT认证。

**Q: JWT_SECRET可以设置什么值？**
A: 建议使用32字节以上的随机字符串，可以用上述命令生成。

**Q: 环境变量什么时候生效？**
A: 需要重新部署整个应用才能生效。

## 🚀 下一步

配置完成后，你的伪流式代码生成功能应该可以正常工作：

1. ✅ CloudBase初始化
2. ✅ 用户认证
3. ✅ API访问
4. ✅ 代码生成

## 📞 技术支持

如果配置后仍有问题，请提供：
- CloudBase控制台的环境变量截图（敏感信息打码）
- 最新的应用日志
- 具体的错误信息

---

**重要提醒：** 生产环境的JWT_SECRET必须保密，不要在任何地方公开。




