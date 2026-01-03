# ===========================================
# 腾讯云完整部署指南 - mvp_22
# 支持 CloudBase + 微信支付 + 支付宝
# ===========================================

## 📋 目录

- [快速开始](#快速开始)
- [前置条件](#前置条件)
- [核心配置](#核心配置)
- [CloudBase 设置](#cloudbase-设置)
- [支付功能配置](#支付功能配置)
- [Docker 部署](#docker-部署)
- [Kubernetes 部署](#kubernetes-部署)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)
- [费用说明](#费用说明)

## 🚀 快速开始

### 5分钟部署流程

1. **配置 CloudBase**
2. **设置环境变量**
3. **构建 Docker 镜像**
4. **部署到腾讯云**
5. **配置域名和 SSL**

## 📋 前置条件

### 必需条件

- ✅ 腾讯云账号
- ✅ CloudBase 环境
- ✅ Node.js 环境 (开发用)
- ✅ Docker 环境 (部署用)

### 可选条件 (支付功能)

- ✅ 微信支付商户号
- ✅ 支付宝应用
- ✅ SSL 证书

## 🔧 核心配置

### 步骤1：CloudBase 环境准备

1. **访问 CloudBase 控制台**
   ```
   https://console.cloud.tencent.com/tcb
   ```

2. **创建环境**
   - 选择地域：广州/上海/北京
   - 环境名称：mvp22-prod
   - 环境ID：自动生成 (如：cloud1-xxxxx)

3. **记录环境ID**
   ```
   环境ID：cloud1-3gn61ziydcfe6a57
   ```

### 步骤2：API 密钥获取

1. **访问访问密钥页面**
   ```
   https://console.cloud.tencent.com/cam/capi
   ```

2. **创建密钥对**
   - 创建新密钥
   - 下载或记录 SecretId 和 SecretKey

3. **记录密钥信息**
   ```
   SecretId: AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SecretKey: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 步骤3：环境变量配置

创建 `.env.local` 文件：

```bash
# 复制配置模板
cp CLOUDBASE_ENV_EXAMPLE.env .env.local

# 编辑配置
nano .env.local
```

关键配置项：
```env
NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=cloud1-3gn61ziydcfe6a57
NEXT_PUBLIC_WECHAT_CLOUDBASE_ID=cloud1-3gn61ziydcfe6a57
CLOUDBASE_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDBASE_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEPLOYMENT_REGION=cn
AUTH_PROVIDER=cloudbase
DATABASE_PROVIDER=cloudbase
```

## ☁️ CloudBase 设置

### 数据库初始化

CloudBase 提供内置数据库，无需额外配置。

### 认证配置

1. **启用邮箱登录**
   - CloudBase控制台 → 用户管理 → 登录设置
   - 启用 "邮箱登录"

2. **配置邮件模板** (可选)
   - 用户管理 → 邮件模板
   - 配置验证码邮件

### 云函数部署 (验证码功能)

```bash
# 部署邮箱验证码云函数
cd cloud-functions/sendEmailVerification
npm install
cloudbase functions:deploy sendEmailVerification
```

## 💰 支付功能配置

### 微信支付设置

1. **申请商户号**
   ```
   https://pay.weixin.qq.com/
   ```

2. **配置支付参数**
   ```env
   WECHAT_PAY_APPID=wxf8ef6eb93c045731
   WECHAT_PAY_MCHID=169478675
   WECHAT_PAY_SERIAL_NO=1234567890ABCDEF...
   WECHAT_PAY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
   WECHAT_PAY_API_V3_KEY=your_api_v3_key
   ```

3. **配置回调地址**
   ```
   支付回调URL: https://your-domain.com/api/payment/cn/wechat/notify
   ```

### 支付宝设置

1. **创建应用**
   ```
   https://open.alipay.com/
   ```

2. **配置支付参数**
   ```env
   ALIPAY_APP_ID=2021000000000000
   ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
   ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...
   ```

## 🐳 Docker 部署

### 方法1：腾讯云容器镜像服务 (TCR)

1. **创建镜像仓库**
   ```
   腾讯云控制台 → 容器镜像服务 → 创建镜像仓库
   ```

2. **构建并推送镜像**
   ```bash
   # 构建镜像
   docker build -t mvp22:latest .

   # 登录腾讯云镜像仓库
   docker login ccr.ccs.tencentyun.com

   # 推送镜像
   docker tag mvp22:latest ccr.ccs.tencentyun.com/your-namespace/mvp22:latest
   docker push ccr.ccs.tencentyun.com/your-namespace/mvp22:latest
   ```

3. **部署到容器服务**
   - 使用 `tencent-cloud-config.yaml`
   - 更新镜像地址和环境变量

### 方法2：腾讯云 Serverless 容器

1. **创建应用**
   ```
   腾讯云控制台 → Serverless 应用中心 → 创建应用
   ```

2. **配置应用**
   - 应用类型：容器应用
   - 镜像来源：Dockerfile
   - 环境变量：参考 `CLOUDBASE_ENV_EXAMPLE.env`

3. **部署应用**
   - 自动构建和部署
   - 支持弹性伸缩

## ☸️ Kubernetes 部署

### 使用腾讯云 TKE

1. **创建 Kubernetes 集群**
   ```
   腾讯云控制台 → 容器服务 → 创建集群
   ```

2. **部署应用**
   ```bash
   # 更新配置
   nano tencent-cloud-config.yaml

   # 部署到集群
   kubectl apply -f tencent-cloud-config.yaml
   ```

3. **配置 Ingress**
   - 自动生成负载均衡器
   - 支持 SSL 证书自动申请

## 📊 监控和维护

### 应用监控

- **CloudBase 控制台**：实时监控应用状态
- **腾讯云监控**：CPU、内存、网络监控
- **日志服务**：集中日志管理

### 数据库监控

- **CloudBase 数据库**：内置监控面板
- **腾讯云 PostgreSQL**：专业数据库监控

### 备份策略

1. **自动备份**
   - CloudBase：每日自动备份
   - PostgreSQL：可配置备份策略

2. **手动备份**
   ```bash
   # 导出数据
   cloudbase db export --envId your-env-id
   ```

## 🔧 故障排除

### 常见问题

#### 问题1：CloudBase 连接失败

**检查项：**
- ✅ 环境变量配置正确
- ✅ SecretId 和 SecretKey 有效
- ✅ 网络连接正常

**解决方案：**
```bash
# 测试连接
node -e "console.log(process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID)"
```

#### 问题2：支付功能异常

**检查项：**
- ✅ 支付参数配置正确
- ✅ 证书格式正确
- ✅ 回调地址可访问

**解决方案：**
```bash
# 测试支付配置
node check-payment-env.js
```

#### 问题3：应用启动失败

**检查项：**
- ✅ Docker 镜像构建成功
- ✅ 环境变量完整
- ✅ 端口配置正确

**解决方案：**
```bash
# 查看容器日志
docker logs <container-id>
```

### 调试工具

```bash
# 环境变量检查
node check-env-content.js

# CloudBase 连接测试
node check-cloudbase-config.js

# 支付配置测试
node check-payment-env.js
```

## 💰 费用说明

### 免费额度

- **CloudBase**：每月免费额度
- **容器服务**：按量计费，有免费时长
- **负载均衡**：按量计费

### 付费服务

| 服务 | 费用说明 | 估算月费 |
|------|----------|----------|
| CloudBase | 按使用量 | ¥0-50 |
| 容器服务 | 按实例规格 | ¥20-200 |
| 负载均衡 | 按流量 | ¥10-100 |
| PostgreSQL | 按规格 | ¥50-500 |
| 域名 SSL | 免费证书 | ¥0 |

### 成本优化

1. **合理选择实例规格**
2. **使用预留实例**
3. **配置自动伸缩**
4. **定期清理资源**

## 🎯 最佳实践

### 安全配置

- 🔒 使用 HTTPS
- 🔒 定期更换密钥
- 🔒 配置防火墙规则
- 🔒 启用日志审计

### 性能优化

- ⚡ 启用 CDN
- ⚡ 配置缓存策略
- ⚡ 优化数据库查询
- ⚡ 使用连接池

### 高可用配置

- 🛡️ 多可用区部署
- 🛡️ 配置健康检查
- 🛡️ 启用自动备份
- 🛡️ 设置监控告警

## 📞 支持与帮助

### 官方文档

- [CloudBase 文档](https://docs.cloudbase.net/)
- [腾讯云容器服务](https://cloud.tencent.com/document/product/457)
- [微信支付文档](https://pay.weixin.qq.com/docs/merchant)
- [支付宝文档](https://open.alipay.com/docs)

### 技术支持

- 📧 腾讯云技术支持
- 💬 CloudBase 社区
- 📚 Stack Overflow

---

## ✅ 部署检查清单

- [ ] CloudBase 环境创建完成
- [ ] API 密钥配置正确
- [ ] 环境变量设置完整
- [ ] Docker 镜像构建成功
- [ ] 应用部署到腾讯云
- [ ] 域名配置和 SSL 证书
- [ ] 支付功能测试通过
- [ ] 监控和告警配置
- [ ] 备份策略设置

**🎉 恭喜！您的 mvp_22 已成功部署到腾讯云！**

