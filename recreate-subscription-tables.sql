-- =====================================================
-- 重新创建订阅系统表结构
-- =====================================================
-- 此脚本会删除现有的订阅相关表并重新创建最新版本
-- 请确保在运行前备份重要数据

-- 1. 删除现有表和相关对象
-- =====================================================

-- 删除触发器
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
DROP TRIGGER IF EXISTS update_user_usage_stats_updated_at ON user_usage_stats;

-- 删除函数 (使用 CASCADE 删除依赖对象)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_user_limits(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_user_usage(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_user_use_model(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_subscription_tier(UUID) CASCADE;

-- 删除表 (使用 CASCADE 删除相关约束)
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS user_usage_stats CASCADE;

-- =====================================================
-- 2. 创建新表结构
-- =====================================================

-- 用户订阅状态表
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户使用统计表
CREATE TABLE user_usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  requests_today INTEGER DEFAULT 0,
  requests_this_month INTEGER DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- 每个用户只有一条统计记录
);

-- =====================================================
-- 3. 创建索引
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_usage_stats_user_id ON user_usage_stats(user_id);

-- =====================================================
-- 4. 启用行级安全策略
-- =====================================================

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_stats ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的订阅信息
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage stats" ON user_usage_stats
  FOR SELECT USING (auth.uid() = user_id);

-- 服务角色可以管理订阅信息（通过Stripe webhook等）
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage usage stats" ON user_usage_stats
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 5. 创建数据库函数
-- =====================================================

-- 函数：获取用户当前订阅等级
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  tier TEXT;
BEGIN
  SELECT subscription_tier INTO tier
  FROM user_subscriptions
  WHERE user_id = user_uuid AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 如果没有找到活跃订阅，返回免费版
  IF tier IS NULL THEN
    RETURN 'free';
  END IF;

  RETURN tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函数：检查用户是否有权限使用模型
CREATE OR REPLACE FUNCTION can_user_use_model(user_uuid UUID, model_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  allowed_models TEXT[];
BEGIN
  -- 获取用户订阅等级
  SELECT get_user_subscription_tier(user_uuid) INTO user_tier;

  -- 根据等级定义允许的模型
  CASE user_tier
    WHEN 'free' THEN allowed_models := ARRAY['deepseek-chat'];
    WHEN 'basic' THEN allowed_models := ARRAY['deepseek-chat', 'deepseek-coder'];
    WHEN 'pro' THEN allowed_models := ARRAY['deepseek-chat', 'deepseek-coder', 'gpt-4', 'claude-3-sonnet'];
    WHEN 'premium' THEN allowed_models := ARRAY['deepseek-chat', 'deepseek-coder', 'gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet'];
    ELSE allowed_models := ARRAY['deepseek-chat'];
  END CASE;

  -- 检查请求的模型是否在允许列表中
  RETURN model_id = ANY(allowed_models);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函数：更新用户使用统计
CREATE OR REPLACE FUNCTION update_user_usage(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  user_tier TEXT;
  today_start TIMESTAMP;
  month_start TIMESTAMP;
BEGIN
  -- 获取用户当前等级
  SELECT get_user_subscription_tier(user_uuid) INTO user_tier;

  -- 计算今天和本月的开始时间
  today_start := DATE_TRUNC('day', NOW());
  month_start := DATE_TRUNC('month', NOW());

  -- 插入或更新使用统计
  INSERT INTO user_usage_stats (user_id, subscription_tier, requests_today, requests_this_month, last_request_at, updated_at)
  VALUES (user_uuid, user_tier, 1, 1, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    subscription_tier = EXCLUDED.subscription_tier,
    requests_today = CASE
      WHEN user_usage_stats.last_request_at >= today_start THEN user_usage_stats.requests_today + 1
      ELSE 1
    END,
    requests_this_month = CASE
      WHEN user_usage_stats.last_request_at >= month_start THEN user_usage_stats.requests_this_month + 1
      ELSE 1
    END,
    last_request_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 函数：检查用户是否超过使用限制
CREATE OR REPLACE FUNCTION check_user_limits(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  user_tier TEXT;
  stats_record RECORD;
  limits_record RECORD;
  result JSON;
BEGIN
  -- 获取用户等级和统计
  SELECT get_user_subscription_tier(user_uuid) INTO user_tier;

  SELECT * INTO stats_record
  FROM user_usage_stats
  WHERE user_id = user_uuid;

  -- 根据等级定义限制
  CASE user_tier
    WHEN 'free' THEN
      limits_record.requests_per_day := 10;
      limits_record.requests_per_month := 100;
    WHEN 'basic' THEN
      limits_record.requests_per_day := 50;
      limits_record.requests_per_month := 1000;
    WHEN 'pro' THEN
      limits_record.requests_per_day := 200;
      limits_record.requests_per_month := 5000;
    WHEN 'premium' THEN
      limits_record.requests_per_day := -1; -- 无限制
      limits_record.requests_per_month := -1; -- 无限制
    ELSE
      limits_record.requests_per_day := 10;
      limits_record.requests_per_month := 100;
  END CASE;

  -- 检查是否超过限制
  result := json_build_object(
    'can_make_request', CASE
      WHEN limits_record.requests_per_day = -1 THEN true
      WHEN stats_record.requests_today IS NULL THEN true
      WHEN stats_record.requests_today < limits_record.requests_per_day THEN true
      ELSE false
    END,
    'requests_today', COALESCE(stats_record.requests_today, 0),
    'requests_limit_today', limits_record.requests_per_day,
    'requests_this_month', COALESCE(stats_record.requests_this_month, 0),
    'requests_limit_month', limits_record.requests_per_month
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. 创建触发器
-- =====================================================

-- 自动更新updated_at字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为表添加触发器
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usage_stats_updated_at
  BEFORE UPDATE ON user_usage_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 完成提示
-- =====================================================

-- 运行完成后，执行以下查询验证：
-- SELECT * FROM user_subscriptions LIMIT 1;
-- SELECT * FROM user_usage_stats LIMIT 1;
-- SELECT get_user_subscription_tier('00000000-0000-0000-0000-000000000000');
-- SELECT can_user_use_model('00000000-0000-0000-0000-000000000000', 'gpt-4');
