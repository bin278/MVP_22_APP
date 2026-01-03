# Android APP 构建指南

本项目已配置使用 Capacitor 将 Next.js 应用打包成 Android APP。

## 📋 前置要求

### 必需软件

1. **Android Studio** (推荐最新版本)
   - 下载: https://developer.android.com/studio
   - 安装 Android SDK (API Level 33+)
   - 安装 Android SDK Build-Tools
   - 安装 Android SDK Platform-Tools

2. **Java Development Kit (JDK)**
   - JDK 17 或更高版本
   - Android Studio 通常自带 JDK

3. **Node.js** (已安装)

## 🚀 快速开始

### 方式一: 开发模式 (推荐用于测试)

开发模式允许 APP 连接到本地运行的开发服务器,可以实时预览更改。

1. **启动 Next.js 开发服务器**
```bash
npm run dev
```

2. **在另一个终端运行 APP**
```bash
npm run android:run
```

这会在连接的 Android 设备或模拟器上启动 APP。

### 方式二: 构建 APK (用于分发)

构建独立的 Android APK 文件,可以安装到任何设备。

1. **构建 APK**
```bash
npm run android:build:apk
```

2. **找到生成的 APK**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

3. **安装到设备**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 方式三: 发布版本 (用于上架)

构建签名的发布版本 APK。

1. **配置签名**
   - 编辑 `android/app/build.gradle`
   - 添加您的签名密钥配置

2. **构建发布版本**
```bash
npm run android:build:release
```

3. **生成的 APK 位置**
```
android/app/build/outputs/apk/release/app-release.apk
```

## 📱 使用 Android Studio (推荐)

对于更好的开发体验,可以使用 Android Studio:

1. **打开 Android 项目**
```bash
npm run android:open
```

2. **在 Android Studio 中**
   - 选择目标设备
   - 点击 "Run" 按钮 (或按 Shift+F10)
   - APP 会自动安装并启动

## 🔧 配置说明

### APP 配置文件

编辑 [capacitor.config.ts](capacitor.config.ts) 来自定义 APP:

```typescript
{
  appId: 'com.example.myapp',      // 应用包名 (建议修改为您的域名)
  appName: '我的应用',              // APP 显示名称
  webDir: 'public',                 // Web 资源目录
  server: {
    url: 'http://10.0.2.2:3000'     // 开发服务器地址
  }
}
```

### 修改 APP 名称和包名

1. 修改 [capacitor.config.ts](capacitor.config.ts) 中的 `appName` 和 `appId`
2. 运行 `npm run android:sync` 同步更改

### 配置服务器地址

- **开发模式**: `http://10.0.2.2:3000` (Android 模拟器访问宿主机)
- **真机测试**: 使用您电脑的局域网 IP,如 `http://192.168.1.100:3000`
- **生产环境**: 设置为您的生产服务器 URL

```bash
# 设置生产环境 URL
export CAPACITOR_SERVER_URL=https://your-domain.com
npm run android:sync
```

## 📝 可用命令

```bash
# 启动开发服务器
npm run dev

# 同步 Capacitor 配置
npm run android:sync

# 在 Android Studio 中打开
npm run android:open

# 运行 APP (需要设备连接)
npm run android:run

# 构建 Debug APK
npm run android:build:apk

# 构建 Release APK
npm run android:build:release
```

## 🌐 网络配置

### 允许 HTTP 流量 (开发用)

Android 9+ 默认禁止明文 HTTP 流量。项目已配置允许 HTTP:

1. 查看 `android/app/src/main/AndroidManifest.xml`
2. 已添加 `android:usesCleartextTraffic="true"`

### CORS 配置

确保您的 Next.js API 允许来自 Capacitor 的请求。在 Next.js 中添加:

```javascript
// next.config.mjs
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
      ],
    },
  ];
}
```

## 🎨 自定义 APP

### 修改图标

1. 准备图标文件 (PNG, 1024x1024 像素)
2. 使用 Capacitor 资源生成工具:
```bash
npm install @capacitor/assets --save-dev
npx cap assets generate
```

### 修改启动页

编辑 `android/app/src/main/res/values/styles.xml` 中的启动页配置。

## 📦 上架 Google Play

1. **创建签名密钥**
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **配置签名**
   在 `android/app/build.gradle` 中配置签名信息

3. **构建签名的 APK 或 AAB**

4. **创建 Google Play 开发者账号**
   - 费用: $25 (一次性)
   - 链接: https://play.google.com/console

5. **上传 APP**

## 🐛 常见问题

### 问题 1: 连接不到开发服务器

**解决方案:**
- 确保 `npm run dev` 正在运行
- 检查防火墙设置
- 使用电脑的局域网 IP 地址
- 确保设备和电脑在同一网络

### 问题 2: Gradle 构建失败

**解决方案:**
- 在 Android Studio 中打开项目
- 让 Android Studio 自动下载依赖
- 检查网络连接 (可能需要代理)

### 问题 3: API 路由 404

**解决方案:**
- Capacitor APP 通过 HTTP 连接,确保 Next.js 使用独立服务器
- 不要使用静态导出模式 (`output: 'export'`)
- 确保服务器地址配置正确

### 问题 4: 白屏

**解决方案:**
- 检查服务器是否可访问
- 使用 Chrome DevTools 远程调试:
```bash
adb logcat | grep -i console
```

## 📚 更多资源

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android 开发文档](https://developer.android.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)

## 💡 提示

- 首次构建可能需要较长时间下载 Gradle 依赖
- 建议使用 Android Studio 进行可视化操作
- 开发时使用 `npm run dev` + `npm run android:run` 组合
- 生产环境建议使用独立的服务器部署

## 🔄 工作流程

```
开发流程:
1. npm run dev (终端1)
2. npm run android:run (终端2)
3. 修改代码 → 自动刷新

构建流程:
1. npm run build (构建生产版本)
2. npm run android:sync (同步资源)
3. npm run android:build:apk (构建 APK)
4. 分发 APK
```

---

**注意**: 本项目使用开发模式连接本地服务器,适合测试和开发。正式发布时,请配置生产服务器地址并构建独立的 APK。
