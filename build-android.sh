#!/bin/bash

echo "==================================="
echo "  Building APP for Android"
echo "==================================="
echo ""

# 1. 构建前端
echo "Step 1: Building Next.js..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed!"
echo ""

# 2. 复制构建文件到 public
echo "Step 2: Copying build files to public..."
rm -rf public/_next public/static
cp -r .next/static public/
cp -r .next/server public/_next_server

echo "✅ Files copied!"
echo ""

# 3. 同步到 Android
echo "Step 3: Syncing to Android..."
npx cap sync android

echo "✅ Sync completed!"
echo ""

echo "==================================="
echo "  Build Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Open Android Studio"
echo "2. Build > Rebuild Project"
echo "3. Run > Run 'app'"
echo ""
