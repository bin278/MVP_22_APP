# 微信 OAuth 2.0 登录配置指南

## 📋 概述

本项目已实现完整的微信 OAuth 2.0 授权码登录流程，包括：

- ✅ 二维码生成 API
- ✅ OAuth 回调处理
- ✅ CloudBase 用户认证
- ✅ JWT Token 生成
- ✅ 前端登录流程

## 🔧 环境变量配置

在你的 `.env.local` 文件中添加以下配置：

```bash
# ===========================================
# 微信 OAuth 2.0 配置
# ===========================================

# 微信应用 ID (AppID)
WECHAT_APP_ID=你的微信公众号AppID

# 微信应用密钥 (AppSecret)
WECHAT_APP_SECRET=你的微信公众号AppSecret

# CloudBase 环境 ID
NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=你的CloudBase环境ID

# JWT 密钥 (用于生成Token)
JWT_SECRET=你的JWT密钥，至少32位随机字符串

# 应用 URL (生产环境)
NEXT_PUBLIC_APP_URL=https://你的域名
```

## 📝 获取微信配置信息

### 1. 注册微信开放平台
访问 [微信开放平台](https://open.weixin.qq.com/)

### 2. 创建应用
- 选择「网站应用」或「移动应用」
- 填写应用信息

### 3. 获取 AppID 和 AppSecret
在应用详情页面获取：
- **AppID**: 类似 `wx1234567890abcdef`
- **AppSecret**: 32位字符串

### 4. 配置授权回调域名
在应用设置中添加：
- 开发环境: `http://localhost:3000`
- 生产环境: `https://你的域名`

## 🔐 安全配置

### JWT 密钥生成
```bash
# 生成32位随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 环境变量安全
- 生产环境中不要提交 `.env.local` 到版本控制
- 使用 CloudBase 的环境变量管理功能
- 定期轮换 JWT 密钥

## 🚀 部署配置

### CloudBase 环境变量

在 CloudBase 控制台的环境变量中设置：

```
WECHAT_APP_ID=你的微信AppID
WECHAT_APP_SECRET=你的微信AppSecret
JWT_SECRET=你的JWT密钥
NEXT_PUBLIC_APP_URL=https://你的CloudBase域名
```

### 构建配置

确保 `package.json` 中包含必要的依赖：

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.6"
  }
}
```

## 🔍 测试流程

### 1. 本地测试
```bash
# 启动开发服务器
npm run dev

# 访问登录页面
http://localhost:3000/login

# 点击"Continue with WeChat"按钮
```

### 2. 生产环境测试
```bash
# 部署到 CloudBase
npm run cloudbase:deploy

# 测试登录流程
```

## 📊 登录流程图

```
用户点击微信登录
    ↓
前端调用 /api/auth/wechat/qrcode
    ↓
生成微信OAuth URL并重定向
    ↓
用户扫码确认授权
    ↓
微信回调 /auth/callback
    ↓
解析授权码，调用 /api/auth/wechat
    ↓
获取用户信息，创建/更新CloudBase用户
    ↓
生成JWT Token，设置Cookie
    ↓
跳转到目标页面，完成登录
```

## 🐛 常见问题

### 错误: "invalid-app-id"
- 检查 `WECHAT_APP_ID` 是否正确
- 确认 AppID 对应的应用状态为"已上线"

### 错误: "redirect_uri mismatch"
- 检查授权回调域名配置
- 确保域名与实际访问域名一致

### 错误: "Missing WECHAT_APP_SECRET"
- 检查环境变量是否正确设置
- 确认变量名拼写正确

### 登录后跳转失败
- 检查 `NEXT_PUBLIC_APP_URL` 配置
- 确认回调页面 `/auth/callback` 可访问

## 📞 技术支持

如果遇到问题，请检查：

1. **控制台日志**: 查看浏览器和服务器的错误信息
2. **环境变量**: 确认所有必需的变量都已设置
3. **微信配置**: 验证 AppID 和回调域名
4. **网络连接**: 确保能访问微信API

---

**配置完成后，你的微信OAuth登录功能就可以正常工作了！** 🎉











