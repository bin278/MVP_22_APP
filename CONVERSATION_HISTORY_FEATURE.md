# 对话历史功能说明

## 功能概述

在 generate 页面添加了可隐藏的侧边栏，包含历史对话窗口，支持新建对话和切换对话。所有历史对话和生成的文件都会保存到数据库中，并按用户隔离。

## 数据库结构

### 表结构

1. **conversations** - 对话表
   - `id` (UUID) - 主键
   - `user_id` (UUID) - 用户ID，外键关联 auth.users
   - `title` (VARCHAR) - 对话标题
   - `created_at` (TIMESTAMP) - 创建时间
   - `updated_at` (TIMESTAMP) - 更新时间

2. **conversation_messages** - 对话消息表
   - `id` (UUID) - 主键
   - `conversation_id` (UUID) - 对话ID，外键关联 conversations
   - `role` (VARCHAR) - 消息角色：'user' 或 'assistant'
   - `content` (TEXT) - 消息内容
   - `created_at` (TIMESTAMP) - 创建时间

3. **conversation_files** - 生成的文件表
   - `id` (UUID) - 主键
   - `conversation_id` (UUID) - 对话ID，外键关联 conversations
   - `file_path` (VARCHAR) - 文件路径
   - `file_content` (TEXT) - 文件内容
   - `created_at` (TIMESTAMP) - 创建时间
   - `updated_at` (TIMESTAMP) - 更新时间
   - UNIQUE(conversation_id, file_path) - 唯一约束

### 安全策略

所有表都启用了 Row Level Security (RLS)，确保：
- 用户只能访问自己的对话
- 用户只能访问自己对话的消息和文件
- 所有操作都通过 RLS 策略进行验证

## 安装步骤

### 1. 创建数据库表

在 Supabase SQL Editor 中执行 `supabase-conversations-schema.sql` 文件中的 SQL 语句：

```sql
-- 创建表、索引、RLS 策略和触发器
```

### 2. 验证表创建

确认以下表已创建：
- `public.conversations`
- `public.conversation_messages`
- `public.conversation_files`

## 功能特性

### 侧边栏功能

1. **显示对话列表**
   - 按更新时间倒序显示所有对话
   - 显示对话标题和最后更新时间
   - 支持相对时间显示（刚刚、X分钟前、X小时前、X天前）

2. **新建对话**
   - 点击"新建对话"按钮创建新对话
   - 新对话标题默认为用户输入的前50个字符，或"新建对话"

3. **切换对话**
   - 点击对话列表中的任意对话加载该对话
   - 加载时会恢复：
     - 所有消息历史
     - 所有生成的文件
     - 当前选中的文件

4. **删除对话**
   - 鼠标悬停在对话项上显示删除按钮
   - 点击删除按钮会弹出确认对话框
   - 删除对话会级联删除所有相关的消息和文件

### 自动保存功能

1. **消息自动保存**
   - 用户输入的消息自动保存
   - AI 回复的消息自动保存
   - 错误消息也会保存

2. **文件自动保存**
   - 生成代码时自动保存所有文件
   - 修改代码时自动更新文件内容
   - 文件以 `file_path` 和 `file_content` 的形式存储

3. **对话标题更新**
   - 创建对话时使用用户输入的前50个字符作为标题
   - 每次更新对话时自动更新 `updated_at` 字段

## API 路由

### `/api/conversations/create` (POST)
创建新对话

**请求体：**
```json
{
  "title": "对话标题"
}
```

**响应：**
```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "对话标题",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### `/api/conversations/list` (GET)
获取当前用户的所有对话列表

**响应：**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "uuid",
      "title": "对话标题",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

### `/api/conversations/[id]` (GET)
获取对话详情（包括消息和文件）

**响应：**
```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "title": "对话标题",
    ...
  },
  "messages": [...],
  "files": [...]
}
```

### `/api/conversations/[id]` (DELETE)
删除对话

### `/api/conversations/[id]` (PUT)
更新对话标题

**请求体：**
```json
{
  "title": "新标题"
}
```

### `/api/conversations/[id]/messages` (POST)
添加消息到对话

**请求体：**
```json
{
  "role": "user" | "assistant",
  "content": "消息内容"
}
```

### `/api/conversations/[id]/files` (POST)
保存文件到对话

**请求体：**
```json
{
  "files": [
    {
      "file_path": "src/App.tsx",
      "file_content": "文件内容"
    }
  ]
}
```

## 使用说明

### 开始新对话

1. 点击侧边栏中的"新建对话"按钮
2. 或者直接开始输入提示词，系统会自动创建新对话

### 切换对话

1. 在侧边栏中点击要切换的对话
2. 系统会自动加载该对话的所有消息和文件

### 删除对话

1. 将鼠标悬停在对话项上
2. 点击右侧出现的删除图标
3. 在确认对话框中确认删除

### 侧边栏控制

- 点击侧边栏触发器按钮（左上角）可以显示/隐藏侧边栏
- 使用快捷键 `Ctrl/Cmd + B` 也可以切换侧边栏显示状态

## 注意事项

1. **用户认证**
   - 所有功能都需要用户登录
   - 未登录用户无法使用对话历史功能

2. **数据隔离**
   - 每个用户只能看到自己的对话
   - 通过 RLS 策略确保数据安全

3. **性能考虑**
   - 对话列表按更新时间倒序排列
   - 文件内容以文本形式存储，注意大文件的性能影响

4. **错误处理**
   - 如果保存失败，会在控制台输出错误信息
   - 不会影响用户的主要操作流程

## 文件清单

- `supabase-conversations-schema.sql` - 数据库表结构
- `components/conversation-sidebar.tsx` - 对话侧边栏组件
- `app/api/conversations/create/route.ts` - 创建对话 API
- `app/api/conversations/list/route.ts` - 获取对话列表 API
- `app/api/conversations/[id]/route.ts` - 对话 CRUD API
- `app/api/conversations/[id]/messages/route.ts` - 消息管理 API
- `app/api/conversations/[id]/files/route.ts` - 文件管理 API
- `app/generate/page.tsx` - 修改后的生成页面（集成侧边栏）

## 后续优化建议

1. 添加对话搜索功能
2. 支持对话重命名
3. 添加对话导出功能
4. 优化大文件的存储和加载性能
5. 添加对话分类/标签功能
6. 支持对话分享（可选）

















