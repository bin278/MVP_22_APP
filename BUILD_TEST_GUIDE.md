# 🚀 构建 Android APP 并测试下载功能

## ✅ 前置准备完成

已完成的配置：
- ✅ 安装 `@capacitor/filesystem@8.0.0`
- ✅ 修改下载代码支持移动端
- ✅ 同步到 Android 项目

---

## 📱 构建和安装步骤

### **方式 1：构建 Debug APK（推荐用于测试）**

```bash
# 进入 Android 项目目录
cd android

# 构建 Debug APK
./gradlew assembleDebug

# APK 文件位置：
# android/app/build/outputs/apk/debug/app-debug.apk
```

### **方式 2：通过 USB 直接安装到手机**

```bash
# 1. 启用手机 USB 调试
# 设置 > 关于手机 > 连续点击"版本号" 7 次
# 设置 > 开发者选项 > USB 调试（开启）

# 2. 连接手机到电脑

# 3. 构建并安装
cd android
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### **方式 3：手动传输 APK**

```bash
# 1. 构建 APK
cd android
./gradlew assembleDebug

# 2. 找到 APK 文件
# 文件位置：app/build/outputs/apk/debug/app-debug.apk

# 3. 通过以下方式传输到手机：
#    - USB 数据线复制
#    - 微信/QQ 发送
#    - 云盘同步

# 4. 在手机上点击 APK 文件安装
```

---

## 🧪 测试下载功能

### **测试步骤**

1. **打开 APP**
   - 启动安装好的 MornFront APP
   - 允许必要的权限（存储权限）

2. **生成代码**
   - 输入提示词，例如："创建一个待办事项列表"
   - 点击"生成应用"
   - 等待代码生成完成

3. **测试下载**
   - 点击"Download ZIP"按钮
   - **预期结果**：
     - 弹出提示："文件已保存到: ..."
     - 提示显示文件路径
     - 无错误信息

4. **验证文件**
   - 打开手机的"文件管理器"
   - 导航到"文档"文件夹
   - 查找下载的 ZIP 文件
   - **预期结果**：文件存在且可以正常解压

---

## 📂 下载文件位置

### **Android 10 及以下**
```
/storage/emulated/0/Documents/{project-name}.zip
```

### **Android 11 及以上**
```
/storage/emulated/0/Documents/{project-name}.zip
```
或通过应用沙盒：
```
/storage/emulated/0/Android/data/com.mornfront.app/files/Documents/{project-name}.zip
```

### **通过文件管理器访问**
1. 打开"文件管理器"应用
2. 导航到"文档"或"Documents"文件夹
3. 查找以项目名称命名的 ZIP 文件

---

## 🐛 常见问题排查

### **问题 1：下载按钮无响应**
**可能原因**：
- APP 版本未更新
- 未安装 `@capacitor/filesystem` 插件

**解决方案**：
```bash
# 重新同步和构建
npx cap sync android
cd android
./gradlew clean
./gradlew assembleDebug
```

### **问题 2：下载失败提示错误**
**可能原因**：
- 存储权限未授予
- 文件系统访问受限

**解决方案**：
1. 检查 APP 权限：设置 > 应用 > MornFront > 权限
2. 确保"存储"权限已开启
3. 如果仍然失败，重启 APP

### **问题 3：找不到下载的文件**
**可能原因**：
- 文件保存在其他位置
- 文件管理器未刷新

**解决方案**：
1. 检查弹出的文件路径提示
2. 使用文件管理器的搜索功能搜索 ZIP 文件
3. 连接电脑，使用 `adb shell` 查找：
   ```bash
   adb shell
   find /storage -name "*.zip" -type f
   ```

### **问题 4：ZIP 文件损坏无法解压**
**可能原因**：
- Base64 转换失败
- 写入时出错

**解决方案**：
1. 检查 APP 日志：
   ```bash
   adb logcat | grep -i "download\|error"
   ```
2. 如果有错误，降级到文本文件格式会自动触发

---

## 📊 测试检查清单

### **功能测试**
- [ ] 生成代码成功
- [ ] 点击"Download ZIP"按钮有响应
- [ ] 弹出文件保存位置提示
- [ ] 无错误提示
- [ ] 文件可以在文件管理器中找到
- [ ] ZIP 文件可以正常解压
- [ ] 解压后的文件完整

### **兼容性测试**
- [ ] Android 10 测试通过
- [ ] Android 11 测试通过
- [ ] Android 12 测试通过
- [ ] Android 13 测试通过
- [ ] Android 14 测试通过

### **性能测试**
- [ ] 下载速度正常（< 5秒）
- [ ] APP 下载时无卡顿
- [ ] 内存占用正常（< 200MB）
- [ ] 无崩溃或重启

---

## 🎯 成功标准

✅ **下载功能正常工作的标志**：
1. 点击下载按钮后显示文件保存路径
2. 文件可以在文件管理器中找到
3. ZIP 文件可以正常解压
4. 解压后的代码文件完整可用

---

## 📝 测试报告模板

测试完成后，请记录：

```
测试日期：YYYY-MM-DD
测试设备：[手机型号] [Android 版本]
测试结果：
- 下载功能：✅/❌
- 文件完整性：✅/❌
- 遇到的问题：[描述]
解决方法：[描述]
```

---

## 🔗 相关文档

- [MOBILE_DOWNLOAD_FIX.md](./MOBILE_DOWNLOAD_FIX.md) - 详细修复说明
- [ANDROID_DEPLOY_GUIDE.md](./ANDROID_DEPLOY_GUIDE.md) - Android 部署指南
- [Capacitor Filesystem 文档](https://capacitorjs.com/docs/apis/filesystem)

---

**文档更新时间**: 2026-01-03
**状态**: 待测试
