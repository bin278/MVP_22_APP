-- ============================================================================
-- 检查并修复 recommendation_usage 表结构
-- ============================================================================

-- 1. 查看当前表结构
SELECT
    'recommendation_usage' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'recommendation_usage'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 查看当前表的所有索引
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'recommendation_usage'
  AND schemaname = 'public'
ORDER BY indexname;

-- 3. 如果存在 usage_date 列且是 NOT NULL，我们可以：
--    a) 删除 usage_date 列（如果不需要）
--    b) 或者修改代码以包含 usage_date

-- 选项 A: 删除 usage_date 列（推荐，因为代码没有使用它）
-- 取消下面的注释来执行删除操作
/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recommendation_usage'
        AND column_name = 'usage_date'
    ) THEN
        ALTER TABLE public.recommendation_usage DROP COLUMN IF EXISTS usage_date;
        RAISE NOTICE 'usage_date 列已删除';
    ELSE
        RAISE NOTICE 'usage_date 列不存在';
    END IF;
END $$;
*/

-- 选项 B: 如果你想保留 usage_date 列，可以设置默认值
-- 取消下面的注释来执行添加默认值操作
/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recommendation_usage'
        AND column_name = 'usage_date'
    ) THEN
        ALTER TABLE public.recommendation_usage
        ALTER COLUMN usage_date SET DEFAULT CURRENT_DATE;

        ALTER TABLE public.recommendation_usage
        ALTER COLUMN usage_date DROP NOT NULL;

        RAISE NOTICE 'usage_date 列已设置为可选';
    ELSE
        RAISE NOTICE 'usage_date 列不存在';
    END IF;
END $$;
*/

-- 4. 验证修改后的表结构
SELECT
    '修改后的表结构' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'recommendation_usage'
  AND table_schema = 'public'
ORDER BY ordinal_position;
