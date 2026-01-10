-- ============================================================================
-- 修复所有使用追踪表的外键约束
-- ============================================================================
-- 说明: 确保所有表的 user_id 外键都指向正确的 auth.users 表
-- 注意: 需要手动处理每个表，因为 PostgreSQL 不支持在 DO 块中调用函数
-- ============================================================================

-- ============================================================================
-- 1. 修复 recommendation_usage 表
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE cl.relname = 'recommendation_usage'
        AND c.contype = 'f'
    ) THEN
        ALTER TABLE public.recommendation_usage
        DROP CONSTRAINT IF EXISTS recommendation_usage_user_id_fkey;
        RAISE NOTICE '✅ recommendation_usage: 已删除旧的外键约束';
    END IF;

    ALTER TABLE public.recommendation_usage
    ADD CONSTRAINT recommendation_usage_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

    RAISE NOTICE '✅ recommendation_usage: 已创建正确的外键约束';
END $$;

-- ============================================================================
-- 2. 修复 recommendation_history 表
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE cl.relname = 'recommendation_history'
        AND c.contype = 'f'
    ) THEN
        ALTER TABLE public.recommendation_history
        DROP CONSTRAINT IF EXISTS recommendation_history_user_id_fkey;
        RAISE NOTICE '✅ recommendation_history: 已删除旧的外键约束';
    END IF;

    ALTER TABLE public.recommendation_history
    ADD CONSTRAINT recommendation_history_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

    RAISE NOTICE '✅ recommendation_history: 已创建正确的外键约束';
END $$;

-- ============================================================================
-- 3. 修复 user_subscriptions 表
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE cl.relname = 'user_subscriptions'
        AND c.contype = 'f'
    ) THEN
        ALTER TABLE public.user_subscriptions
        DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
        RAISE NOTICE '✅ user_subscriptions: 已删除旧的外键约束';
    END IF;

    ALTER TABLE public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

    RAISE NOTICE '✅ user_subscriptions: 已创建正确的外键约束';
END $$;

-- ============================================================================
-- 4. 修复 user_credit_packages 表
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE cl.relname = 'user_credit_packages'
        AND c.contype = 'f'
    ) THEN
        ALTER TABLE public.user_credit_packages
        DROP CONSTRAINT IF EXISTS user_credit_packages_user_id_fkey;
        RAISE NOTICE '✅ user_credit_packages: 已删除旧的外键约束';
    END IF;

    ALTER TABLE public.user_credit_packages
    ADD CONSTRAINT user_credit_packages_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

    RAISE NOTICE '✅ user_credit_packages: 已创建正确的外键约束';
END $$;

-- ============================================================================
-- 5. 验证所有外键约束
-- ============================================================================

SELECT
    '📊 所有表的外键约束' as info,
    cl.relname as table_name,
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE n.nspname = 'public'
  AND c.contype = 'f'
  AND cl.relname IN ('recommendation_usage', 'recommendation_history', 'user_subscriptions', 'user_credit_packages')
ORDER BY cl.relname;

-- ============================================================================
-- 6. 显示完成信息
-- ============================================================================

SELECT '✅ 所有外键约束修复完成！' as status;
SELECT '现在所有表都可以正常工作了' as message;
