-- ============================================================================
-- 创建 recommendation_usage 表
-- 用于追踪用户的代码生成使用次数
-- ============================================================================
-- 说明: 此脚本用于在国际版 (Supabase) 数据库中创建 recommendation_usage 表
-- 使用方法: 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- 创建 recommendation_usage 表
CREATE TABLE IF NOT EXISTS public.recommendation_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_recommendation_usage_user_id
  ON public.recommendation_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_usage_created_at
  ON public.recommendation_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_usage_user_created
  ON public.recommendation_usage(user_id, created_at DESC);

-- 启用行级安全 (RLS)
ALTER TABLE public.recommendation_usage ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own usage"
  ON public.recommendation_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON public.recommendation_usage
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 添加表注释
COMMENT ON TABLE public.recommendation_usage IS '用户代码生成使用记录表';
COMMENT ON COLUMN public.recommendation_usage.user_id IS '用户ID';
COMMENT ON COLUMN public.recommendation_usage.metadata IS '元数据（包含模型、生成类型等信息）';
COMMENT ON COLUMN public.recommendation_usage.created_at IS '创建时间';

-- 验证表结构
SELECT
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'recommendation_usage'
ORDER BY ordinal_position;

-- 预期结果:
-- table_name              | column_name | data_type | column_default | is_nullable
-- recommendation_usage    | id          | uuid      | gen_random...  | NO
-- recommendation_usage    | user_id     | uuid      | null           | NO
-- recommendation_usage    | metadata    | jsonb     | {}             | YES
-- recommendation_usage    | created_at  | timetz... | NOW()          | YES
