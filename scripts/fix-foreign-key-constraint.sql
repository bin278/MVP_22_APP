-- ============================================================================
-- 修复 recommendation_usage 表的外键约束
-- ============================================================================
-- 问题: user_id 的外键指向了错误的 public.users 表
-- 解决: 删除旧的外键约束，创建指向 auth.users 的新约束
-- ============================================================================

-- 1. 查看当前的外键约束
SELECT
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'recommendation_usage'
  AND n.nspname = 'public'
  AND c.contype = 'f';

-- 2. 删除旧的外键约束（如果存在）
DO $$
BEGIN
    -- 查找并删除所有指向 public.users 的外键约束
    IF EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE cl.relname = 'recommendation_usage'
        AND c.contype = 'f'
    ) THEN
        -- 删除所有 user_id 的外键约束
        ALTER TABLE public.recommendation_usage
        DROP CONSTRAINT IF EXISTS recommendation_usage_user_id_fkey;

        RAISE NOTICE '✅ 已删除旧的外键约束';
    ELSE
        RAISE NOTICE 'ℹ️  没有找到需要删除的外键约束';
    END IF;
END $$;

-- 3. 创建正确的外键约束，指向 auth.users
ALTER TABLE public.recommendation_usage
ADD CONSTRAINT recommendation_usage_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 4. 验证新的外键约束
SELECT
    '📊 新的外键约束' as info,
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'recommendation_usage'
  AND n.nspname = 'public'
  AND c.contype = 'f'
  AND c.conname = 'recommendation_usage_user_id_fkey';

-- 5. 测试插入一条记录
DO $$
DECLARE
    test_user_id UUID := '16759c96-dd3a-4b14-a952-77bf5b798236';
    test_record_id UUID;
    insert_success BOOLEAN := FALSE;
BEGIN
    -- 尝试插入
    INSERT INTO public.recommendation_usage (user_id, metadata, created_at)
    VALUES (test_user_id, '{"test": "foreign_key_fix"}'::jsonb, NOW())
    RETURNING id INTO test_record_id;

    insert_success := TRUE;

    -- 如果成功，删除测试记录
    DELETE FROM public.recommendation_usage WHERE id = test_record_id;

    RAISE NOTICE '✅ 测试插入成功！外键约束已修复';
    RAISE NOTICE '现在代码应该可以正常记录使用次数了';

EXCEPTION WHEN OTHERS THEN
    IF NOT insert_success THEN
        RAISE NOTICE '❌ 测试插入失败: %', SQLERRM;
        RAISE NOTICE '可能的原因: 用户ID不存在于 auth.users 表中';
    END IF;
END $$;

-- 6. 显示完成信息
SELECT '✅ 外键约束修复完成！' as status;
SELECT '现在可以正常记录使用次数了' as message;
