#!/bin/bash

# 数据库快速切换脚本
# 用于在开发环境快速切换数据库提供商

set -e

echo "=================================================="
echo "🔄 数据库提供商切换工具"
echo "=================================================="
echo ""

# 检查当前配置
if [ -f .env.local ]; then
  CURRENT_PROVIDER=$(grep DATABASE_PROVIDER .env.local | cut -d '=' -f2)
  echo "📊 当前数据库: ${CURRENT_PROVIDER:-未配置}"
else
  echo "⚠️  .env.local 文件不存在"
fi

echo ""
echo "请选择要使用的数据库:"
echo "  1) 国内版 - 腾讯云 CloudBase"
echo "  2) 国际版 - Supabase"
echo "  3) 测试当前配置"
echo "  q) 退出"
echo ""
read -p "请输入选项 [1-3/q]: " choice

case $choice in
  1)
    echo ""
    echo "🇨🇳 切换到国内版 (腾讯云 CloudBase)"
    echo "------------------------------------------------"

    # 复制配置模板
    if [ ! -f .env.local ]; then
      cp .env.cloudbase.example .env.local
      echo "✅ 已创建 .env.local"
    else
      # 更新 DATABASE_PROVIDER
      if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's/DATABASE_PROVIDER=.*/DATABASE_PROVIDER=cloudbase/' .env.local
      else
        # Linux
        sed -i 's/DATABASE_PROVIDER=.*/DATABASE_PROVIDER=cloudbase/' .env.local
      fi
      echo "✅ 已更新 DATABASE_PROVIDER=cloudbase"
    fi

    echo ""
    echo "下一步:"
    echo "  1. 编辑 .env.local 填写腾讯云配置"
    echo "  2. 运行: npm run config:test"
    echo "  3. 运行: npm run dev"
    ;;

  2)
    echo ""
    echo "🌍 切换到国际版 (Supabase)"
    echo "------------------------------------------------"

    # 复制配置模板
    if [ ! -f .env.local ]; then
      cp .env.supabase.example .env.local
      echo "✅ 已创建 .env.local"
    else
      # 更新 DATABASE_PROVIDER
      if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's/DATABASE_PROVIDER=.*/DATABASE_PROVIDER=supabase/' .env.local
      else
        # Linux
        sed -i 's/DATABASE_PROVIDER=.*/DATABASE_PROVIDER=supabase/' .env.local
      fi
      echo "✅ 已更新 DATABASE_PROVIDER=supabase"
    fi

    echo ""
    echo "下一步:"
    echo "  1. 编辑 .env.local 填写 Supabase 配置"
    echo "  2. 在 Supabase SQL Editor 运行: scripts/setup-supabase-db.sql"
    echo "  3. 运行: npm run config:test"
    echo "  4. 运行: npm run dev"
    ;;

  3)
    echo ""
    echo "🧪 测试当前配置"
    echo "------------------------------------------------"
    node scripts/test-database-switch.js
    ;;

  q|Q)
    echo "👋 再见!"
    exit 0
    ;;

  *)
    echo "❌ 无效选项"
    exit 1
    ;;
esac

echo ""
echo "=================================================="
echo "✅ 操作完成!"
echo "=================================================="
