-- ============================================================================
-- Supabase user_github_tokens 表创建脚本
-- 用于存储 GitHub OAuth token 和用户信息
-- ============================================================================

-- 创建 user_github_tokens 表
CREATE TABLE IF NOT EXISTS user_github_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_token TEXT NOT NULL,
  github_username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_github_tokens_user_id
ON user_github_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_user_github_tokens_username
ON user_github_tokens(github_username);

-- 启用行级安全策略 (RLS)
ALTER TABLE user_github_tokens ENABLE ROW LEVEL SECURITY;

-- 创建策略: 用户只能查看自己的 GitHub tokens
CREATE POLICY "Users can view their own GitHub tokens"
ON user_github_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- 创建策略: 用户可以插入自己的 GitHub tokens
CREATE POLICY "Users can insert their own GitHub tokens"
ON user_github_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 创建策略: 用户可以更新自己的 GitHub tokens
CREATE POLICY "Users can update their own GitHub tokens"
ON user_github_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- 创建策略: 用户可以删除自己的 GitHub tokens
CREATE POLICY "Users can delete their own GitHub tokens"
ON user_github_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- 创建触发器: 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_user_github_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_github_tokens_updated_at
BEFORE UPDATE ON user_github_tokens
FOR EACH ROW
EXECUTE FUNCTION update_user_github_tokens_updated_at();

-- 验证表结构
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_github_tokens'
ORDER BY ordinal_position;

-- 预期结果:
-- column_name     | data_type                   | is_nullable | column_default
-- id              | uuid                        | NO          | gen_random_uuid()
-- user_id         | uuid                        | NO          | null
-- github_token    | text                        | NO          | null
-- github_username | text                        | NO          | null
-- created_at      | timestamp with time zone    | YES         | NOW()
-- updated_at      | timestamp with time zone    | YES         | NOW()
