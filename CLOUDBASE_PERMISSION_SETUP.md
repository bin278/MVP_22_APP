# CloudBase 数据库权限设置指南

## 问题背景

当您看到 `you can't request without auth` 或 `Db or Table not exist` 错误时，表示CloudBase数据库需要认证才能访问。在CloudBase中，数据库权限通过控制台进行设置，而不是通过代码。

## 解决方案

### 1. 登录CloudBase控制台

访问 [CloudBase控制台](https://console.cloud.tencent.com/tcb)，选择您的环境。

### 2. 创建数据库集合

首先需要创建所需的集合：

1. 在左侧菜单中点击 **数据库**
2. 点击 **创建集合**
3. 创建以下集合：
   - `users` - 用户信息
   - `payments` - 支付记录
   - `conversations` - 对话记录
   - `conversation_files` - 生成的文件
   - `conversation_messages` - 对话消息

### 3. 设置数据库权限

1. 在左侧菜单中点击 **数据库**
2. 选择 **权限设置**
3. 为每个集合设置以下权限：

#### 读取权限 (read)
```json
{
  "read": true
}
```

#### 写入权限 (write)
```json
{
  "write": true
}
```

### 4. 生产环境安全建议

在生产环境中，应该设置更严格的权限规则：

#### 读取权限 (推荐生产环境)
```json
{
  "read": "auth != null"
}
```

#### 写入权限 (推荐生产环境)
```json
{
  "write": "auth != null"
}
```

这将确保只有通过CloudBase认证的用户才能访问数据库。

## 权限说明

- **当前设置**: 允许所有访问（包括未认证用户）
- **生产建议**: 只允许认证用户访问
- **安全考虑**: 后端API通过CloudBase Node.js SDK访问，具有管理员权限

## 测试权限设置

设置完成后，可以运行以下命令测试数据库连接：

```bash
node scripts/test-cloudbase-db.js
```

如果权限设置正确，应该能够成功连接数据库。

## 故障排除

如果仍然遇到权限错误：

1. 检查环境变量是否正确设置：
   ```bash
   # 确保以下环境变量已设置
   TENCENT_CLOUD_ENV_ID=your_env_id
   TENCENT_CLOUD_SECRET_ID=your_secret_id
   TENCENT_CLOUD_SECRET_KEY=your_secret_key
   ```

2. 确认CloudBase环境ID正确
3. 验证权限规则已保存
4. 检查CloudBase控制台是否有错误提示
5. 确保集合已创建

## 手动创建集合的步骤

如果自动创建失败，请手动创建集合：

### 📋 详细步骤：

1. **访问CloudBase控制台**
   - 打开浏览器访问：https://console.cloud.tencent.com/tcb
   - 登录腾讯云账号

2. **选择环境**
   - 在控制台首页选择你的CloudBase环境
   - 如果没有环境，需要先创建一个

3. **进入数据库页面**
   - 点击左侧菜单的 **"数据库"**

4. **创建集合**
   - 点击 **"创建集合"** 按钮
   - 依次创建以下集合：
     - `users` - 用户信息
     - `payments` - 支付记录
     - `conversations` - 对话记录
     - `conversation_files` - 生成的文件
     - `conversation_messages` - 对话消息

5. **设置权限**
   - 对每个集合，点击右侧的 **"权限设置"**
   - 设置 **读取权限** 为 `true`
   - 设置 **写入权限** 为 `true`
   - 保存设置

### 🔧 权限设置示例

对于每个集合，权限设置应该如下：

```json
{
  "read": true,
  "write": true
}
```

### ✅ 验证设置

创建集合并设置权限后，运行测试：

```bash
node scripts/test-cloudbase-auth.js
```

如果所有测试都通过，说明设置正确！

## 相关文件

- `lib/database/cloudbase.ts` - CloudBase数据库连接
- `app/api/conversations/create/route.ts` - 对话创建API
- `app/api/conversations/list/route.ts` - 对话列表API
- `scripts/setup-cloudbase-collections.js` - 集合设置脚本
