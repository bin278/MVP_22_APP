-- ============================================================================
-- 国际版使用次数追踪 - 安全设置脚本（先清理再创建）
-- ============================================================================
-- 说明: 此脚本会先删除已存在的表和策略，然后重新创建
-- 警告: 这会删除现有数据！仅在首次设置或确定可以删除数据时使用
-- ============================================================================

-- ============================================================================
-- 1. 删除已存在的表和策略（如果存在）
-- ============================================================================

-- 删除 recommendation_history 表
DROP TABLE IF EXISTS public.recommendation_history CASCADE;

-- 删除 recommendation_usage 表
DROP TABLE IF EXISTS public.recommendation_usage CASCADE;

-- 删除 user_credit_packages 表
DROP TABLE IF EXISTS public.user_credit_packages CASCADE;

-- 删除 user_subscriptions 表
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;


-- ============================================================================
-- 2. 创建用户订阅表 (user_subscriptions)
-- ============================================================================

CREATE TABLE public.user_subscriptions (
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
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- 启用 RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 创建策略
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
-- 3. 创建用户加油包表 (user_credit_packages)
-- ============================================================================

CREATE TABLE public.user_credit_packages (
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
CREATE INDEX idx_user_credit_packages_user_id ON public.user_credit_packages(user_id);
CREATE INDEX idx_user_credit_packages_status ON public.user_credit_packages(status);
CREATE INDEX idx_user_credit_packages_purchase_date ON public.user_credit_packages(purchase_date);

-- 启用 RLS
ALTER TABLE public.user_credit_packages ENABLE ROW LEVEL SECURITY;

-- 创建策略
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
-- 4. 创建使用记录表 (recommendation_usage)
-- ============================================================================

CREATE TABLE public.recommendation_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_recommendation_usage_user_id ON public.recommendation_usage(user_id);
CREATE INDEX idx_recommendation_usage_created_at ON public.recommendation_usage(created_at DESC);
CREATE INDEX idx_recommendation_usage_user_created ON public.recommendation_usage(user_id, created_at DESC);

-- 启用 RLS
ALTER TABLE public.recommendation_usage ENABLE ROW LEVEL SECURITY;

-- 创建策略
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
-- 5. 创建推荐历史表 (recommendation_history)
-- ============================================================================

CREATE TABLE public.recommendation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recommendation JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_recommendation_history_user_id ON public.recommendation_history(user_id);
CREATE INDEX idx_recommendation_history_created_at ON public.recommendation_history(created_at DESC);

-- 启用 RLS
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;

-- 创建策略
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
-- 6. 验证表结构
-- ============================================================================

-- 验证所有表都已创建
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_subscriptions', 'user_credit_packages', 'recommendation_usage', 'recommendation_history')
ORDER BY tablename;

-- 预期结果:
-- tablename                | schemaname
-- recommendation_history   | public
-- recommendation_usage     | public
-- user_credit_packages      | public
-- user_subscriptions       | public


-- ============================================================================
-- 7. 初始化现有用户（如果有）
-- ============================================================================

-- 为所有现有用户添加 FREE 订阅（如果他们还没有订阅）
INSERT INTO public.user_subscriptions (user_id, plan_type, status, subscription_start)
SELECT id, 'free', 'active', NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions);

-- 显示初始化的用户数量
SELECT COUNT(*) as initialized_users FROM public.user_subscriptions;

-- ============================================================================
-- 8. 完成提示
-- ============================================================================

SELECT '✅ 数据库设置完成！' as status;
SELECT '现在可以开始使用使用次数追踪功能了' as message;
