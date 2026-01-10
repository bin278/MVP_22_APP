-- 检查 user_credit_packages 表的实际结构
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_credit_packages'
  AND table_schema = 'public'
ORDER BY ordinal_position;
