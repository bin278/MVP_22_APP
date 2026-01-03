# 创建 user_credit_packages 表

## 方法一: 通过API路由创建(推荐)

1. 确保Next.js开发服务器正在运行:
   ```bash
   npm run dev
   ```

2. 在浏览器中访问以下URL(或在终端使用curl):
   ```bash
   curl -X GET "http://localhost:3000/api/setup-db/credit-packages" \
        -H "Authorization: Bearer YOUR_TOKEN"
   ```

   或者使用任何HTTP客户端工具发送请求。

3. 如果成功,你会看到:
   ```json
   {
     "success": true,
     "message": "Collection user_credit_packages created successfully",
     "created": true
   }
   ```

## 方法二: 在腾讯云控制台手动创建

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)

2. 进入 **CloudBase** 控制台

3. 选择你的环境 (envId: `cloud1-3gn61ziydcfe6a57`)

4. 点击左侧菜单的 **"数据库"**

5. 点击 **"添加集合"**

6. 输入集合名称: `user_credit_packages`

7. 设置权限规则:
   - 创建权限: `所有用户可读,仅创建者可写`
   - 读取权限: `所有用户可读`
   - 更新权限: `仅创建者可更新`
   - 删除权限: `仅创建者可删除`

8. 点击 **"确定"** 完成创建

## 集合结构说明

`user_credit_packages` 集合用于存储用户购买的加油包(额外次数):

```typescript
{
  _id: string,              // 文档ID(自动生成)
  user_id: string,          // 用户ID
  package_type: string,     // 加油包类型: "basic" | "standard" | "premium"
  status: string,           // 状态: "active" | "expired" | "used"
  credits_total: number,    // 总次数
  credits_remaining: number, // 剩余次数
  credits_used: number,     // 已使用次数
  expiry_date: string,      // 过期时间(ISO 8601格式)
  created_at: string,       // 创建时间
  updated_at: string,       // 更新时间
  purchase_info?: {          // 购买信息(可选)
    payment_id: string,     // 支付记录ID
    amount: number,          // 支付金额
    currency: string        // 货币
  }
}
```

## 验证集合创建成功

创建集合后,错误消息应该会消失。你可以:

1. 检查应用日志,确认没有 `DATABASE_COLLECTION_NOT_EXIST` 错误

2. 在CloudBase控制台的数据库页面查看新创建的集合

3. 测试购买加油包功能(如果已实现)

## 故障排除

### 错误: "未授权"
- 确保在请求中包含正确的 Authorization header
- 对于测试,可以使用任何字符串作为token

### 错误: "CloudBase initialization failed"
- 检查 `.env.local` 文件中的环境变量是否正确
- 确认 `TENCENT_CLOUD_SECRET_ID`, `TENCENT_CLOUD_SECRET_KEY`, `TENCENT_CLOUD_ENV_ID` 都已设置

### 错误: "集合已存在"
- 这是正常的,说明集合已经被创建
- 不需要重复创建

## 相关文件

- API路由: `app/api/setup-db/credit-packages/route.ts`
- 使用代码: `lib/subscription/usage-tracker.ts`
- 数据库适配器: `lib/database/cloudbase.ts`
