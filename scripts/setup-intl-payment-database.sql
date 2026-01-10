-- ============================================================================
-- 国际版支付功能 - 完整数据库设置脚本
-- ============================================================================
-- 说明: 此脚本用于在国际版 (Supabase) 数据库中创建支付相关表结构
-- 使用方法: 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. 创建订阅表 (subscriptions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id VARCHAR(50) NOT NULL DEFAULT 'pro',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  provider_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. 创建支付记录表 (payments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'wechat', 'alipay')),
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('subscription', 'credit_package')),
  transaction_id TEXT NOT NULL, -- 通用交易ID，根据支付方式存储不同的ID
  plan_type VARCHAR(50),
  billing_cycle VARCHAR(10) CHECK (billing_cycle IN ('monthly', 'yearly')),
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  paypal_order_id VARCHAR(255),
  paypal_capture_id VARCHAR(255),
  wechat_transaction_id VARCHAR(255),
  alipay_trade_no VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. 创建 Webhook 事件表 (webhook_events)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. 创建用户积分包购买记录表 (user_credit_packages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_credit_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_id VARCHAR(50) NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'refunded')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. 创建索引
-- ----------------------------------------------------------------------------

-- subscriptions 表索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id ON public.subscriptions(provider_subscription_id);

-- payments 表索引
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id ON public.payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON public.payments(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- webhook_events 表索引
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON public.webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- user_credit_packages 表索引
CREATE INDEX IF NOT EXISTS idx_user_credit_packages_user_id ON public.user_credit_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credit_packages_status ON public.user_credit_packages(status);
CREATE INDEX IF NOT EXISTS idx_user_credit_packages_expires_at ON public.user_credit_packages(expires_at);

-- ----------------------------------------------------------------------------
-- 6. 启用行级安全 (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credit_packages ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7. 创建 RLS 策略
-- ----------------------------------------------------------------------------

-- subscriptions 表策略
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- payments 表策略
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payments"
  ON public.payments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- webhook_events 表策略
CREATE POLICY "Service role can manage webhook events"
  ON public.webhook_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- user_credit_packages 表策略
CREATE POLICY "Users can view own credit packages"
  ON public.user_credit_packages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit packages"
  ON public.user_credit_packages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 8. 创建触发器函数 - 自动更新 updated_at 字段
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器到相关表
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 9. 创建辅助函数
-- ----------------------------------------------------------------------------

-- 获取用户当前活跃订阅
CREATE OR REPLACE FUNCTION public.get_user_active_subscription(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  plan_id VARCHAR(50),
  status VARCHAR(20),
  current_period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.plan_id, s.status, s.current_period_end
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status = 'active'
    AND s.current_period_end > NOW()
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否有支付权限
CREATE OR REPLACE FUNCTION public.check_user_payment_permission(
  user_uuid UUID,
  payment_amount DECIMAL,
  payment_method VARCHAR
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- 这里可以添加业务逻辑，例如检查用户是否有未支付的订单
  -- 检查用户是否超过支付限制等

  result := json_build_object(
    'allowed', true,
    'user_id', user_uuid,
    'amount', payment_amount,
    'method', payment_method,
    'checked_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 10. 验证查询 (用于检查表是否创建成功)
-- ----------------------------------------------------------------------------

-- 检查表是否创建成功
SELECT
  'subscriptions' AS table_name,
  COUNT(*) AS row_count
FROM public.subscriptions
UNION ALL
SELECT
  'payments' AS table_name,
  COUNT(*) AS row_count
FROM public.payments
UNION ALL
SELECT
  'webhook_events' AS table_name,
  COUNT(*) AS row_count
FROM public.webhook_events
UNION ALL
SELECT
  'user_credit_packages' AS table_name,
  COUNT(*) AS row_count
FROM public.user_credit_packages;

-- 检查索引是否创建成功
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('subscriptions', 'payments', 'webhook_events', 'user_credit_packages')
ORDER BY tablename, indexname;

-- 检查 RLS 策略是否创建成功
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('subscriptions', 'payments', 'webhook_events', 'user_credit_packages')
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------------------
-- 11. 插入测试数据 (可选 - 用于开发测试)
-- ----------------------------------------------------------------------------

-- 取消下面的注释以插入测试数据
/*
-- 测试订阅数据
INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
VALUES
  (auth.uid(), 'pro', 'active', NOW(), NOW() + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- 测试支付记录
INSERT INTO public.payments (user_id, amount, currency, status, payment_method, payment_type, plan_type, billing_cycle)
VALUES
  (auth.uid(), 9.99, 'USD', 'completed', 'stripe', 'subscription', 'pro', 'monthly')
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- 脚本执行完成
-- ============================================================================
-- 如果上面的验证查询返回了结果，说明表创建成功
-- 如果遇到错误，请检查：
-- 1. Supabase 项目是否有足够的权限
-- 2. auth.users 表是否存在
-- 3. 是否有表名冲突
-- ============================================================================
