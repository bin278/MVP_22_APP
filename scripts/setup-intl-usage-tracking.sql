-- ============================================================================
-- 国际版使用次数追踪 - 完整数据库设置脚本
-- ============================================================================
-- 说明: 此脚本用于创建国际版使用次数追踪所需的所有表
-- 使用方法: 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- ============================================================================
-- 1. 创建用户订阅表 (user_subscriptions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  subscription_start TIMESTAMP WITH TIME ZONE NOT NULL,
  subscription_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id
  ON public.user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
  ON public.user_subscriptions(status);

-- 启用 RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.user_subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.user_subscriptions IS '用户订阅信息表';


-- ============================================================================
-- 2. 创建用户加油包表 (user_credit_packages)
-- ============================================================================

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
CREATE INDEX IF NOT EXISTS idx_user_credit_packages_user_id
  ON public.user_credit_packages(user_id);

CREATE INDEX IF NOT EXISTS idx_user_credit_packages_status
  ON public.user_credit_packages(status);

CREATE INDEX IF NOT EXISTS idx_user_credit_packages_purchase_date
  ON public.user_credit_packages(purchase_date);

-- 启用 RLS
ALTER TABLE public.user_credit_packages ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own credit packages"
  ON public.user_credit_packages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit packages"
  ON public.user_credit_packages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.user_credit_packages IS '用户加油包购买记录';


-- ============================================================================
-- 3. 创建使用记录表 (recommendation_usage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recommendation_usage_user_id
  ON public.recommendation_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_usage_created_at
  ON public.recommendation_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_usage_user_created
  ON public.recommendation_usage(user_id, created_at DESC);

-- 启用 RLS
ALTER TABLE public.recommendation_usage ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own usage"
  ON public.recommendation_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON public.recommendation_usage
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.recommendation_usage IS '用户代码生成使用记录表';


-- ============================================================================
-- 4. 创建推荐历史表 (recommendation_history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recommendation JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_id
  ON public.recommendation_history(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_history_created_at
  ON public.recommendation_history(created_at DESC);

-- 启用 RLS
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own history"
  ON public.recommendation_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage history"
  ON public.recommendation_history
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.recommendation_history IS '用户推荐历史记录表';


-- ============================================================================
-- 5. 验证表结构
-- ============================================================================

-- 验证 user_subscriptions 表
SELECT
    'user_subscriptions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
UNION ALL

-- 验证 user_credit_packages 表
SELECT
    'user_credit_packages' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_credit_packages'
UNION ALL

-- 验证 recommendation_usage 表
SELECT
    'recommendation_usage' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'recommendation_usage'
UNION ALL

-- 验证 recommendation_history 表
SELECT
    'recommendation_history' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'recommendation_history'
ORDER BY table_name, column_name;

-- ============================================================================
-- 6. 测试数据（可选）
-- ============================================================================

-- 取消下面的注释来插入测试数据
/*
-- 插入一个测试用户订阅
INSERT INTO public.user_subscriptions (user_id, plan_type, status, subscription_start, subscription_end)
VALUES (
  'YOUR_USER_ID_HERE',  -- 替换为实际的用户 ID
  'free',
  'active',
  NOW(),
  NULL
);

-- 查询验证
SELECT * FROM public.user_subscriptions WHERE user_id = 'YOUR_USER_ID_HERE';
*/
