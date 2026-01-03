# 🔧 本地开发环境变量配置指南

## 🚨 问题描述

你遇到的错误是因为本地开发缺少必要的环境变量配置：

```
❌ CloudBase环境ID未正确配置。请在腾讯云控制台设置 NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID 环境变量。
```

## 📋 解决方案

### 步骤1：创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 在项目根目录创建 .env.local 文件
touch .env.local
```

### 步骤2：复制配置内容

将以下内容复制到 `.env.local` 文件中：

```env
# ===========================================
# 本地开发环境变量配置
# ===========================================

# ============================================================================
# CloudBase 腾讯云核心配置 (本地开发必需)
# ============================================================================

# CloudBase环境ID - 前端调用需要
NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=cloud1-3gn61ziydcfe6a57
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloud1-3gn61ziydcfe6a57

# CloudBase API密钥 - 后端服务端调用需要 (本地开发可选)
CLOUDBASE_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDBASE_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 兼容腾讯云原生环境变量
TENCENT_CLOUD_ENV_ID=cloud1-3gn61ziydcfe6a57
TENCENT_CLOUD_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TENCENT_CLOUD_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================================================
# 应用配置
# ============================================================================

# 部署区域
DEPLOYMENT_REGION=cn

# 认证提供商
AUTH_PROVIDER=cloudbase
NEXT_PUBLIC_AUTH_PROVIDER=cloudbase

# 数据库提供商
DATABASE_PROVIDER=cloudbase

# 本地开发URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# ============================================================================
# AI API配置 (本地开发必需)
# ============================================================================

# DeepSeek AI API - 需要真实的API密钥才能生成代码
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MAX_TOKENS=4000
DEEPSEEK_TEMPERATURE=0.7

# JWT密钥 (用于API认证) - 请使用强密码
JWT_SECRET=your_secure_jwt_secret_here_please_change_this

# ============================================================================
# 微信配置 (如果使用微信登录)
# ============================================================================

# 微信应用ID
WECHAT_APP_ID=wxdcd6dda48f3245e1

# ============================================================================
# 测试模式配置
# ============================================================================

# 设为 true 时，所有支付金额改为 0.01 元
PAYMENT_TEST_MODE=true
```

### 步骤3：填入真实配置

#### 获取DeepSeek API密钥：
1. 访问 [DeepSeek官网](https://platform.deepseek.com/)
2. 注册/登录账号
3. 创建API密钥
4. 替换 `your_deepseek_api_key_here`

#### 生成安全的JWT密钥：
```bash
# 使用Node.js生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将生成的密钥替换 `your_secure_jwt_secret_here_please_change_this`

### 步骤4：重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
pnpm run dev
```

## ✅ 验证配置

配置完成后，你应该看到：

```
📊 腾讯云CloudBase连接已建立
✅ CloudBase环境变量配置成功
🚀 开始CloudBase初始化...
```

而不是之前的错误信息。

## 🔍 故障排除

### 如果仍有错误：

1. **检查文件位置**：确保 `.env.local` 在项目根目录
2. **检查语法**：确保没有多余的空格或特殊字符
3. **重启服务器**：Next.js需要重启才能读取新的环境变量
4. **检查API密钥**：确认DeepSeek API密钥有效

### 测试API连接：

运行测试脚本来验证配置：

```bash
# 测试DeepSeek API连接
node scripts/test-api-keys.js

# 测试CloudBase配置
node scripts/check-cloudbase-config.js
```

## 📝 注意事项

- `.env.local` 文件不会被提交到Git仓库
- 生产环境的变量在CloudBase控制台配置
- 不要分享包含真实密钥的文件
- 定期更换API密钥以确保安全





