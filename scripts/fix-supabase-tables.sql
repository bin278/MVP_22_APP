-- ============================================================================
-- 修复 Supabase 数据库表结构
-- 为 conversation_messages 和 conversation_files 表添加 user_id 列
-- ============================================================================

-- 1. 为 conversation_messages 表添加 user_id 列
ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. 为 conversation_files 表添加 user_id 列
ALTER TABLE conversation_files
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id
ON conversation_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_files_user_id
ON conversation_files(user_id);

-- 4. 为 conversation_messages 添加复合索引 (user_id + conversation_id)
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_conversation
ON conversation_messages(user_id, conversation_id);

-- 5. 为 conversation_files 添加复合索引 (user_id + conversation_id)
CREATE INDEX IF NOT EXISTS idx_conversation_files_user_conversation
ON conversation_files(user_id, conversation_id);

-- 6. 如果需要为现有数据设置 user_id,可以运行以下更新(可选)
-- 注意:这需要根据你的实际数据逻辑来调整
-- UPDATE conversation_messages
-- SET user_id = (
--   SELECT c.user_id
--   FROM conversations c
--   WHERE c.id = conversation_messages.conversation_id
-- )
-- WHERE user_id IS NULL;

-- UPDATE conversation_files
-- SET user_id = (
--   SELECT c.user_id
--   FROM conversations c
--   WHERE c.id = conversation_files.conversation_id
-- )
-- WHERE user_id IS NULL;

-- 7. 验证表结构
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('conversation_messages', 'conversation_files')
    AND column_name = 'user_id'
ORDER BY table_name;

-- 查看结果应该显示:
-- table_name              | column_name | data_type | is_nullable
-- conversation_messages   | user_id     | uuid      | YES
-- conversation_files      | user_id     | uuid      | YES
