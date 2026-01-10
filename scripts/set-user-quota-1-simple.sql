-- ============================================================================
-- 临时测试：将用户 16759c96-dd3a-4b14-a952-77bf5b798236 的限额设为1次
-- ============================================================================

-- 1. 添加28条本月的测试使用记录，使本月使用次数达到30次
DO $$
DECLARE
    current_usage INTEGER;
    records_to_add INTEGER;
BEGIN
    -- 查询本月已使用次数
    SELECT COUNT(*) INTO current_usage
    FROM public.recommendation_usage
    WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236'
    AND created_at >= DATE_TRUNC('month', NOW());

    RAISE NOTICE '当前本月已使用次数: %', current_usage;

    -- 计算还需要添加多少条记录才能达到30次
    records_to_add := 30 - current_usage;

    IF records_to_add > 0 THEN
        -- 插入本月的测试记录
        INSERT INTO public.recommendation_usage (user_id, metadata, created_at)
        SELECT
            '16759c96-dd3a-4b14-a952-77bf5b798236',
            '{"test": "quota_limit_1", "note": "测试限额设为1次"}'::jsonb,
            NOW() - INTERVAL '1 hour' * s
        FROM generate_series(1, records_to_add) AS s;

        RAISE NOTICE '✅ 已插入 % 条本月测试记录', records_to_add;
    ELSE
        RAISE NOTICE 'ℹ️  已使用次数已达到或超过30次';
    END IF;
END $$;

-- 2. 删除上个月的旧测试记录（清理）
DELETE FROM public.recommendation_usage
WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236'
  AND created_at < DATE_TRUNC('month', NOW())
  AND metadata->>'test' = 'quota_adjustment';

-- 3. 验证结果
SELECT '✅ 本月免费额度已用完（30/30）' as message;

SELECT
    '📊 本月使用情况' as type,
    COUNT(*) as used_count,
    CASE
        WHEN COUNT(*) >= 30 THEN '已达上限'
        ELSE '剩余 ' || (30 - COUNT(*))::TEXT || ' 次'
    END as status
FROM public.recommendation_usage
WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236'
  AND created_at >= DATE_TRUNC('month', NOW());

SELECT 'ℹ️  现在该用户本月已无法使用免费额度（0次剩余）' as note;
SELECT '💡 如需给用户1次测试机会，请手动在 Supabase Table Editor 中添加加油包' as hint;
