-- ============================================================================
-- 修复 Supabase recommendation_usage 表结构
-- 添加缺失的 metadata 列
-- ============================================================================

-- 为 recommendation_usage 表添加 metadata 列
ALTER TABLE recommendation_usage
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 验证表结构
SELECT
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'recommendation_usage'
    AND column_name = 'metadata';

-- 查看结果应该显示:
-- table_name              | column_name | data_type | column_default
-- recommendation_usage   | metadata    | jsonb     | {}
