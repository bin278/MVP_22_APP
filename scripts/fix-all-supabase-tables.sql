-- ============================================================================
-- Supabase 数据库表结构完整修复脚本
-- 国际版代码生成所需的所有表结构
-- ============================================================================

-- ============================================================================
-- 1. 修复 conversations 表
-- ============================================================================

-- 添加 type 列 (如果不存在)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'generation';

-- 添加 prompt 列 (如果不存在)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS prompt TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_conversations_type
ON conversations(type);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
ON conversations(user_id, updated_at DESC);


-- ============================================================================
-- 2. 修复 conversation_messages 表
-- ============================================================================

-- 添加 user_id 列 (如果不存在)
ALTER TABLE conversation_messages
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id
ON conversation_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_conversation
ON conversation_messages(user_id, conversation_id);


-- ============================================================================
-- 3. 修复 conversation_files 表
-- ============================================================================

-- 添加 user_id 列 (如果不存在)
ALTER TABLE conversation_files
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_conversation_files_user_id
ON conversation_files(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_files_user_conversation
ON conversation_files(user_id, conversation_id);


-- ============================================================================
-- 4. 修复 recommendation_usage 表
-- ============================================================================

-- 添加 metadata 列 (如果不存在)
ALTER TABLE recommendation_usage
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 添加 usage_date 列 (如果不存在)
ALTER TABLE recommendation_usage
ADD COLUMN IF NOT EXISTS usage_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();


-- ============================================================================
-- 5. 验证表结构
-- ============================================================================

-- 验证 conversations 表
SELECT
    'conversations' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
    AND column_name IN ('type', 'prompt')
UNION ALL

-- 验证 conversation_messages 表
SELECT
    'conversation_messages' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'conversation_messages'
    AND column_name = 'user_id'
UNION ALL

-- 验证 conversation_files 表
SELECT
    'conversation_files' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'conversation_files'
    AND column_name = 'user_id'
UNION ALL

-- 验证 recommendation_usage 表
SELECT
    'recommendation_usage' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'recommendation_usage'
    AND column_name IN ('metadata', 'usage_date')

ORDER BY table_name, column_name;

-- 预期结果:
-- table_name              | column_name | data_type | column_default        | is_nullable
-- conversation_files      | user_id     | uuid      | null                  | YES
-- conversation_messages   | user_id     | uuid      | null                  | YES
-- conversations           | prompt      | text      | null                  | YES
-- conversations           | type        | text      | generation            | YES
-- recommendation_usage    | metadata    | jsonb     | {}                    | YES
-- recommendation_usage    | usage_date  | timetz... | NOW()                 | YES
