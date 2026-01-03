# Android APP 连接生产环境配置指南

## 📱 Android APP 如何连接网站

### **工作原理**
Capacitor Android APP 实际上是一个**内置浏览器的容器**，它会：
1. 加载您的网站作为 APP 的内容
2. 显示在手机上就像原生 APP
3. 连接到同一个 CloudBase 后端

---

## 🔧 部署步骤

### **第一步：部署网站到 CloudBase**

1. **构建生产版本**
```bash
npm run build
```

2. **部署到 CloudBase**
```bash
# 安装 CloudBase CLI（如果还没安装）
npm install -g @cloudbase/cli

# 登录 CloudBase
cloudbase login

# 部署
cloudbase deploy
```

3. **获取网站 URL**
部署成功后，CloudBase 会提供您的网站 URL，例如：
```
https://mornfront-xxx.tcb.qcloud.la
```

---

### **第二步：修改 APP 配置连接生产环境**

打开 `capacitor.config.ts` 文件，修改 `url` 配置：

#### **开发环境配置（当前）**
```typescript
server: {
  url: 'http://10.0.2.2:3000',  // 连接本地开发服务器
}
```

#### **生产环境配置（部署后）**
```typescript
server: {
  url: 'https://mornfront-xxx.tcb.qcloud.la',  // 替换为您的 CloudBase URL
}
```

或者使用环境变量：
```bash
# 创建 .env.local
CAPACITOR_SERVER_URL=https://mornfront-xxx.tcb.qcloud.la
```

---

### **第三步：同步并构建 Android APP**

修改配置后，重新构建 APP：

```bash
# 1. 同步配置到 Android 项目
npx cap sync android

# 2. 构建 Debug APK（测试用）
cd android
./gradlew assembleDebug

# 或者构建 Release APK（正式发布）
./gradlew assembleRelease
```

---

## 📲 两种部署方式对比

### **方式 1：本地开发（开发阶段）**
```bash
# 电脑上运行开发服务器
npm run dev

# APP 配置
url: 'http://10.0.2.2:3000'

# 特点
✅ 实时更新，修改代码立即生效
✅ 方便调试
❌ 需要电脑和手机在同一网络
```

### **方式 2：连接 CloudBase（生产环境）**
```bash
# 网站部署到 CloudBase
npm run build
cloudbase deploy

# APP 配置
url: 'https://mornfront-xxx.tcb.qcloud.la'

# 特点
✅ 独立运行，不需要电脑
✅ 用户可以正常使用
✅ 可以发布到应用商店
❌ 修改代码需要重新部署和构建
```

---

## 🎯 推荐部署流程

### **开发阶段**
```typescript
// capacitor.config.ts
url: 'http://10.0.2.2:3000'  // 本地开发
```

### **测试阶段**
```typescript
// capacitor.config.ts
url: 'https://test.mornfront.com'  // 测试环境
```

### **生产阶段**
```typescript
// capacitor.config.ts
url: 'https://mornfront-xxx.tcb.qcloud.la'  // CloudBase 生产环境
```

---

## 🔄 切换环境的快速方法

### **方法 1：环境变量**
```bash
# 开发环境
set CAPACITOR_SERVER_URL=http://10.0.2.2:3000

# 生产环境
set CAPACITOR_SERVER_URL=https://mornfront-xxx.tcb.qcloud.la
```

### **方法 2：修改配置文件**
直接编辑 `capacitor.config.ts`，然后运行：
```bash
npx cap sync android
```

---

## 📦 APK 文件位置

构建完成后，APK 文件位置：

- **Debug 版本**：`android/app/build/outputs/apk/debug/app-debug.apk`
- **Release 版本**：`android/app/build/outputs/apk/release/app-release.apk`

---

## 🚀 安装到手机

### **方法 1：USB 连接**
```bash
# 启用 USB 调试后
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### **方法 2：直接传输**
1. 将 APK 文件复制到手机
2. 在手机上打开文件管理器
3. 点击 APK 文件安装

---

## ⚠️ 重要提示

1. **首次部署**：先部署网站到 CloudBase，再构建 Android APP
2. **更新 APP**：网站更新后，APP 会自动加载最新内容
3. **网络安全**：确保 CloudBase 配置了 HTTPS
4. **应用商店**：发布到应用商店需要使用 Release 版本和签名

---

## 📞 常见问题

### **Q: APP 无法连接到网站？**
A: 检查以下几点：
- 确认 URL 配置正确
- 检查手机网络连接
- 确认 CloudBase 网站可访问
- 查看Android APP 日志：`adb logcat`

### **Q: 如何测试生产环境？**
A:
1. 部署到 CloudBase
2. 修改 `capacitor.config.ts` 中的 URL
3. 运行 `npx cap sync android`
4. 重新构建并安装 APP

### **Q: 可以同时有开发和生产版本吗？**
A: 可以，使用不同的 `appId` 和 `appName`：
```typescript
// 开发版
appId: 'com.mornfront.app.dev'
appName: 'MornFront Dev'

// 生产版
appId: 'com.mornfront.app'
appName: 'MornFront'
```

---

## 📚 相关资源

- [Capacitor 文档](https://capacitorjs.com/docs)
- [CloudBase 部署指南](https://cloud.tencent.com/document/product/269)
- [Android 签名和发布](https://developer.android.com/studio/publish/app-signing)
