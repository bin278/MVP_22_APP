-- 测试生成界面广告 - 插入测试数据
-- 在 Supabase Dashboard > SQL Editor 中执行此脚本

-- 插入一个生成界面专用广告
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
  '生成界面测试广告',
  '这是生成界面的测试广告',
  'image',
  'https://via.placeholder.com/600x200?text=Generate+Page+Ad',
  'https://example.com',
  'external',
  'generate',
  'web',
  'all',
  'active',
  10
);

-- 查询验证
SELECT id, title, position, status, media_url FROM ads WHERE position = 'generate';
