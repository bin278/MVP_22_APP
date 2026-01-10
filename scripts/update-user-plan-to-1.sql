-- ============================================================================
-- 临时测试：将用户的免费次数改为1次
-- ============================================================================

-- 更新用户的订阅计划为 FREE（30次限额）
UPDATE public.user_subscriptions
SET plan_type = 'free',
    updated_at = NOW()
WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236';

-- 为了测试只有1次，我们使用加油包方式
-- 先创建一个只有1次的"测试加油包"
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
    'test_package_1_credit',
    1,
    1,
    0.00,
    'USD',
    'active',
    NOW() + INTERVAL '30 days',
    NOW()
)
ON CONFLICT DO NOTHING;

-- 验证结果
SELECT '✅ 用户订阅已更新' as status;

SELECT
    '📊 用户订阅信息' as info,
    plan_type,
    status,
    subscription_start
FROM public.user_subscriptions
WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236';

SELECT
    '📊 用户加油包' as info,
    package_type,
    credits_total,
    credits_remaining,
    status,
    expiry_date
FROM public.user_credit_packages
WHERE user_id = '16759c96-dd3a-4b14-a952-77bf5b798236'
ORDER BY purchase_date DESC;

SELECT '✅ 现在用户有1次生成额度（从加油包扣除）' as message;
