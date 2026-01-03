#!/bin/bash

echo "🚀 开始部署到CloudBase..."

# 检查是否安装了CloudBase CLI
if ! command -v cloudbase &> /dev/null; then
    echo "❌ CloudBase CLI 未安装，请先安装："
    echo "npm install -g @cloudbase/cli"
    exit 1
fi

# 检查是否已登录
if ! cloudbase env:list &> /dev/null; then
    echo "❌ 未登录CloudBase，请先登录："
    echo "cloudbase login"
    exit 1
fi

echo "📦 构建应用..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

echo "☁️ 部署到CloudBase..."
cloudbase hosting:deploy .next -e cloud1-3gn61ziydcfe6a57

if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    echo "🌐 应用URL: https://cloud1-3gn61ziydcfe6a57-1234567890.tcloudbaseapp.com"
else
    echo "❌ 部署失败"
fi
