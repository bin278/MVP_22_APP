# Docker 部署指南 - 腾讯云托管

## 概述

本项目已配置好 Docker 部署所需的文件，可以直接用于腾讯云托管部署。

## 文件说明

### 1. Dockerfile
- 使用多阶段构建，减小镜像大小
- 使用 Node.js 20 Alpine 版本（轻量级）
- 支持 pnpm 包管理器
- 使用 standalone 输出模式优化生产环境

### 2. .dockerignore
- 排除不需要的文件和目录
- 减小构建上下文大小
- 加快构建速度

## 构建和运行

### 本地测试构建

```bash
# 构建镜像
docker build -t mvp22:latest .

# 运行容器
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-supabase-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  mvp22:latest
```

### 腾讯云托管部署

1. **登录腾讯云控制台**
   - 进入 [云开发 CloudBase](https://console.cloud.tencent.com/tcb)
   - 选择或创建环境

2. **配置环境变量**
   在腾讯云控制台设置以下环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   PAYPAL_CLIENT_ID=your-paypal-client-id
   PAYPAL_CLIENT_SECRET=your-paypal-secret
   PAYPAL_ENVIRONMENT=sandbox
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-secret
   DEEPSEEK_API_KEY=your-deepseek-key
   ```

3. **上传代码并构建**
   - 将代码推送到 Git 仓库（GitHub/GitLab）
   - 在腾讯云控制台连接代码仓库
   - 选择 Dockerfile 构建方式
   - 设置构建命令：`docker build -t app .`
   - 设置运行命令：`docker run -p 3000:3000 app`

4. **配置端口**
   - 确保容器暴露端口 3000
   - 在腾讯云控制台配置端口映射

## 环境变量说明

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_APP_URL` | 应用访问 URL | `https://yourdomain.com` |

### 可选的环境变量

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 公钥（支付功能） |
| `STRIPE_SECRET_KEY` | Stripe 私钥（支付功能） |
| `PAYPAL_CLIENT_ID` | PayPal 客户端 ID（支付功能） |
| `PAYPAL_CLIENT_SECRET` | PayPal 客户端密钥（支付功能） |
| `GITHUB_CLIENT_ID` | GitHub OAuth ID（GitHub 集成） |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret（GitHub 集成） |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥（AI 功能） |

## 优化建议

### 1. 镜像大小优化
- 已使用 Alpine Linux 减小基础镜像大小
- 使用多阶段构建，只复制必要的文件
- 排除开发依赖和文档文件

### 2. 构建速度优化
- 使用 `.dockerignore` 排除不必要的文件
- 利用 Docker 层缓存
- 先复制 `package.json` 和 `pnpm-lock.yaml`，再安装依赖

### 3. 运行时优化
- 使用 standalone 输出模式
- 设置 `NODE_ENV=production`
- 禁用 Next.js 遥测

## 故障排除

### 问题：构建失败

**可能原因**：
1. 依赖安装失败
2. 构建脚本错误
3. 内存不足

**解决方案**：
1. 检查 `package.json` 和 `pnpm-lock.yaml` 是否正确
2. 查看构建日志
3. 增加构建资源限制

### 问题：容器启动失败

**可能原因**：
1. 端口冲突
2. 环境变量缺失
3. 文件权限问题

**解决方案**：
1. 检查端口映射配置
2. 验证所有必需的环境变量已设置
3. 检查文件权限（已设置为 nextjs 用户）

### 问题：应用无法访问

**可能原因**：
1. 端口未正确暴露
2. 防火墙规则
3. 域名配置问题

**解决方案**：
1. 确认容器端口 3000 已暴露
2. 检查腾讯云安全组规则
3. 验证域名解析和 SSL 证书

## 监控和日志

### 查看日志

```bash
# 本地查看容器日志
docker logs <container-id>

# 腾讯云控制台查看日志
# 在云开发控制台的"日志"页面查看
```

### 健康检查

应用启动后，访问以下端点检查健康状态：
- `http://yourdomain.com/api/env` - 环境变量检查
- `http://yourdomain.com/api/test-env` - 环境变量测试

## 相关文档

- [Next.js Docker 部署文档](https://nextjs.org/docs/deployment#docker-image)
- [腾讯云托管文档](https://cloud.tencent.com/document/product/876)
- [ENV_API_SETUP.md](./ENV_API_SETUP.md) - 环境变量 API 配置




