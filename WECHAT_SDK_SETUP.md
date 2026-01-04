# 微信 SDK 配置说明

## 已完成的配置

### 1. 安装插件
```bash
npm install @capgo/capacitor-wechat --legacy-peer-deps
npx cap sync android
```

### 2. Capacitor 配置
在 `capacitor.config.ts` 中已配置微信 AppID：
```typescript
plugins: {
  WeChat: {
    appId: process.env.WECHAT_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID || '',
    appName: 'mornfront',
    debug: false
  }
}
```

### 3. 登录逻辑
- **原生 APP**：使用微信 SDK 的 `sendAuthRequest` 方法
- **Web 端**：使用二维码扫码登录

## 需要在微信开放平台配置

### 1. 应用信息
- **应用包名**：`com.mornfront.app`
- **应用签名**：需要使用 keystore 的 MD5 签名

### 2. 获取应用签名

#### 调试版本（debug）签名：
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### 发布版本（release）签名：
```bash
keytool -list -v -keystore your-release.keystore
```

从输出中找到 `MD5`，去掉冒号并转为小写，这就是需要填入微信开放平台的签名。

### 3. 配置环境变量

确保项目中有以下环境变量：
- `WECHAT_APP_ID` 或 `NEXT_PUBLIC_WECHAT_APP_ID`
- `WECHAT_APP_SECRET`

## 测试流程

1. **在 Android Studio 中重新构建**
   - Build > Rebuild Project
   - Run > Run 'app'

2. **点击微信登录按钮**
   - 检测到在原生 APP 中运行
   - 调用 `WeChat.sendAuthRequest()`
   - 弹出微信授权页面
   - 用户授权后返回 code
   - 发送 code 到 `/api/auth/wechat/callback`
   - 完成登录

3. **查看日志**
   在 Chrome DevTools 中查看控制台日志：
   ```
   [WeChat Login] Detection: {...}
   [WeChat Login] Using native SDK
   [WeChat Login] SDK result: {...}
   ```

## 常见问题

### Q: 提示"微信 SDK 插件未安装"
A: 确保已运行 `npx cap sync android` 并重新构建

### Q: 微信授权页面不弹出
A: 检查微信开放平台是否配置了正确的包名和签名

### Q: 授权后提示"未获取到微信授权码"
A: 检查微信 AppID 是否正确配置

### Q: 回调时提示"微信登录失败"
A: 检查 `/api/auth/wechat/callback` 端点是否正常工作

## 相关文件

- `capacitor.config.ts` - Capacitor 配置
- `app/login/page.tsx` - 登录页面逻辑
- `app/api/auth/wechat/callback/route.ts` - 微信回调处理
- `android/app/src/main/AndroidManifest.xml` - Android 配置
