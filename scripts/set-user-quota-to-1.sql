-- ============================================================================
-- 临时测试：将用户 16759c96-dd3a-4b14-a952-77bf5b798236 的免费次数改为1次
-- ============================================================================

-- 注意：由于免费计划的限额是在代码中定义的（PLAN_FEATURES）
-- 我们通过添加一个已使用的记录来"占用"29次，使剩余次数变成1次

-- 1. 先查询当前已使用次数
DO $$
DECLARE
    current_usage INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_usage
    FROM public.recommendation_usage
    WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236'
    AND created_at >= DATE_TRUNC('month', NOW());

    RAISE NOTICE '当前已使用次数: %', current_usage;

    -- 如果已使用次数少于29，插入29条历史记录（时间戳设为过去，避免影响本月）
    IF current_usage < 29 THEN
        INSERT INTO public.recommendation_usage (user_id, metadata, created_at)
        SELECT
            '16759c96-dd3a-4b14-a952-77bf5b798236',
            '{"test": "quota_adjustment", "note": "为测试将限额调整为1次"}'::jsonb,
            NOW() - INTERVAL '1 month'
        FROM generate_series(1, 29 - current_usage);

        RAISE NOTICE '✅ 已插入 % 条测试记录，使剩余次数变为1', 29 - current_usage;
    ELSE
        RAISE NOTICE 'ℹ️  已使用次数已超过或等于29，无需调整';
    END IF;
END $$;

-- 2. 验证结果
SELECT
    '📊 用户使用情况' as info,
    plan_type,
    status
FROM public.user_subscriptions
WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236';

SELECT
    COUNT(*) as total_usage_records,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) as this_month_usage
FROM public.recommendation_usage
WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236';

SELECT '✅ 该用户现在有1次免费额度（30 - 29 = 1）' as message;
SELECT '⚠️  测试完成后记得清理这些测试记录' as warning;
