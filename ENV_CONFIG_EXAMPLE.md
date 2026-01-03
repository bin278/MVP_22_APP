# ===========================================
# mvp_22 环境变量配置指南
# ===========================================

## 概述

mvp_22 支持微信支付和支付宝两种支付方式。本文档介绍所需的环境变量配置。

## 必需配置

### 腾讯云 CloudBase 配置

```bash
# 获取地址: https://console.cloud.tencent.com/tcb/env/index
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=your_cloudbase_env_id

# CloudBase 管理员密钥 (用于服务端操作)
# 获取地址: https://console.cloud.tencent.com/cam/capi
CLOUDBASE_SECRET_ID=your_secret_id
CLOUDBASE_SECRET_KEY=your_secret_key

# 兼容腾讯云环境变量 (如果使用腾讯云原生环境)
TENCENT_CLOUD_ENV_ID=your_env_id
TENCENT_CLOUD_SECRET_ID=your_secret_id
TENCENT_CLOUD_SECRET_KEY=your_secret_key
```

## 可选配置 (支付功能)

### 微信支付配置

1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 申请商户号并配置支付
3. 获取以下信息：

```bash
WECHAT_PAY_APPID=wx1234567890abcdef      # 微信支付应用ID
WECHAT_PAY_MCHID=123456789               # 微信支付商户号
WECHAT_PAY_SERIAL_NO=1234567890ABCDEF... # 证书序列号
WECHAT_PAY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n你的私钥内容\n-----END PRIVATE KEY-----  # API证书私钥
WECHAT_PAY_API_V3_KEY=your_api_v3_key     # API v3 密钥
```

### 支付宝配置

1. 访问 [支付宝开放平台](https://open.alipay.com/)
2. 创建应用并配置支付能力
3. 获取以下信息：

```bash
ALIPAY_APP_ID=2021000000000000           # 支付宝应用ID
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n你的私钥内容\n-----END RSA PRIVATE KEY-----  # 应用私钥
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n你的公钥内容\n-----END PUBLIC KEY-----              # 支付宝公钥
```

### 支付测试模式

```bash
# 设置为 true 时，所有支付金额将改为 0.01 元
PAYMENT_TEST_MODE=false
```

## 快速开始

1. **复制环境变量文件**：
   ```bash
   cp .env.example .env.local
   ```

2. **配置 CloudBase**：
   - 填入 `NEXT_PUBLIC_WECHAT_CLOUDBASE_ID`
   - 填入 `CLOUDBASE_SECRET_ID` 和 `CLOUDBASE_SECRET_KEY`

3. **配置支付 (可选)**：
   - 根据需要配置微信支付或支付宝
   - 建议先开启 `PAYMENT_TEST_MODE=true` 进行测试

4. **启动应用**：
   ```bash
   pnpm dev
   ```

## 注意事项

- **CloudBase 配置是必需的**，用于用户认证和数据存储
- **支付配置是可选的**，如果不配置，用户仍可以浏览应用但无法购买
- **私钥格式**：支持 PEM 格式，换行符可以用 `\n` 转义
- **安全提醒**：不要将私钥等敏感信息提交到代码仓库

## 常见问题

### Q: 如何获取微信支付配置？
A: 访问微信支付商户平台，申请商户号并下载API证书。

### Q: 如何获取支付宝配置？
A: 访问支付宝开放平台，创建应用并生成RSA密钥对。

### Q: 支付功能必须配置吗？
A: 不必需。未配置支付功能时，用户仍可以使用免费功能。

### Q: 如何测试支付功能？
A: 设置 `PAYMENT_TEST_MODE=true`，所有支付金额将改为0.01元。




