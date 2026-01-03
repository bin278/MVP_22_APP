# CloudBase快速配置指南

## 🚨 当前问题
从错误日志可以看出，CloudBase认证失败的原因是**环境变量未正确配置**：
- 错误信息：`credentials not found`
- 警告信息：`every cloudbase instance should has only one auth object`

## ✅ 解决方案

### 步骤1：获取CloudBase配置信息

1. **访问CloudBase控制台**
   ```
   https://console.cloud.tencent.com/tcb
   ```

2. **创建或选择环境**
   - 如果没有环境，点击"新建环境"
   - 选择合适的地域（如上海）

3. **获取环境ID**
   - 在环境概览页面找到"环境ID"
   - 复制环境ID（如：`your-env-xxxxx`）

4. **获取访问密钥**
   - 点击左侧"访问密钥"
   - 创建新的密钥对
   - 复制 `SecretId` 和 `SecretKey`

### 步骤2：配置环境变量

1. **复制配置文件**
   ```bash
   cp CLOUDBASE_ENV_EXAMPLE.env .env.local
   ```

2. **编辑 .env.local 文件**
   ```env
   # 必需：CloudBase环境ID
   NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=your-actual-env-id-here

   # 可选：后端API使用的密钥（如果需要数据库操作）
   TENCENT_CLOUD_SECRET_ID=your-secret-id-here
   TENCENT_CLOUD_SECRET_KEY=your-secret-key-here

   # 认证和数据库提供商
   AUTH_PROVIDER=cloudbase
   DATABASE_PROVIDER=cloudbase
   ```

### 步骤3：启用CloudBase认证服务

1. **进入用户管理**
   - 在CloudBase控制台点击"用户管理"

2. **配置登录设置**
   - 点击"登录设置"
   - 启用"邮箱登录"

3. **可选：配置第三方登录**
   - 可以启用微信、QQ等第三方登录

### 步骤4：测试配置

1. **重启开发服务器**
   ```bash
   npm run dev
   ```

2. **检查控制台日志**
   - 应该看到："CloudBase前端SDK初始化成功"
   - 不应该再有 "credentials not found" 错误

3. **测试注册功能**
   - 访问 `/register` 页面
   - 尝试注册新用户
   - 应该能成功注册或显示具体的错误信息

## 🔍 验证配置是否正确

运行以下命令检查配置：
```bash
node -e "
console.log('环境变量检查:');
console.log('NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID:', process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID ? '✅ 已配置' : '❌ 未配置');
console.log('AUTH_PROVIDER:', process.env.AUTH_PROVIDER === 'cloudbase' ? '✅ cloudbase' : '❌ 不是cloudbase');
"
```

## 🎯 常见错误及解决方案

### 错误：`credentials not found`
**原因**：环境ID未配置或不正确
**解决**：检查 `NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID` 是否正确

### 错误：`INVALID_OPERATION: every cloudbase instance should has only one auth object`
**原因**：CloudBase实例被多次初始化
**解决**：这是警告，不影响功能；已修复代码避免多次初始化

### 错误：注册失败但没有具体错误信息
**原因**：CloudBase控制台未启用邮箱登录
**解决**：在CloudBase控制台启用邮箱登录功能

### 错误：网络连接失败
**原因**：防火墙或网络问题
**解决**：检查网络连接，确保能访问腾讯云服务

## 📞 获取帮助

如果仍然遇到问题：

1. **检查控制台日志** - 详细的错误信息
2. **验证环境变量** - 确保格式正确
3. **检查CloudBase控制台** - 确认服务状态
4. **参考官方文档** - https://docs.cloudbase.net/

## ✅ 配置成功标志

配置成功后，你应该看到：
- ✅ 控制台：`CloudBase前端SDK初始化成功`
- ✅ 注册页面：可以正常注册或显示具体的错误信息
- ✅ 不再出现 `credentials not found` 错误




