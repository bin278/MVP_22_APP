-- ============================================================================
-- 国际版使用次数追踪 - 修复现有表结构
-- ============================================================================
-- 说明: 此脚本会检查并修复现有表的结构，添加缺失的列
-- 优点: 保留现有数据，只修改表结构
-- ============================================================================

-- ============================================================================
-- 1. 修复 user_subscriptions 表
-- ============================================================================

-- 添加缺失的列（如果不存在）
DO $$
BEGIN
    -- 检查并添加 plan_type 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_subscriptions'
        AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE public.user_subscriptions
        ADD COLUMN plan_type VARCHAR(20) NOT NULL DEFAULT 'free'
        CHECK (plan_type IN ('free', 'pro', 'enterprise'));
    END IF;

    -- 检查并添加 subscription_start 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_subscriptions'
        AND column_name = 'subscription_start'
    ) THEN
        ALTER TABLE public.user_subscriptions
        ADD COLUMN subscription_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    END IF;

    -- 检查并添加 subscription_end 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_subscriptions'
        AND column_name = 'subscription_end'
    ) THEN
        ALTER TABLE public.user_subscriptions
        ADD COLUMN subscription_end TIMESTAMP WITH TIME ZONE;
    END IF;

    -- 检查并添加 status 列
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_subscriptions'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.user_subscriptions
        ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cancelled', 'expired'));
    END IF;
END $$;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- 启用 RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Service role can manage user_subscriptions_safe" ON public.user_subscriptions;

-- 创建新策略
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user_subscriptions"
  ON public.user_subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.user_subscriptions IS '用户订阅信息表';


-- ============================================================================
-- 2. 修复 user_credit_packages 表
-- ============================================================================

-- 如果表不存在，创建它
CREATE TABLE IF NOT EXISTS public.user_credit_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('basic', 'standard', 'premium')),
  package_id VARCHAR(50) NOT NULL,
  credits_total INTEGER NOT NULL,
  credits_remaining INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used_up')),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_credit_packages_user_id ON public.user_credit_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_packages_status ON public.user_credit_packages(status);
CREATE INDEX IF NOT EXISTS idx_user_credit_packages_purchase_date ON public.user_credit_packages(purchase_date);

-- 启用 RLS
ALTER TABLE public.user_credit_packages ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own credit packages" ON public.user_credit_packages;
DROP POLICY IF EXISTS "Service role can manage credit packages" ON public.user_credit_packages;
DROP POLICY IF EXISTS "Service role can manage user_credit_packages_safe" ON public.user_credit_packages;

-- 创建新策略
CREATE POLICY "Users can view own credit packages"
  ON public.user_credit_packages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user_credit_packages"
  ON public.user_credit_packages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.user_credit_packages IS '用户加油包购买记录';


-- ============================================================================
-- 3. 创建 recommendation_usage 表
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recommendation_usage_user_id ON public.recommendation_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_usage_created_at ON public.recommendation_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_usage_user_created ON public.recommendation_usage(user_id, created_at DESC);

-- 启用 RLS
ALTER TABLE public.recommendation_usage ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own usage" ON public.recommendation_usage;
DROP POLICY IF EXISTS "Service role can manage usage" ON public.recommendation_usage;
DROP POLICY IF EXISTS "Service role can manage recommendation_usage_safe" ON public.recommendation_usage;

-- 创建新策略
CREATE POLICY "Users can view own usage"
  ON public.recommendation_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage recommendation_usage"
  ON public.recommendation_usage
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.recommendation_usage IS '用户代码生成使用记录表';


-- ============================================================================
-- 4. 创建 recommendation_history 表
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recommendation JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_id ON public.recommendation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_created_at ON public.recommendation_history(created_at DESC);

-- 启用 RLS
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own history" ON public.recommendation_history;
DROP POLICY IF EXISTS "Service role can manage history" ON public.recommendation_history;
DROP POLICY IF EXISTS "Service role can manage recommendation_history_safe" ON public.recommendation_history;

-- 创建新策略
CREATE POLICY "Users can view own history"
  ON public.recommendation_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage recommendation_history"
  ON public.recommendation_history
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.recommendation_history IS '用户推荐历史记录表';


-- ============================================================================
-- 5. 初始化现有用户（如果他们还没有订阅）
-- ============================================================================

-- 为所有现有用户添加 FREE 订阅
INSERT INTO public.user_subscriptions (user_id, plan_type, status, subscription_start)
SELECT id, 'free', 'active', NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 6. 验证表结构
-- ============================================================================

-- 显示所有表的列结构
SELECT
    'user_subscriptions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
  AND column_name IN ('id', 'user_id', 'plan_type', 'status', 'subscription_start', 'subscription_end')
UNION ALL

SELECT
    'user_credit_packages' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_credit_packages'
  AND column_name IN ('id', 'user_id', 'package_type', 'credits_remaining', 'status')
UNION ALL

SELECT
    'recommendation_usage' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'recommendation_usage'
UNION ALL

SELECT
    'recommendation_history' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'recommendation_history'
ORDER BY table_name, column_name;


-- ============================================================================
-- 7. 显示统计信息
-- ============================================================================

-- 显示表创建状态
SELECT '✅ 表创建状态' as info;
SELECT
    tablename as table_name,
    '✅ 已创建' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_subscriptions', 'user_credit_packages', 'recommendation_usage', 'recommendation_history')
ORDER BY tablename;

-- 显示用户订阅统计
SELECT
    '📊 用户订阅统计' as info,
    COUNT(*) as total_subscriptions,
    COUNT(CASE WHEN plan_type = 'free' THEN 1 END) as free_users,
    COUNT(CASE WHEN plan_type = 'pro' THEN 1 END) as pro_users,
    COUNT(CASE WHEN plan_type = 'enterprise' THEN 1 END) as enterprise_users
FROM public.user_subscriptions;


-- ============================================================================
-- 8. 完成
-- ============================================================================

SELECT '✅ 数据库修复完成！' as status;
SELECT '现在可以开始使用使用次数追踪功能了' as message;
