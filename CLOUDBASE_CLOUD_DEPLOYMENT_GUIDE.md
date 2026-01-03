# ===========================================
# CloudBase 云托管部署指南
# 适用于 mvp_22 项目
# ===========================================

## 📋 目录

- [快速开始](#快速开始)
- [前置条件](#前置条件)
- [CloudBase 配置](#cloudbase-配置)
- [本地开发测试](#本地开发测试)
- [云托管部署](#云托管部署)
- [云函数部署](#云函数部署)
- [域名配置](#域名配置)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 🚀 快速开始

### 10分钟部署流程

1. **配置环境变量**
2. **安装 CloudBase CLI**
3. **登录并部署**
4. **配置域名**
5. **测试功能**

## 📋 前置条件

### 必需条件

- ✅ 腾讯云账号和实名认证
- ✅ CloudBase 环境 (已创建)
- ✅ Node.js 16+
- ✅ CloudBase CLI

### 可选条件 (支付功能)

- ✅ 微信支付商户号
- ✅ 支付宝应用

## 🔧 CloudBase 配置

### 步骤1：安装 CloudBase CLI

```bash
# 全局安装 CloudBase CLI
npm install -g @cloudbase/cli

# 或使用 pnpm
pnpm add -g @cloudbase/cli

# 验证安装
cloudbase --version
```

### 步骤2：登录 CloudBase

```bash
# 登录 CloudBase (会打开浏览器进行授权)
cloudbase login

# 检查登录状态
cloudbase env:list
```

### 步骤3：初始化项目

```bash
# 进入项目目录
cd mvp_22

# 初始化 CloudBase 项目 (如果需要)
cloudbase init

# 选择现有环境或创建新环境
```

### 步骤4：配置环境变量

在 CloudBase 控制台配置环境变量：

1. **访问环境变量页面**
   ```
   https://console.cloud.tencent.com/tcb/env/{envId}/config
   ```

2. **添加环境变量**

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID` | `cloud1-xxxxx` | CloudBase 环境ID |
| `NEXT_PUBLIC_WECHAT_CLOUDBASE_ID` | `cloud1-xxxxx` | 同上 |
| `AUTH_PROVIDER` | `cloudbase` | 认证提供商 |
| `DATABASE_PROVIDER` | `cloudbase` | 数据库提供商 |
| `DEPLOYMENT_REGION` | `cn` | 部署区域 |
| `NEXT_PUBLIC_APP_URL` | `https://xxx.tcloudbaseapp.com` | 应用URL |

3. **支付相关变量** (可选)

```env
WECHAT_PAY_APPID=wxf8ef6eb93c045731
WECHAT_PAY_MCHID=169478675
WECHAT_PAY_SERIAL_NO=1234567890ABCDEF...
WECHAT_PAY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
WECHAT_PAY_API_V3_KEY=your_api_v3_key

ALIPAY_APP_ID=2021000000000000
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...
```

## 🏠 本地开发测试

### 配置本地环境

```bash
# 复制环境变量模板
cp CLOUDBASE_ENV_EXAMPLE.env .env.local

# 编辑环境变量
nano .env.local
```

### 本地测试 CloudBase 功能

```bash
# 启动本地开发服务器 (CloudBase 模式)
npm run cloudbase:dev

# 或者
CLOUDBASE_BUILD=true npm run dev
```

### 测试所有功能

```bash
# 运行完整测试套件
npm run cloudbase:test

# 或者分别测试
npm run env:validate
npm run cloudbase:check
npm run payment:check
```

## ☁️ 云托管部署

### 方法1：CLI 部署 (推荐)

```bash
# 部署到云托管
npm run cloudbase:deploy

# 查看部署状态
npm run cloudbase:hosting:list
```

### 方法2：手动部署

```bash
# 设置构建标识
export CLOUDBASE_BUILD=true

# 构建项目
npm run cloudbase:build

# 部署静态资源
cloudbase hosting:deploy .next/static --recursive

# 部署应用
cloudbase hosting:deploy .next/server/app --recursive
```

### 方法3：控制台部署

1. **上传代码**
   - 访问 CloudBase 控制台
   - 进入"云托管"页面
   - 点击"部署代码"
   - 选择代码仓库或上传 ZIP

2. **配置构建**
   - 构建命令：`npm run cloudbase:build`
   - 输出目录：`.next`

## ⚡ 云函数部署

### 部署邮箱验证码云函数

```bash
# 部署邮箱验证码发送云函数
npm run cloudbase:functions:deploy-email

# 或者手动部署
cloudbase functions:deploy sendEmailVerification
```

### 测试云函数

在 CloudBase 控制台测试云函数：

```json
{
  "email": "test@example.com"
}
```

### 查看云函数日志

```bash
# 查看云函数列表
cloudbase functions:list

# 查看日志
cloudbase functions:log sendEmailVerification
```

## 🌐 域名配置

### 方法1：CloudBase 默认域名

部署完成后，CloudBase 会自动分配域名：
```
https://xxx.tcloudbaseapp.com
```

### 方法2：绑定自定义域名

1. **添加域名**
   ```bash
   # 在 CloudBase 控制台添加域名
   # 或使用 CLI
   cloudbase hosting:domain:add your-domain.com
   ```

2. **配置 DNS**
   - 在域名服务商处添加 CNAME 记录
   - 指向 CloudBase 分配的域名

3. **SSL 证书**
   - CloudBase 自动提供免费 SSL 证书
   - 支持自定义证书

## 📊 监控和维护

### 应用监控

- **CloudBase 控制台**：实时监控 CPU、内存、网络
- **访问日志**：查看用户访问统计
- **错误日志**：监控应用错误

### 性能监控

```bash
# 查看应用状态
cloudbase hosting:list

# 查看环境信息
cloudbase env:info
```

### 日志查看

```bash
# 查看云托管日志
cloudbase hosting:log

# 查看云函数日志
cloudbase functions:log sendEmailVerification

# 查看数据库操作日志
# 在控制台的数据库页面查看
```

### 备份和恢复

- **自动备份**：CloudBase 每日自动备份数据库
- **手动备份**：在控制台下载数据
- **数据导出**：支持 JSON/CSV 格式

## 🔧 故障排除

### 问题1：部署失败

**检查项：**
- ✅ Node.js 版本 ≥ 16
- ✅ CloudBase CLI 已登录
- ✅ 环境变量已配置
- ✅ 网络连接正常

**解决方案：**
```bash
# 检查环境
cloudbase env:list

# 重新登录
cloudbase login

# 清理缓存后重新部署
rm -rf .next && npm run cloudbase:deploy
```

### 问题2：应用无法访问

**检查项：**
- ✅ 部署状态为"运行中"
- ✅ 环境变量正确
- ✅ 域名配置正确

**解决方案：**
```bash
# 检查部署状态
npm run cloudbase:hosting:list

# 查看应用日志
cloudbase hosting:log --tail

# 测试健康检查端点
curl https://your-domain.com/api/health
```

### 问题3：支付功能异常

**检查项：**
- ✅ 支付参数已配置
- ✅ 证书格式正确
- ✅ CloudBase 环境变量已设置

**解决方案：**
```bash
# 检查支付配置
npm run payment:check

# 查看支付相关日志
cloudbase hosting:log | grep payment
```

### 问题4：云函数调用失败

**检查项：**
- ✅ 云函数已部署
- ✅ 函数代码正确
- ✅ 权限配置正确

**解决方案：**
```bash
# 重新部署云函数
npm run cloudbase:functions:deploy-email

# 测试云函数
cloudbase functions:invoke sendEmailVerification \
  --params '{"email":"test@example.com"}'
```

## 📊 部署检查清单

- [ ] CloudBase CLI 已安装并登录
- [ ] 环境变量已配置
- [ ] 本地测试通过
- [ ] 云托管部署成功
- [ ] 云函数部署成功
- [ ] 域名配置完成
- [ ] SSL 证书生效
- [ ] 支付功能测试通过
- [ ] 监控告警配置

## 💰 费用说明

### 免费额度

- **云托管**：每月 100GB 流量
- **云函数**：每月 40万 GBs 计算资源
- **数据库**：每月 5GB 存储空间
- **CDN**：每月 10GB 流量

### 付费服务

| 服务 | 免费额度 | 超出费用 |
|------|----------|----------|
| 云托管 | 100GB/月 | ¥0.18/GB |
| 云函数 | 40万 GBs/月 | ¥0.000111/GBs |
| 数据库 | 5GB/月 | ¥0.1/GB/天 |
| CDN | 10GB/月 | ¥0.15/GB |

## 🎯 最佳实践

### 性能优化

- 🔧 启用 CDN 加速
- 🔧 配置缓存策略
- 🔧 优化图片资源
- 🔧 使用压缩传输

### 安全配置

- 🔒 定期更新依赖
- 🔒 配置访问控制
- 🔒 启用 HTTPS
- 🔒 监控异常访问

### 监控告警

- 📊 设置错误告警
- 📊 配置性能监控
- 📊 定期检查日志
- 📊 备份重要数据

## 📞 支持与帮助

### 官方资源

- **CloudBase 文档**: https://docs.cloudbase.net/
- **CLI 文档**: https://docs.cloudbase.net/cli/
- **Next.js 部署**: https://docs.cloudbase.net/framework/nextjs/

### 常见问题

- **部署慢**: 检查网络和依赖大小
- **内存不足**: 升级云托管规格
- **访问慢**: 启用 CDN 加速

---

## ✅ 部署完成验证

运行以下命令验证部署：

```bash
# 1. 检查环境变量
npm run env:check

# 2. 检查 CloudBase 配置
npm run cloudbase:check

# 3. 测试应用健康状态
curl https://your-domain.com/api/health

# 4. 测试支付功能 (如果启用)
npm run payment:check
```

**🎉 恭喜！您的 mvp_22 已成功部署到 CloudBase 云托管！**

---

**部署时间**: 约10-20分钟
**难度等级**: 简单
**技术栈**: CloudBase + Next.js + React

