-- 测试广告功能 - 插入测试数据
-- 在 Supabase Dashboard > SQL Editor 中执行此脚本

-- 插入一个测试广告
INSERT INTO ads (
  title,
  description,
  media_type,
  media_url,
  link_url,
  link_type,
  position,
  platform,
  region,
  status,
  priority
) VALUES (
  '测试广告',
  '这是一个测试广告',
  'image',
  'https://via.placeholder.com/728x90?text=Test+Ad+Top',
  'https://example.com',
  'external',
  'top',
  'web',
  'all',
  'active',
  10
);

-- 插入底部广告
INSERT INTO ads (
  title,
  description,
  media_type,
  media_url,
  link_url,
  link_type,
  position,
  platform,
  region,
  status,
  priority
) VALUES (
  '底部测试广告',
  '这是底部测试广告',
  'image',
  'https://via.placeholder.com/728x90?text=Test+Ad+Bottom',
  'https://example.com',
  'external',
  'bottom',
  'web',
  'all',
  'active',
  10
);

-- 查询验证
SELECT id, title, position, status, media_url FROM ads WHERE status = 'active';
