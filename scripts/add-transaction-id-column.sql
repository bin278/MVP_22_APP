-- ============================================================================
-- 添加 transaction_id 字段到现有的 payments 表
-- ============================================================================
-- 说明: 如果你的 payments 表缺少 transaction_id 字段，运行此脚本来添加
-- 使用方法: 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- 检查并添加 transaction_id 列（如果不存在）
DO $$
BEGIN
    -- 检查列是否已存在
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'payments'
        AND column_name = 'transaction_id'
        AND table_schema = 'public'
    ) THEN
        -- 列不存在，添加它
        ALTER TABLE public.payments
        ADD COLUMN transaction_id TEXT;

        -- 为现有的记录填充 transaction_id
        -- Stripe 支付使用 stripe_session_id
        UPDATE public.payments
        SET transaction_id = stripe_session_id
        WHERE payment_method = 'stripe' AND stripe_session_id IS NOT NULL;

        -- PayPal 支付使用 paypal_order_id
        UPDATE public.payments
        SET transaction_id = paypal_order_id
        WHERE payment_method = 'paypal' AND paypal_order_id IS NOT NULL;

        -- 微信支付使用 wechat_transaction_id
        UPDATE public.payments
        SET transaction_id = wechat_transaction_id
        WHERE payment_method = 'wechat' AND wechat_transaction_id IS NOT NULL;

        -- 支付宝使用 alipay_trade_no
        UPDATE public.payments
        SET transaction_id = alipay_trade_no
        WHERE payment_method = 'alipay' AND alipay_trade_no IS NOT NULL;

        -- 现在设置为 NOT NULL（所有现有记录都应该有值了）
        ALTER TABLE public.payments
        ALTER COLUMN transaction_id SET NOT NULL;

        RAISE NOTICE 'transaction_id column added successfully.';
    ELSE
        RAISE NOTICE 'transaction_id column already exists, skipping.';
    END IF;
END $$;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id
ON public.payments(transaction_id);

-- 验证修改
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name = 'transaction_id'
AND table_schema = 'public';

-- ============================================================================
-- 脚本执行完成
-- ============================================================================
