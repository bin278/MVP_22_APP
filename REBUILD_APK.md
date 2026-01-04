# 重新构建 APK 安装包

## 问题说明
状态栏遮挡问题已通过 CSS 修复。我们已经在 [app/globals.css:131](app/globals.css#L131) 中添加了 `padding-top: 63px`，这样所有内容都会向下偏移 63px，避开状态栏。

## 重新构建步骤

### 方法一：在 Android Studio 中构建（推荐）

1. **打开 Android Studio**
   - 启动 Android Studio
   - 选择 `File` → `Open`
   - 打开项目目录：`f:\project1\APP\11\android`

2. **同步 Gradle**
   - 等待 Android Studio 自动同步 Gradle
   - 或者点击：`File` → `Sync Project with Gradle Files`

3. **构建 APK**
   - 点击菜单：`Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - 等待构建完成（大约 1-3 分钟）

4. **找到 APK 文件**
   - 构建完成后，会弹出通知
   - 点击通知中的 `locate` 链接
   - 或者直接打开文件夹：`android/app/build/outputs/apk/debug/app-debug.apk`

5. **安装到手机**
   - 将 `app-debug.apk` 复制到手机
   - 在手机上点击文件进行安装
   - 如果已安装旧版本，需要先卸载

### 方法二：使用命令行构建

```bash
# 进入 Android 项目目录
cd f:\project1\APP\11\android

# Windows
gradlew.bat assembleDebug

# 或者如果配置了环境变量
./gradlew assembleDebug
```

构建完成后，APK 文件位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 验证修复

安装新 APK 后：

1. **打开 APP**
   - 启动应用后，顶部内容应该不再被状态栏遮挡
   - 所有按钮、文字、导航栏等应该完整显示

2. **检查日志（可选）**
   - 连接电脑，打开 Android Studio 的 Logcat
   - 搜索 `StatusBarPadding`，查看相关日志
   - 状态栏高度应该是 63px

## 如果问题仍然存在

如果新 APK 安装后顶部仍然被遮挡：

1. **增加 padding 值**
   - 编辑 [app/globals.css:131](app/globals.css#L131)
   - 将 `padding-top: 63px;` 改为更大的值，比如 `padding-top: 80px;`

2. **重新同步和构建**
   ```bash
   npx cap sync android
   # 然后在 Android Studio 中重新构建
   ```

3. **联系开发者**
   - 提供截图和手机型号
   - 在 Logcat 中查看状态栏高度（搜索 `WindowInsets`）

## 技术细节

修复原理：
- 在 CSS 的 `html` 元素上添加 `padding-top: 63px`
- 这个值来自 Android Logcat 日志：`statusBars:[0,63,0,0]`
- CSS 会在页面加载时立即生效，不需要 JavaScript
- 所有内容会自动向下偏移，避开状态栏

修改的文件：
- [app/globals.css](app/globals.css#L131) - 添加了 `padding-top: 63px`
