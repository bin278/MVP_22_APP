-- 创建广告统计追踪的 RPC 函数
-- 用于原子性地增加广告的展示次数或点击次数

CREATE OR REPLACE FUNCTION increment_ad_stat(
  p_ad_id UUID,
  p_field TEXT
) RETURNS VOID AS $$
BEGIN
  IF p_field = 'impressions' THEN
    UPDATE ads SET impressions = impressions + 1, updated_at = NOW() WHERE id = p_ad_id;
  ELSIF p_field = 'clicks' THEN
    UPDATE ads SET clicks = clicks + 1, updated_at = NOW() WHERE id = p_ad_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
