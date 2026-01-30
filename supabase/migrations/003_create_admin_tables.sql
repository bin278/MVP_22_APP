-- 后台管理系统数据库表创建脚本
-- 执行位置: Supabase Dashboard > SQL Editor
-- 创建日期: 2026-01-30

-- ============================================
-- 1. 管理员用户表
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

COMMENT ON TABLE admin_users IS '管理员用户表';
COMMENT ON COLUMN admin_users.password_hash IS 'bcrypt哈希密码';

-- ============================================
-- 2. 用户表 (如果不存在)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加 last_active_at 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_active_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON users(last_active_at);

COMMENT ON TABLE users IS '用户表';

-- ============================================
-- 3. 订单表 (如果不存在)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

COMMENT ON TABLE orders IS '订单表';
COMMENT ON COLUMN orders.status IS '订单状态: pending, paid, failed, refunded';

-- ============================================
-- 4. 订阅表 (如果不存在)
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加 plan 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'plan'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

COMMENT ON TABLE subscriptions IS '订阅表';
COMMENT ON COLUMN subscriptions.plan IS '订阅计划: free, pro, enterprise';

-- ============================================
-- 5. 广告表
-- ============================================
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  link_url TEXT,
  link_type TEXT DEFAULT 'external',
  position TEXT NOT NULL DEFAULT 'top',
  platform TEXT NOT NULL DEFAULT 'all',
  region TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'inactive',
  priority INTEGER DEFAULT 0,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_region ON ads(region);
CREATE INDEX IF NOT EXISTS idx_ads_priority ON ads(priority DESC);

COMMENT ON TABLE ads IS '广告表';
COMMENT ON COLUMN ads.media_type IS '媒体类型: image, video';
COMMENT ON COLUMN ads.link_type IS '链接类型: external, internal, download';
COMMENT ON COLUMN ads.position IS '广告位置: left, right, top, bottom';
COMMENT ON COLUMN ads.region IS '区域: global, cn, all';
COMMENT ON COLUMN ads.status IS '状态: active, inactive, scheduled';

-- ============================================
-- 6. 版本发布表
-- ============================================
CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL,
  download_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_release_date ON releases(release_date DESC);

COMMENT ON TABLE releases IS '版本发布表';
COMMENT ON COLUMN releases.status IS '状态: draft, published, archived';

-- ============================================
-- 7. 社交链接表
-- ============================================
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  region TEXT NOT NULL DEFAULT 'all',
  "order" INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_links_order ON social_links("order");
CREATE INDEX IF NOT EXISTS idx_social_links_visible ON social_links(visible);
CREATE INDEX IF NOT EXISTS idx_social_links_region ON social_links(region);

COMMENT ON TABLE social_links IS '社交链接表';
COMMENT ON COLUMN social_links.region IS '区域: global, cn, all';

-- ============================================
-- 8. 创建默认管理员用户
-- ============================================
-- 注意: 这里使用的密码是 "admin123" 的bcrypt哈希值
-- 您应该在生产环境中更改此密码
-- 密码: admin123
-- 哈希值: $2b$10$kgQggA1j94gJnbop60BNvu6hH591e.4rTO4lx9z4nqgKYfikgfbdi

-- 插入默认管理员 (用户名: admin, 密码: admin123)
-- 注意: 请在首次登录后立即更改密码
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2b$10$kgQggA1j94gJnbop60BNvu6hH591e.4rTO4lx9z4nqgKYfikgfbdi')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 9. 启用行级安全策略 (RLS)
-- ============================================
-- 管理员表不需要RLS，因为只能通过后台访问
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 创建策略: 只有管理员可以访问管理员表
CREATE POLICY "Only admins can access admin_users" ON admin_users
  FOR ALL USING (false);

-- ============================================
-- 完成
-- ============================================
-- 所有表创建完成
-- 默认管理员账号:
--   用户名: admin
--   密码: admin123
--
-- ⚠️ 重要提示:
-- 1. 请立即登录后台并修改默认密码
-- 2. 在生产环境中设置 ADMIN_SESSION_SECRET 环境变量
-- 3. 确保 Supabase Service Role Key 已正确配置
