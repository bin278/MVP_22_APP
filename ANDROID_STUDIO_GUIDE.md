# 📱 Android Studio 模拟器使用指南

## ✅ 当前状态

- ✅ 网络配置已修复
- ✅ 下载功能已实现
- ⏳ 需要重新构建 APK（包含网络修复）

---

## 🚀 在 Android Studio 中构建和运行

### **方法 1：使用 Android Studio 图形界面（推荐）**

#### **步骤 1：打开项目**
1. 打开 Android Studio
2. 点击 `File` > `Open`
3. 导航到 `f:\project1\APP\11\android`
4. 点击 `OK`

#### **步骤 2：同步 Gradle**
1. Android Studio 会自动提示 "Gradle sync needed"
2. 点击 `Sync Now`
3. 等待同步完成（右下角显示进度）

#### **步骤 3：选择模拟器**
1. 在顶部工具栏，找到设备选择器
2. 点击下拉菜单
3. 选择您的模拟器（例如：`Pixel_5_API_33`）

**如果没有模拟器，创建一个：**
1. 点击设备选择器 > `Device Manager`
2. 点击 `Create Device`
3. 选择设备（推荐：Pixel 5）
4. 选择系统镜像（推荐：API 33 或更高）
5. 点击 `Finish`

#### **步骤 4：运行应用**
1. 确保选择了正确的模块：`app`
2. 点击绿色的运行按钮 ▶️（或按 `Shift + F10`）
3. 选择 `app` > `Debug 'app'`
4. 等待应用安装到模拟器

---

### **方法 2：使用 Android Studio 终端**

#### **在 Android Studio 底部打开 Terminal 标签页**

```bash
# 1. 清理旧的构建
./gradlew clean

# 2. 构建 Debug APK
./gradlew assembleDebug

# 3. 安装到模拟器
./gradlew installDebug

# 4. 启动应用
adb shell am start -n com.mornfront.app/.MainActivity
```

---

## 🔍 验证应用是否正确安装

### **检查应用安装**

在 Android Studio Terminal 中运行：

```bash
# 检查已安装的应用
adb shell pm list packages | grep mornfront

# 应该看到：
# package:com.mornfront.app
```

### **查看应用日志**

```bash
# 实时查看日志
adb logcat | grep -i "mornfront"

# 或者只看错误
adb logcat *:E
```

---

## 🧪 测试网络访问

### **1. 在模拟器浏览器中测试**

1. 在模拟器中打开 Chrome 浏览器
2. 访问：`https://mornfront.mornscience.top`
3. 确认网站可以正常访问

### **2. 启动 APP 测试**

```bash
# 在 Android Studio Terminal 中
adb shell am start -n com.mornfront.app/.MainActivity
```

**预期结果：**
- ✅ APP 启动
- ✅ 显示网站内容
- ✅ 没有"网页无法访问"错误
- ✅ 没有 SSL 证书错误

---

## 📱 测试下载功能

### **步骤：**

1. **在 APP 中生成代码**
   - 输入提示词
   - 点击"生成应用"
   - 等待生成完成

2. **点击下载按钮**
   - 点击 "Download ZIP"
   - 等待下载完成

3. **检查文件**
   ```bash
   # 查看文档文件夹
   adb shell ls -la /storage/emulated/0/Documents/

   # 或者搜索 ZIP 文件
   adb shell find /storage -name "*.zip" -type f
   ```

4. **拉取文件到电脑**
   ```bash
   # 从模拟器复制到电脑
   adb pull /storage/emulated/0/Documents/your-project.zip
   ```

---

## 🐛 调试技巧

### **1. 查看实时日志**

在 Android Studio 中：
1. 点击底部的 `Logcat` 标签
2. 在搜索框输入：`mornfront`
3. 查看相关日志

### **2. 网络调试**

```bash
# 查看 SSL/网络相关日志
adb logcat | grep -E "Network|SSL|Certificate|Capacitor"
```

### **3. 清除应用数据**

如果遇到问题，重置应用：

```bash
adb shell pm clear com.mornfront.app
```

### **4. 卸载应用**

```bash
adb uninstall com.mornfront.app
```

---

## ⚠️ 常见问题

### **Q1: 模拟器无法启动？**

**解决方案：**
1. 检查 HAXM 是否安装：`File` > `Settings` > `Appearance & Behavior` > `System Settings` > `Android SDK` > `SDK Tools`
2. 勾选 "Intel x86 Emulator Accelerator (HAXM installer)"
3. 安装后重启电脑

### **Q2: 应用安装失败？**

**检查：**
```bash
# 查看设备状态
adb devices

# 应该看到：
# List of devices attached
# emulator-5554   device
```

如果显示 `unauthorized`：
- 在模拟器中弹出授权对话框
- 点击 "OK"

### **Q3: APP 显示空白页面？**

**检查网络：**
```bash
# 在模拟器浏览器中访问网站
adb shell am start -a android.intent.action.VIEW -d "https://mornfront.mornscience.top"
```

如果浏览器可以访问但 APP 不行：
- 检查 `network_security_config.xml` 是否存在
- 重新构建 APK

### **Q4: 下载功能不工作？**

**检查权限：**
1. 在模拟器中：`Settings` > `Apps` > `MornFront` > `Permissions`
2. 确保 "Storage" 权限已开启

**查看日志：**
```bash
adb logcat | grep -i "download\|filesystem"
```

---

## 🔄 重新构建 APK（如果需要）

### **在 Android Studio 中：**

1. `Build` > `Clean Project`
2. `Build` > `Rebuild Project`
3. `Run` > `Run 'app'`

### **使用命令行：**

```bash
# 在 Android Studio Terminal 中
./gradlew clean
./gradlew assembleDebug

# APK 位置：
# app/build/outputs/apk/debug/app-debug.apk
```

---

## 📊 性能监控

### **查看内存使用**

```bash
# 查看应用内存
adb shell dumpsys meminfo com.mornfront.app
```

### **查看 CPU 使用**

```bash
# 查看应用 CPU
adb shell top -n 1 | grep mornfront
```

---

## 🎯 快速测试清单

- [ ] 模拟器正常启动
- [ ] APP 成功安装
- [ ] APP 启动并显示网站内容
- [ ] 登录功能正常
- [ ] 代码生成功能正常
- [ ] 下载功能正常
- [ ] 下载的文件可以找到
- [ ] 无崩溃或错误

---

## 📝 开发工作流

### **修改代码后的快速测试：**

1. **修改代码**（例如 `lib/download-helper.ts`）
2. **同步到 Android**：
   ```bash
   npx cap sync android
   ```
3. **在 Android Studio 中重新运行**
   - 点击 ▶️ 按钮

### **只修改前端代码：**

前端代码修改不需要重新构建 APK，刷新即可：
```bash
# 在模拟器中 APP 内下拉刷新
# 或者在电容应用中按 Ctrl+R
```

---

## 🚀 发布版本构建

如果要发布到应用商店：

```bash
# 在 Android Studio Terminal 中
./gradlew assembleRelease

# 位置：
# app/build/outputs/apk/release/app-release.apk
```

---

## 📞 获取帮助

如果遇到问题：

1. **查看 Logcat 日志**（最重要！）
2. **检查网络连接**
3. **确认权限已授予**
4. **尝试清除应用数据重试**

---

**文档更新时间**: 2026-01-03
**Android Studio 推荐版本**: Hedgehog (2023.1.1) 或更高
**最低 API 级别**: API 28 (Android 9)
