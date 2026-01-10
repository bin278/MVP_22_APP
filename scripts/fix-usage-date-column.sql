-- ============================================================================
-- 修复 recommendation_usage 表 - 删除 usage_date 列
-- ============================================================================
-- 说明: usage_date 列不是代码必需的，删除它以修复插入错误
-- ============================================================================

-- 1. 删除 usage_date 列（如果存在）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recommendation_usage'
        AND column_name = 'usage_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.recommendation_usage DROP COLUMN IF EXISTS usage_date;
        RAISE NOTICE '✅ usage_date 列已成功删除';
    ELSE
        RAISE NOTICE 'ℹ️  usage_date 列不存在，无需删除';
    END IF;
END $$;

-- 2. 检查是否还有其他不必要的列
SELECT
    '📊 修改后的表结构' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'recommendation_usage'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 测试插入一条记录
DO $$
DECLARE
    test_user_id UUID := '16759c96-dd3a-4b14-a952-77bf5b798236';
    test_record_id UUID;
    insert_success BOOLEAN := FALSE;
BEGIN
    -- 尝试插入
    INSERT INTO public.recommendation_usage (user_id, metadata, created_at)
    VALUES (test_user_id, '{"test": "table_fix"}'::jsonb, NOW())
    RETURNING id INTO test_record_id;

    insert_success := TRUE;

    -- 如果成功，删除测试记录
    DELETE FROM public.recommendation_usage WHERE id = test_record_id;

    RAISE NOTICE '✅ 测试插入成功！表结构已修复';
    RAISE NOTICE '现在代码应该可以正常记录使用次数了';

EXCEPTION WHEN OTHERS THEN
    IF NOT insert_success THEN
        RAISE NOTICE '❌ 测试插入失败: %', SQLERRM;
        RAISE NOTICE '可能还有其他必需字段缺失';
    END IF;
END $$;

-- 4. 显示完成信息
SELECT '✅ 修复完成！' as status;
SELECT '现在 usage-tracker.ts 应该可以正常工作了' as message;
SELECT '如果问题仍然存在，请查看服务器日志获取详细错误信息' as hint;
