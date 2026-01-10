-- ============================================================================
-- 修复 Supabase conversations 表结构
-- 添加缺失的列
-- ============================================================================

-- 1. 添加 type 列 (如果不存在)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'generation';

-- 2. 添加 prompt 列 (如果不存在)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS prompt TEXT;

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversations_type
ON conversations(type);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
ON conversations(user_id, updated_at DESC);

-- 4. 验证表结构
SELECT
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
    AND column_name IN ('type', 'prompt')
ORDER BY column_name;

-- 查看结果应该显示:
-- table_name    | column_name | data_type | column_default | is_nullable
-- conversations | prompt      | text      | null           | YES
-- conversations | type        | text      | generation     | YES
