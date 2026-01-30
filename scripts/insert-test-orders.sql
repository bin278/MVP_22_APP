-- 插入测试支付数据
-- 执行位置: Supabase Dashboard > SQL Editor

-- 插入测试支付记录
INSERT INTO payments (user_id, amount, currency, status, payment_method, payment_type, transaction_id, plan_type, billing_cycle, created_at)
VALUES
  -- 已完成的订阅支付
  (auth.uid(), 29.99, 'USD', 'completed', 'stripe', 'subscription', 'txn_stripe_1234567890', 'pro', 'monthly', NOW() - INTERVAL '1 day'),
  (auth.uid(), 99.99, 'USD', 'completed', 'paypal', 'subscription', 'txn_paypal_0987654321', 'pro', 'yearly', NOW() - INTERVAL '2 days'),
  (auth.uid(), 199.00, 'CNY', 'completed', 'wechat', 'subscription', 'txn_wx123456', 'enterprise', 'monthly', NOW() - INTERVAL '3 days'),

  -- 已完成的积分包支付
  (auth.uid(), 9.99, 'USD', 'completed', 'stripe', 'credit_package', 'txn_stripe_credits_001', NULL, NULL, NOW() - INTERVAL '4 days'),
  (auth.uid(), 49.99, 'USD', 'completed', 'paypal', 'credit_package', 'txn_paypal_credits_002', NULL, NULL, NOW() - INTERVAL '5 days'),

  -- 待处理支付
  (auth.uid(), 29.99, 'USD', 'pending', 'stripe', 'subscription', 'txn_stripe_pending_001', 'pro', 'monthly', NOW() - INTERVAL '1 hour'),
  (auth.uid(), 299.00, 'CNY', 'pending', 'alipay', 'subscription', 'txn_alipay_pending_002', 'enterprise', 'yearly', NOW() - INTERVAL '2 hours'),

  -- 失败支付
  (auth.uid(), 19.99, 'USD', 'failed', 'stripe', 'subscription', 'txn_stripe_failed_001', 'pro', 'monthly', NOW() - INTERVAL '5 days'),
  (auth.uid(), 99.00, 'CNY', 'failed', 'wechat', 'credit_package', 'txn_wx_failed_002', NULL, NULL, NOW() - INTERVAL '6 days');

-- 查看插入的数据
SELECT
  p.id,
  p.amount,
  p.currency,
  p.status,
  p.payment_method,
  p.payment_type,
  p.plan_type,
  p.transaction_id,
  p.created_at
FROM payments p
WHERE p.user_id = auth.uid()
ORDER BY p.created_at DESC;
