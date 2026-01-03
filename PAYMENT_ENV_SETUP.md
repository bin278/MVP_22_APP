# 支付环境变量配置指南

## 问题说明
当前遇到 "Alipay configuration incomplete" 错误，这是因为支付相关的环境变量没有正确设置。

## 必需的环境变量

### 微信支付配置
```bash
WECHAT_PAY_APPID=你的微信支付应用ID
WECHAT_PAY_MCHID=你的微信支付商户号
WECHAT_PAY_PRIVATE_KEY=你的微信支付私钥（PEM格式）
WECHAT_PAY_API_V3_KEY=你的微信支付API v3密钥
WECHAT_PAY_SERIAL_NO=你的微信支付证书序列号
```

### 支付宝配置
```bash
ALIPAY_APPID=你的支付宝应用ID
ALIPAY_PRIVATE_KEY=你的支付宝私钥（PEM格式）
ALIPAY_PUBLIC_KEY=你的支付宝公钥（PEM格式）
```

## 配置步骤

1. **复制环境变量到 `.env.local` 文件**
   ```bash
   cp .env.example .env.local
   ```

2. **编辑 `.env.local` 文件，填入实际的支付配置信息**

3. **重启开发服务器**
   ```bash
   npm run dev
   ```

## 测试模式
如果需要在开发环境中测试支付功能，可以设置：
```bash
PAYMENT_TEST_MODE=true
```
启用测试模式后，微信支付的金额将自动改为 0.01 元。

## 注意事项

- 私钥需要是完整的PEM格式，包括 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`
- 确保私钥格式正确，可以包含多行，使用 `\n` 换行
- 生产环境中必须设置所有必需的环境变量
- 开发环境中可以只设置微信支付或支付宝的配置，根据需要选择

## 获取支付配置

### 微信支付
1. 登录微信支付商户平台
2. 在「产品中心」获取相关配置信息
3. 下载API证书，获取私钥和序列号

### 支付宝
1. 登录支付宝开放平台
2. 在应用详情页获取AppID和密钥信息
3. 生成RSA密钥对并设置













