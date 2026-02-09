-- ============================================================================
-- 升级用户到企业版 (Enterprise)
-- ============================================================================
-- 使用方法：
-- 1. 将下面的 'USER_EMAIL_HERE' 替换为实际的用户邮箱
-- 2. 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- 查找用户 ID
DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT := '1685185241@qq.com';  -- 替换为实际邮箱
BEGIN
    -- 查找用户
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_user_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ 未找到邮箱为 % 的用户', v_user_email;
    END IF;

    RAISE NOTICE '✅ 找到用户: % (ID: %)', v_user_email, v_user_id;

    -- 检查用户订阅记录是否存在
    IF EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = v_user_id) THEN
        -- 更新现有记录
        UPDATE public.user_subscriptions
        SET plan_type = 'enterprise',
            status = 'active',
            subscription_start = NOW(),
            subscription_end = NOW() + INTERVAL '1 year',
            updated_at = NOW()
        WHERE user_id = v_user_id;

        RAISE NOTICE '✅ 已更新现有订阅记录';
    ELSE
        -- 插入新记录
        INSERT INTO public.user_subscriptions (
            user_id,
            plan_type,
            status,
            subscription_start,
            subscription_end,
            created_at,
            updated_at
        )
        VALUES (
            v_user_id,
            'enterprise',
            'active',
            NOW(),
            NOW() + INTERVAL '1 year',
            NOW(),
            NOW()
        );

        RAISE NOTICE '✅ 已创建新订阅记录';
    END IF;

    RAISE NOTICE '✅ 用户订阅已更新为企业版';

END $$;

-- 验证结果
SELECT
    '📊 用户订阅信息' as info,
    u.email,
    us.plan_type,
    us.status,
    us.subscription_start,
    us.subscription_end
FROM public.user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE u.email = 'USER_EMAIL_HERE';  -- 替换为实际邮箱

SELECT '✅ 升级完成！用户现在可以使用企业版的所有功能，包括 Mistral Large 模型' as message;
