# CloudBase文档数据库迁移指南

## 🎯 迁移概览

您的项目正在使用腾讯云CloudBase文档型数据库。本指南将帮助您完成从Supabase到CloudBase数据库的迁移。

## 📋 当前状态

### ✅ 已完成
- ✅ CloudBase数据库连接配置
- ✅ 支付服务数据库操作迁移（支付宝、微信）
- ✅ 环境变量配置

### 🔄 待迁移
- 🔄 对话记录API
- 🔄 用户订阅API
- 🔄 GitHub集成API
- 🔄 其他业务API

## 🗄️ CloudBase vs Supabase 数据结构对比

### 集合（Collection） vs 表（Table）
```javascript
// Supabase (表)
supabaseAdmin.from('payments').insert({...})

// CloudBase (集合)
await add('payments', {...})
```

### 文档结构
```javascript
// Supabase
{
  id: 'uuid',
  created_at: 'timestamp',
  updated_at: 'timestamp',
  // 其他字段...
}

// CloudBase
{
  _id: 'auto-generated', // 系统自动生成
  created_at: 'timestamp',
  updated_at: 'timestamp',
  // 其他字段...
}
```

## 🔧 迁移步骤

### 步骤1：创建CloudBase集合

在CloudBase控制台创建以下集合：

1. **payments** - 支付记录
   ```json
   {
     "user_id": "string",
     "amount": "number",
     "currency": "string",
     "status": "string",
     "payment_method": "string",
     "transaction_id": "string",
     "metadata": "object",
     "created_at": "date",
     "updated_at": "date"
   }
   ```

2. **conversations** - 对话记录
   ```json
   {
     "user_id": "string",
     "title": "string",
     "messages": "array",
     "created_at": "date",
     "updated_at": "date"
   }
   ```

3. **user_subscriptions** - 用户订阅
   ```json
   {
     "user_id": "string",
     "plan_type": "string",
     "status": "string",
     "start_date": "date",
     "end_date": "date",
     "created_at": "date",
     "updated_at": "date"
   }
   ```

### 步骤2：更新API路由

#### 对话API更新示例

```typescript
// lib/conversations.ts - 原Supabase版本
import { supabaseAdmin } from '@/lib/database';

export async function createConversation(userId: string, title: string) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      user_id: userId,
      title: title,
    })
    .select()
    .single();

  return { data, error };
}

// lib/conversations.ts - CloudBase版本
import { add, query } from '@/lib/database/cloudbase';

export async function createConversation(userId: string, title: string) {
  try {
    const result = await add('conversations', {
      user_id: userId,
      title: title,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return {
      data: {
        id: result.id,
        user_id: userId,
        title: title,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error
    };
  }
}
```

#### 查询操作示例

```typescript
// Supabase查询
const { data, error } = await supabaseAdmin
  .from('conversations')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// CloudBase查询
const result = await query('conversations', {
  where: { user_id: userId },
  orderBy: 'created_at',
  orderDirection: 'desc'
});
```

#### 更新操作示例

```typescript
// Supabase更新
const { data, error } = await supabaseAdmin
  .from('conversations')
  .update({ title: newTitle })
  .eq('id', conversationId);

// CloudBase更新
// 先查询获取文档ID
const queryResult = await query('conversations', {
  where: { id: conversationId },
  limit: 1
});

if (queryResult.data.length > 0) {
  const docId = queryResult.data[0]._id;
  await update('conversations', docId, {
    title: newTitle,
    updated_at: new Date().toISOString()
  });
}
```

### 步骤3：更新所有API路由

需要更新的API文件：

#### 对话相关API
- `app/api/conversations/create/route.ts`
- `app/api/conversations/list/route.ts`
- `app/api/conversations/[id]/route.ts`
- `app/api/conversations/[id]/messages/route.ts`
- `app/api/conversations/[id]/files/route.ts`

#### 用户相关API
- `app/api/user/subscription/route.ts`
- `app/api/user/set-subscription/route.ts`

#### 支付相关API
- `app/api/payment/history/route.ts` ✅ (已更新)

#### GitHub相关API
- `app/api/github/push/route.ts`
- `app/api/github/unbind/route.ts`
- `app/api/github/callback/route.ts`
- `app/api/github/status/route.ts`

### 步骤4：数据迁移

如果您有现有的Supabase数据需要迁移：

1. **导出Supabase数据**
   ```javascript
   // 从Supabase导出数据
   const { data: conversations } = await supabaseAdmin
     .from('conversations')
     .select('*');
   ```

2. **导入到CloudBase**
   ```javascript
   // 导入到CloudBase
   for (const conversation of conversations) {
     await add('conversations', {
       ...conversation,
       _id: undefined, // 移除原有的id字段
       created_at: conversation.created_at,
       updated_at: conversation.updated_at,
     });
   }
   ```

## 🔄 API映射对照表

| Supabase操作 | CloudBase操作 | 说明 |
|-------------|---------------|------|
| `.from('table')` | `collection('table')` | 选择集合 |
| `.select()` | `query(collection)` | 查询数据 |
| `.insert(data)` | `add(collection, data)` | 插入数据 |
| `.update(data)` | `update(collection, id, data)` | 更新数据 |
| `.delete()` | `remove(collection, id)` | 删除数据 |
| `.eq('field', value)` | `{ where: { field: value } }` | 相等条件 |
| `.order('field', { ascending: false })` | `{ orderBy: 'field', orderDirection: 'desc' }` | 排序 |

## 🐛 常见问题

### 问题1：找不到文档
**原因**: CloudBase使用 `_id` 而不是 `id`
**解决**: 查询时使用 `_id` 字段

### 问题2：更新操作复杂
**原因**: CloudBase需要先查询获取文档ID
**解决**: 实现辅助函数简化更新操作

### 问题3：数据结构不一致
**原因**: CloudBase没有自增ID
**解决**: 使用 `_id` 作为唯一标识符

## 📋 迁移检查清单

- ✅ 创建所有必需的集合
- ✅ 更新所有API路由
- ✅ 测试CRUD操作
- ✅ 迁移现有数据
- ✅ 更新前端代码
- ✅ 测试完整功能

## 🚀 性能优化建议

### 索引优化
在CloudBase控制台为常用查询字段创建索引：
- `user_id` - 用户相关查询
- `created_at` - 时间排序查询
- `status` - 状态过滤查询

### 查询优化
- 使用合适的 `limit` 限制返回数据量
- 为大数据集实现分页查询
- 合理使用复合查询条件

## 📞 技术支持

如果在迁移过程中遇到问题：

1. **查看CloudBase控制台日志**
2. **检查API返回的错误信息**
3. **参考CloudBase官方文档**
4. **联系技术支持**

---

**迁移完成标志**: 所有API都能正常工作，前端功能完整可用。
