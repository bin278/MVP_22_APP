#!/bin/bash

# ========================================
# Webhook 测试配置脚本
# ========================================

# 🔴 请替换为你的 ngrok URL（不要加末尾的斜杠）
NGROK_URL="https://your-ngrok-url.ngrok-free.app"

echo "======================================"
echo "📡 配置 Webhook 测试环境"
echo "======================================"
echo ""
echo "你的 ngrok URL: $NGROK_URL"
echo ""

# Stripe Webhook URL
STRIPE_WEBHOOK_URL="${NGROK_URL}/api/payment/stripe/webhook"
echo "✅ Stripe Webhook URL:"
echo "   $STRIPE_WEBHOOK_URL"
echo ""

# PayPal Webhook URL
PAYPAL_WEBHOOK_URL="${NGROK_URL}/api/payment/paypal/webhook"
echo "✅ PayPal Webhook URL:"
echo "   $PAYPAL_WEBHOOK_URL"
echo ""

echo "======================================"
echo "📝 下一步操作："
echo "======================================"
echo ""
echo "1️⃣  Stripe Dashboard 配置："
echo "   - 访问: https://dashboard.stripe.com/test/webhooks"
echo "   - 点击 '+ Add endpoint'"
echo "   - 粘贴: $STRIPE_WEBHOOK_URL"
echo "   - 选择事件: checkout.session.completed, payment_intent.succeeded"
echo "   - 复制新的 'Signing secret' (whsec_...)"
echo ""
echo "2️⃣  PayPal Dashboard 配置："
echo "   - 访问: https://developer.paypal.com/developer/applications/"
echo "   - 选择你的沙盒应用"
echo "   - 点击 'Webhooks'"
echo "   - 粘贴: $PAYPAL_WEBHOOK_URL"
echo ""
echo "3️⃣  更新 .env.local 文件："
echo "   - 添加或更新 STRIPE_WEBHOOK_SECRET=新的密钥"
echo ""
echo "======================================"
