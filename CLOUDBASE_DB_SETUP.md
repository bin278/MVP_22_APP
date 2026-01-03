# 腾讯云CloudBase数据库配置指南

## 📋 数据迁移状态

✅ **已完成的数据迁移：**
- 用户认证系统 → CloudBase
- 支付记录 → CloudBase
- 对话系统 → CloudBase
- 生成的前端文件 → CloudBase
- 对话消息 → CloudBase

所有生成的前端文件现在都存储在腾讯云CloudBase数据库中！

## 概述

腾讯云CloudBase（云开发）是腾讯云提供的云原生一体化开发环境，支持数据库、云函数、存储等服务。本项目已完全迁移到CloudBase数据库存储所有数据。

## CloudBase环境准备

### 1. 注册腾讯云账号

访问 [腾讯云官网](https://cloud.tencent.com/) 注册账号。

### 2. 开启云开发服务

1. 访问 [腾讯云CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 点击"新建环境"
3. 选择环境名称（如：`mvp-app`）
4. 选择环境规格（体验版即可用于开发测试）
5. 等待环境创建完成

### 3. 获取访问密钥

1. 访问 [腾讯云API密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 创建新的API密钥对
3. 记录 `SecretId` 和 `SecretKey`

### 4. 配置数据库权限

在CloudBase控制台中：
1. 进入"数据库"页面
2. 创建集合（如果需要手动创建）
3. 配置安全规则（允许读写权限用于开发）

## 环境变量配置

在项目根目录创建或更新 `.env.local` 文件：

```env
# 切换到CloudBase数据库
DATABASE_PROVIDER=cloudbase

# 腾讯云CloudBase配置
TENCENT_CLOUD_SECRET_ID=your_secret_id_here
TENCENT_CLOUD_SECRET_KEY=your_secret_key_here
TENCENT_CLOUD_ENV_ID=your_environment_id
```

### 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `TENCENT_CLOUD_SECRET_ID` | API密钥ID | `AKIDxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TENCENT_CLOUD_SECRET_KEY` | API密钥Key | `xxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TENCENT_CLOUD_ENV_ID` | CloudBase环境ID | `mvp-app-xxxxx` |

## 数据库结构

CloudBase使用文档数据库（类似MongoDB），支持以下集合：

### payments（支付记录）

```javascript
{
  _id: "自动生成",
  user_id: "用户ID",
  amount: 29.00,
  currency: "CNY",
  status: "pending|completed|failed|cancelled",
  payment_method: "alipay|wechat",
  transaction_id: "平台交易号",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  completed_at: "2024-01-01T00:00:00.000Z",
  metadata: {
    billingCycle: "monthly",
    planType: "basic",
    description: "基础版订阅"
  }
}
```

### user_subscriptions（用户订阅）

```javascript
{
  _id: "自动生成",
  user_id: "用户ID",
  tier: "free|basic|pro|premium",
  status: "active|inactive|expired",
  current_period_start: "2024-01-01T00:00:00.000Z",
  current_period_end: "2024-02-01T00:00:00.000Z",
  payment_method: "alipay|wechat",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z"
}
```

## 数据库初始化

### 1. 自动初始化

运行以下命令初始化CloudBase数据库：

```bash
npm run db:setup-cloudbase
```

此脚本将：
- 验证CloudBase连接
- 检查集合是否存在
- 插入测试数据
- 验证数据读写功能

### 2. 手动初始化（可选）

如果需要手动创建集合，在CloudBase控制台中：
1. 进入"数据库" → "集合"
2. 创建 `payments` 和 `user_subscriptions` 集合
3. 设置集合权限为"所有用户可读写"（仅用于开发测试）

## 数据迁移（从Supabase）

如果您之前使用Supabase存储了数据，可以迁移到CloudBase：

### 1. 配置Supabase连接

在环境变量中添加Supabase配置：

```env
# Supabase配置（用于数据导出）
SUPABASE_DB_HOST=your_supabase_host
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_supabase_password
```

### 2. 运行迁移脚本

```bash
# 注意：需要先实现CloudBase的迁移脚本
npm run db:migrate-to-cloudbase
```

## 测试和验证

### 1. 连接测试

```bash
npm run db:test
```

### 2. 功能测试

1. 启动应用服务器：
   ```bash
   npm run dev
   ```

2. 访问支付页面：http://localhost:3000/payment

3. 测试支付流程：
   - 选择套餐
   - 选择支付方式（支付宝/微信）
   - 完成支付
   - 验证数据是否正确存储在CloudBase

### 3. 数据验证

在CloudBase控制台中检查：
1. `payments` 集合是否有新的支付记录
2. `user_subscriptions` 集合是否有订阅记录
3. 数据字段是否正确

## CloudBase特性

### 优势

- **开箱即用**：无需配置服务器和数据库
- **弹性扩展**：自动扩容，无需关心容量规划
- **高可用**：腾讯云多可用区部署
- **数据安全**：腾讯云安全合规
- **集成简单**：SDK开箱即用

### 费用说明

- **体验版**：每月赠送一定免费额度
- **按量计费**：根据实际使用量收费
- **预付费**：购买资源包更优惠

### 免费额度

- 数据库存储：5GB
- 数据库读写：50万次/月
- 云函数调用：40万GBs/月
- CDN流量：10GB/月

## 安全配置

### 1. API密钥安全

- 不要在代码中硬编码API密钥
- 定期更换API密钥
- 使用环境变量存储密钥
- 限制API密钥权限

### 2. 数据库权限

生产环境建议配置数据库安全规则：

```javascript
// 仅允许用户访问自己的数据
{
  "read": "auth != null && auth.id == user_id",
  "write": "auth != null && auth.id == user_id"
}
```

### 3. 网络安全

- 使用VPC私有网络
- 配置安全组规则
- 开启WAF防护
- 启用HTTPS

## 监控和维护

### 1. CloudBase控制台监控

- **实时监控**：CPU、内存、磁盘使用率
- **访问统计**：API调用次数和响应时间
- **错误日志**：应用运行错误统计
- **数据库监控**：慢查询和连接数

### 2. 日志管理

- **应用日志**：云函数运行日志
- **数据库日志**：数据操作审计日志
- **访问日志**：API访问日志

### 3. 备份恢复

- **自动备份**：每日自动备份
- **手动备份**：按需创建备份
- **数据恢复**：一键恢复到指定时间点

## 故障排除

### 连接失败

1. 检查API密钥是否正确
2. 验证环境ID是否正确
3. 确认网络连通性
4. 查看CloudBase环境状态

### 权限错误

1. 检查API密钥权限
2. 验证数据库安全规则
3. 确认环境状态正常

### 数据操作失败

1. 检查集合是否存在
2. 验证数据格式
3. 查看错误日志详情
4. 确认网络连接稳定

## 生产环境部署

### 1. 环境隔离

- 开发环境：`dev-xxxxx`
- 测试环境：`test-xxxxx`
- 生产环境：`prod-xxxxx`

### 2. 配置优化

```env
# 生产环境配置
NODE_ENV=production
DATABASE_PROVIDER=cloudbase

# CloudBase生产环境
TENCENT_CLOUD_ENV_ID=prod-xxxxx

# 启用详细日志
DEBUG=cloudbase:*
```

### 3. 性能优化

- 开启CDN加速静态资源
- 配置云函数预热
- 启用数据库索引
- 设置缓存策略

## 认证服务配置

### 用户认证功能

CloudBase提供了完整的用户认证服务，包括：

- **邮箱密码注册登录**
- **第三方登录**（微信、Google等）
- **密码重置**
- **用户资料管理**
- **JWT令牌认证**

### 配置认证服务

**当前配置：** 项目使用腾讯云CloudBase进行用户认证

```env
# 腾讯云CloudBase认证配置
AUTH_PROVIDER=cloudbase
NEXT_PUBLIC_AUTH_PROVIDER=cloudbase

# CloudBase配置（与数据库使用相同配置）
TENCENT_CLOUD_SECRET_ID=your_secret_id
TENCENT_CLOUD_SECRET_KEY=your_secret_key
TENCENT_CLOUD_ENV_ID=your_environment_id
```

**CloudBase认证功能：**

**前端SDK支持：**
- ✅ 邮箱密码注册登录（前端SDK）
- ✅ 密码重置邮件（前端SDK）
- ✅ 用户资料管理（前端SDK）
- ✅ JWT令牌认证（前端SDK）
- ✅ 第三方登录（微信等，前端SDK）

**Node.js管理接口限制：**
- ❌ 不支持直接用户注册（需要前端SDK）
- ❌ 不支持直接用户登录（需要前端SDK）
- ❌ 不支持密码重置邮件（需要前端SDK）
- ❌ 不支持获取当前用户信息（无用户会话上下文）
- ❌ 不支持第三方登录（需要前端SDK）

#### **前端SDK集成步骤**

1. **安装CloudBase Web SDK**：
   ```bash
   npm install @cloudbase/js-sdk
   ```

2. **初始化CloudBase应用**：
   ```javascript
   import cloudbase from '@cloudbase/js-sdk';

   const app = cloudbase.init({
     env: process.env.TENCENT_CLOUD_ENV_ID,
     region: 'ap-shanghai' // 根据实际情况设置地域
   });
   ```

3. **实现用户认证**：
   ```javascript
   const auth = app.auth();

   // 注册
   const signUp = async (email, password) => {
     try {
       const result = await auth.signUpWithEmailAndPassword(email, password);
       console.log('注册成功:', result.user);
       return { success: true, user: result.user };
     } catch (error) {
       console.error('注册失败:', error);
       return { success: false, error: error.message };
     }
   };

   // 登录
   const signIn = async (email, password) => {
     try {
       const result = await auth.signInWithEmailAndPassword(email, password);
       console.log('登录成功:', result.user);
       return { success: true, user: result.user };
     } catch (error) {
       console.error('登录失败:', error);
       return { success: false, error: error.message };
     }
   };

   // 监听认证状态
   auth.onAuthStateChanged((user) => {
     if (user) {
       console.log('用户已登录:', user.email);
       // 更新应用状态
     } else {
       console.log('用户未登录');
       // 清除应用状态
     }
   });
   ```

4. **密码重置**：
   ```javascript
   const resetPassword = async (email) => {
     try {
       await auth.sendPasswordResetEmail(email);
       console.log('密码重置邮件已发送');
       return { success: true };
     } catch (error) {
       console.error('密码重置失败:', error);
       return { success: false, error: error.message };
     }
   };
   ```

5. **第三方登录（微信）**：
   ```javascript
   const signInWithWechat = async () => {
     try {
       // 需要先在CloudBase控制台配置微信登录
       const result = await auth.signInWithWeixin();
       console.log('微信登录成功:', result.user);
       return { success: true, user: result.user };
     } catch (error) {
       console.error('微信登录失败:', error);
       return { success: false, error: error.message };
     }
   };
   ```


### CloudBase认证服务配置

1. **启用认证服务**：
   - 在CloudBase控制台进入"用户管理" → "登录设置"
   - 启用邮箱登录
   - 可选：配置第三方登录（微信等）

3. **测试认证功能**：
   ```bash
   npm run auth:test-cloudbase
   ```

### 第三方登录配置

#### 微信登录
1. 访问 [微信开放平台](https://open.weixin.qq.com/)
2. 创建应用，获取AppID和AppSecret
3. 在CloudBase控制台配置微信登录参数

### 认证流程

1. **注册**：用户提供邮箱和密码，CloudBase发送验证邮件
2. **登录**：验证邮箱和密码，返回JWT令牌
3. **令牌验证**：API路由通过中间件验证JWT令牌
4. **用户资料**：支持更新用户名、头像等信息

### 安全特性

- **JWT令牌**：安全的身份验证机制
- **密码加密**：服务端安全存储密码
- **会话管理**：自动处理令牌过期
- **权限控制**：基于角色的访问控制

## 总结

CloudBase提供了开箱即用的云开发环境，包括数据库和用户认证服务，让开发者可以专注于业务逻辑而非基础设施管理。通过简单的配置，您就可以将用户认证和支付数据安全地存储在腾讯云CloudBase中，享受高可用、高性能的云服务。
