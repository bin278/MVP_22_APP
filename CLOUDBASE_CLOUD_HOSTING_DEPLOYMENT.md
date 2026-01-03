# CloudBase 云托管部署指南

## 📋 概述

本项目已优化为腾讯云 CloudBase 云托管部署，支持 GitHub 自动部署。

## ✅ 已完成的配置优化

### 1. Next.js 配置优化
- ✅ 启用 `standalone` 输出模式
- ✅ CloudBase 构建环境变量支持
- ✅ 静态资源优化配置

### 2. Docker 配置优化
- ✅ Node.js 20 Alpine 镜像
- ✅ 多阶段构建优化
- ✅ 健康检查配置
- ✅ 云托管环境变量支持

### 3. CloudBase 配置优化
- ✅ 云托管框架配置
- ✅ GitHub 部署支持
- ✅ 自动扩缩容配置

### 4. 项目文件优化
- ✅ `.dockerignore` 文件
- ✅ 部署检查脚本
- ✅ 健康检查 API

## 🚀 部署步骤

### 步骤 1: 推送代码到 GitHub

```bash
git add .
git commit -m "feat: 优化 CloudBase 云托管部署配置"
git push origin main
```

### 步骤 2: CloudBase 云托管控制台配置

1. 登录 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 选择你的环境
3. 点击「云托管」→「新建服务」
4. 选择「GitHub」作为代码源
5. 连接你的 GitHub 仓库

### 步骤 3: 服务配置

```
服务名称: mvp22-frontend
框架类型: Next.js
Node.js 版本: 20
构建命令: CLOUDBASE_BUILD=true pnpm build
启动命令: node server.js
端口: 3000
```

### 步骤 4: 环境变量配置

在 CloudBase 云托管控制台的环境变量中添加：

#### 基础配置
```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DEPLOYMENT_REGION=cn
CLOUDBASE_BUILD=true
```

#### CloudBase 配置
```bash
NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=你的环境ID
AUTH_PROVIDER=cloudbase
DATABASE_PROVIDER=cloudbase
NEXT_PUBLIC_APP_URL=https://你的域名
```

#### 支付配置
```bash
# 微信支付
WECHAT_PAY_APPID=你的微信支付AppID
WECHAT_PAY_MCHID=你的商户号
WECHAT_PAY_PRIVATE_KEY=你的私钥
WECHAT_PAY_API_V3_KEY=你的API密钥
WECHAT_PAY_SERIAL_NO=你的证书序列号

# 支付宝
ALIPAY_APP_ID=你的支付宝AppID
ALIPAY_PRIVATE_KEY=你的私钥
ALIPAY_PUBLIC_KEY=你的公钥
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do

# 支付测试模式（可选）
PAYMENT_TEST_MODE=false
```

#### AI 模型配置
```bash
# DeepSeek
DEEPSEEK_API_KEY=你的API密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# GLM-4.6 (智谱AI)
GLM_API_KEY=你的智谱AI密钥
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
GLM_MODEL=glm-4-6
```

### 步骤 5: 部署配置

```yaml
# 自动扩缩容配置
minInstances: 1
maxInstances: 10
cpu: 0.5
memory: 1GB

# 健康检查
healthCheck:
  path: /api/health
  interval: 30s
  timeout: 5s
```

### 步骤 6: 部署

1. 保存配置
2. 点击「部署」
3. 等待构建完成（约 5-10 分钟）
4. 访问生成的域名

## 🔍 部署前检查

运行部署检查脚本：

```bash
npm run cloudbase:check-deploy
```

这个脚本会检查：
- ✅ 核心文件是否存在
- ✅ 配置是否正确
- ✅ 环境变量是否配置

## 🐛 常见问题

### 构建失败

#### pnpm lockfile 兼容性问题
```
ERR_PNPM_LOCKFILE_BREAKING_CHANGE Lockfile not compatible with current pnpm
```
**解决方案**: 已自动处理，支持多种后备方案：
1. 使用 `--force` 参数
2. 删除 lockfile 重新生成
3. 回退到 npm

#### 其他构建问题
- 检查 `package.json` 中的依赖是否完整
- 确认 Node.js 版本为 20
- 检查环境变量格式是否正确

### 健康检查失败
- 确认 `/api/health` 端点可访问
- 检查数据库连接配置
- 验证支付配置

### 静态资源无法访问
- 检查 `next.config.mjs` 中的 `assetPrefix` 配置
- 确认静态文件已正确复制到容器

## 📊 监控和维护

### 日志查看
```bash
# 在 CloudBase 控制台查看应用日志
# 监控 -> 日志管理
```

### 性能监控
- CPU/内存使用率
- 请求响应时间
- 错误率统计

### 扩缩容配置
- 根据实际负载调整实例数量
- 设置合理的 CPU/内存限制

## 🔄 更新部署

当代码有更新时：

1. 推送代码到 GitHub
2. CloudBase 会自动触发重新构建
3. 等待部署完成
4. 验证功能正常

## 📞 技术支持

如果遇到部署问题，请：
1. 查看 CloudBase 控制台的构建日志
2. 检查应用运行日志
3. 联系 CloudBase 技术支持

---

**配置完成！你的项目现在已经准备好部署到 CloudBase 云托管了！** 🚀

