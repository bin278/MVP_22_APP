# 📱 安装 APK 到手机的完整指南

## ✅ 准备工作已完成

- ✅ APP 配置已切换到生产环境 (`https://mornfront.mornscience.top`)
- ✅ 配置已同步到 Android
- ✅ 网络访问配置正常
- ✅ 下载功能已实现

---

## 🚀 方法 1：Android Studio + USB（最推荐）

### **步骤 1：手机启用开发者选项**

1. **打开手机设置**
2. **找到"关于手机"**
3. **连续点击"版本号" 7 次** - 会提示"您已成为开发者"
4. **返回设置主界面** - 找到"开发者选项"或"系统" > "开发者选项"
5. **开启以下选项**：
   - ✅ USB 调试
   - ✅ USB 安装（如果有）
   - ✅ 仅充电模式下允许 USB 调试（建议）

### **步骤 2：连接手机到电脑**

1. **用 USB 数据线连接手机和电脑**
2. **手机屏幕会弹出授权提示**：
   - "允许 USB 调试吗？"
   - 勾选"始终允许来自这台计算机"
   - 点击"允许"

### **步骤 3：在电脑上验证连接**

在 PowerShell 中运行：

```powershell
adb devices
```

**正常输出：**
```
List of devices attached
XXXXXXXXXX    device
```

如果显示 `unauthorized`，需要在手机上重新授权。

### **步骤 4：在 Android Studio 中安装**

1. **打开 Android Studio**
2. **顶部工具栏** - 点击设备选择器下拉菜单
3. **选择您的手机**（而不是模拟器）
4. **点击绿色的 ▶️ 按钮**
5. **等待安装完成** - APP 会自动启动

---

## 🚀 方法 2：手动传输 APK 文件

### **步骤 1：构建 APK**

在 Android Studio Terminal 中运行：

```powershell
cd android
./gradlew assembleDebug
```

**构建时间：** 2-5 分钟

**APK 文件位置：**
```
F:\project1\APP\11\android\app\build\outputs\apk\debug\app-debug.apk
```

### **步骤 2：传输到手机**

#### **方式 A：微信/QQ（推荐）**

1. **在电脑上打开微信**
2. **找到"文件传输助手"**
3. **点击"+" > "文件"**
4. **选择 APK 文件**：
   ```
   F:\project1\APP\11\android\app\build\outputs\apk\debug\app-debug.apk
   ```
5. **发送**
6. **在手机微信中打开文件传输助手**
7. **点击文件** - 会提示"无法安装此应用"
8. **点击"设置"** - 允许安装来自此来源的应用
9. **返回再次点击文件** - 开始安装

#### **方式 B：USB 复制**

1. **连接手机到电脑**
2. **在"此电脑"中找到手机设备**
3. **进入内部存储 > Download 文件夹**
4. **复制 APK 文件到此文件夹**
5. **在手机上打开"文件管理器"**
6. **进入"下载"文件夹**
7. **点击 APK 文件** - 开始安装

#### **方式 C：云盘（百度网盘/OneDrive）**

1. **上传 APK 到云盘**
2. **在手机上打开云盘 APP**
3. **下载 APK 文件**
4. **点击安装**

---

## ⚠️ 安装时可能遇到的问题

### **问题 1：提示"安装被阻止"**

**原因：** 手机禁止安装未知来源应用

**解决：**
1. **点击"设置"**
2. **允许"安装未知应用"或"来自此来源的应用"**
3. **返回重新安装**

### **问题 2：ADB 无法识别手机**

**检查清单：**
- [ ] USB 调试已开启
- [ ] 已授权电脑调试
- [ ] USB 数据线正常（尝试换一根）
- [ ] USB 接口正常（尝试换个接口）
- [ ] 手机已解锁屏幕

**解决：**
```powershell
# 重启 ADB 服务
adb kill-server
adb start-server
adb devices
```

### **问题 3：构建失败**

**如果 Gradle 构建失败，可能是因为 Java 版本。**

**解决方案：** 使用 Android Studio 构建
1. 打开 Android Studio
2. 打开 `F:\project1\APP\11\android` 项目
3. 点击 `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
4. 等待构建完成
5. 点击通知中的 "locate" 查看 APK 位置

---

## 📱 安装后首次使用

### **授权存储权限（重要！）**

1. **打开 APP**
2. **会请求存储权限**
3. **点击"允许"** - 下载功能需要
4. **如果没提示，手动设置**：
   - 设置 > 应用 > MornFront > 权限
   - 允许"存储"

### **测试下载功能**

1. **在 APP 中生成代码**
2. **点击 "Download ZIP"**
3. **应该弹出提示**："文件已保存到: ..."
4. **打开文件管理器** > "Documents" 文件夹
5. **验证文件存在**

---

## 🎯 快速命令参考

### **构建并安装（通过 USB）**

```powershell
# 1. 检查连接
adb devices

# 2. 构建
cd android
./gradlew assembleDebug

# 3. 安装
adb install app/build/outputs/apk/debug/app-debug.apk

# 4. 启动
adb shell am start -n com.mornfront.app/.MainActivity
```

### **查看实时日志**

```powershell
adb logcat | grep -i "mornfront"
```

### **卸载旧版本**

```powershell
adb uninstall com.mornfront.app
```

### **清除应用数据**

```powershell
adb shell pm clear com.mornfront.app
```

---

## 📊 当前配置信息

- **APP 名称**: MornFront
- **包名**: com.mornfront.app
- **版本**: 1.0.0 (debug)
- **连接地址**: https://mornfront.mornscience.top
- **功能**:
  - ✅ 网络访问正常
  - ✅ 下载功能已实现
  - ✅ 存储权限已配置

---

## 🔧 开发/生产环境切换

### **切换到本地开发**

临时使用（不修改文件）：
```powershell
$env:CAPACITOR_SERVER_URL="http://10.0.2.2:3000"
npx cap sync android
```

### **切换回生产环境**

临时使用：
```powershell
$env:CAPACITOR_SERVER_URL="https://mornfront.mornscience.top"
npx cap sync android
```

或直接使用当前配置（默认生产环境）

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 具体的错误信息
2. 使用的方法（USB/微信/云盘）
3. 手机型号和 Android 版本
4. 错误发生的步骤

---

**更新时间**: 2026-01-04
**配置状态**: ✅ 生产环境
**下载功能**: ✅ 已实现
