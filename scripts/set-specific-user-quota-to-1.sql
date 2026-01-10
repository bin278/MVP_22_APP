-- ============================================================================
-- 临时测试：将用户 16759c96-dd3a-4b14-a952-77bf5b798236 的限额设为1次
-- ============================================================================

-- 方案：添加28条使用记录，使已使用次数达到30次，剩余次数为0
-- 然后再给1次加油包，这样用户就有且仅有1次可用

-- 1. 添加28条本月的测试使用记录
DO $$
DECLARE
    current_usage INTEGER;
    records_to_add INTEGER := 28;
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

-- 3. 添加1次加油包，给用户1次使用机会
INSERT INTO public.user_credit_packages (
    user_id,
    package_type,
    package_id,
    credits_total,
    credits_remaining,
    price,
    currency,
    status,
    expiry_date,
    purchase_date
)
VALUES (
    '16759c96-dd3a-4b14-a952-77bf5b798236',
    'basic',
    'test_1_credit_package',
    1,
    1,
    0.00,
    'USD',
    'active',
    NOW() + INTERVAL '7 days',
    NOW()
)
ON CONFLICT (package_id) DO UPDATE SET
    credits_remaining = 1,
    status = 'active',
    expiry_date = NOW() + INTERVAL '7 days';

-- 4. 验证结果
SELECT '📊 最终结果' as info;

-- 订阅信息
SELECT
    '订阅计划' as type,
    plan_type,
    status
FROM public.user_subscriptions
WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236';

-- 本月使用情况
SELECT
    '本月使用' as type,
    COUNT(*) as used_count
FROM public.recommendation_usage
WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236'
  AND created_at >= DATE_TRUNC('month', NOW());

-- 加油包信息
SELECT
    '加油包' as type,
    credits_remaining,
    status,
    expiry_date
FROM public.user_credit_packages
WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236'
  AND package_id = 'test_1_credit_package';

SELECT '✅ 该用户现在只有1次可用额度（来自加油包）' as message;
SELECT '⚠️  本月订阅额度已用完（30/30）' as note;
