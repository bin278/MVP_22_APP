# 微信小程序网页端适配完成

## ✅ 已完成的工作

网页端已完成微信小程序登录适配，所有必需的文件和配置已创建完成。

### 📁 已创建的文件

#### 1. API 接口
- [app/api/wxlogin/check/route.ts](app/api/wxlogin/check/route.ts) - 用户预检查 API，消耗 code 返回 token
- [app/api/auth/mp-callback/route.ts](app/api/auth/mp-callback/route.ts) - 小程序回调 API，设置 cookie 并更新用户资料

#### 2. 工具库
- [lib/wechat-mp.ts](lib/wechat-mp.ts) - 微信小程序工具库，包含环境检测、参数解析等功能

#### 3. 组件
- [components/mp-link-interceptor.tsx](components/mp-link-interceptor.tsx) - 外部链接拦截器组件

#### 4. 环境变量
- `.env.local` - 已添加微信小程序配置项

### 🎯 核心功能

1. **微信登录 API** - 处理小程序 code 换取 token
2. **回调处理 API** - 设置 cookie 并更新用户资料
3. **环境检测** - 自动识别是否在小程序环境中
4. **登录回调解析** - 解析 URL 参数中的登录信息
5. **外部链接拦截** - 自动拦截外部链接并跳转到小程序复制页面

## 📝 配置步骤

### 1. 配置环境变量

打开 `.env.local` 文件，修改以下配置：

```bash
# 微信小程序配置
WX_MINI_APPID=wx1234567890abcdef  # ⚠️ 改为你的小程序 AppID
WX_MINI_SECRET=your_app_secret_here  # ⚠️ 改为你的小程序 Secret
```

**获取方式：**
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「开发」→「开发管理」→「开发设置」
3. 复制 AppID 和 AppSecret

### 2. 修改小程序配置

打开 [wechat/appConfig.js](wechat/appConfig.js)，修改以下配置：

```javascript
module.exports = {
  general: {
    initialUrl: 'https://your-website.com',  // ⚠️ 改为你的实际网址
    appName: 'MornClient',                    // ⚠️ 改为你的应用名称
    appId: 'wx1234567890abcdef',              // ⚠️ 改为你的小程序 AppID（与环境变量一致）
    version: '1.0.0',
  },
};
```

### 3. 配置业务域名

在微信公众平台后台配置：
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入「开发」→「开发管理」→「开发设置」
3. 在「业务域名」中添加你的网站域名（必须是 HTTPS）

### 4. 在登录组件中集成小程序登录

在你的登录页面组件中添加以下代码：

```typescript
import { useEffect, useCallback, useState } from "react";
import {
  isMiniProgram,
  parseWxMpLoginCallback,
  clearWxMpLoginParams,
  requestWxMpLogin,
} from "@/lib/wechat-mp";

// 在组件内：
const [isInMiniProgram, setIsInMiniProgram] = useState(false);

// 1. 检测小程序环境
useEffect(() => {
  setIsInMiniProgram(isMiniProgram());
}, []);

// 2. 处理登录回调
const handleMpLoginCallback = useCallback(async () => {
  const callback = parseWxMpLoginCallback();
  if (!callback || !callback.token || !callback.openid) return;

  try {
    const res = await fetch("/api/auth/mp-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: callback.token,
        openid: callback.openid,
        expiresIn: callback.expiresIn,
        nickName: callback.nickName,
        avatarUrl: callback.avatarUrl,
      }),
    });

    if (res.ok) {
      clearWxMpLoginParams();
      window.location.reload();
    }
  } catch (error) {
    console.error("MP login callback error:", error);
    clearWxMpLoginParams();
  }
}, []);

useEffect(() => {
  handleMpLoginCallback();
}, [handleMpLoginCallback]);

// 3. 微信登录按钮点击
const handleWechatLogin = () => {
  if (isInMiniProgram) {
    requestWxMpLogin();
  } else {
    // PC/手机浏览器：跳转扫码登录
    window.location.href = "/api/auth/wechat/qrcode";
  }
};
```

### 5. 在根布局中添加链接拦截器

打开 `app/layout.tsx`，添加链接拦截器组件：

```tsx
import { MpLinkInterceptor } from "@/components/mp-link-interceptor";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MpLinkInterceptor />
        {children}
      </body>
    </html>
  );
}
```

## 🚀 测试步骤

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 使用微信开发者工具测试

1. 打开微信开发者工具
2. 导入 `wechat` 文件夹
3. 填入你的小程序 AppID
4. 测试登录流程：
   - 老用户：应该一键登录成功
   - 新用户：应该跳转到资料填写页面

### 3. 验证清单

- [ ] 环境变量已配置（WX_MINI_APPID 和 WX_MINI_SECRET）
- [ ] 小程序 appConfig.js 已配置
- [ ] 业务域名已在微信公众平台配置
- [ ] `/api/wxlogin/check` 接口正常返回
- [ ] `/api/auth/mp-callback` 接口正常设置 cookie
- [ ] 老用户可以一键登录
- [ ] 新用户可以填写资料后登录
- [ ] Cookie 正确设置（DevTools → Application → Cookies）
- [ ] 外部链接拦截正常工作

## 📚 相关文档

- [小程序 README](wechat/README.md) - 完整的使用说明和适配指南
- [小程序配置说明](wechat/SETUP.md) - 小程序端配置步骤

## ⚠️ 注意事项

1. **AppID 必须一致** - 小程序配置和服务端环境变量中的 AppID 必须相同
2. **HTTPS 必须启用** - 小程序只能访问 HTTPS 网站
3. **业务域名必须配置** - 否则 WebView 无法加载网页
4. **Secret 保密** - WX_MINI_SECRET 不要提交到代码仓库

## 🔧 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 登录后仍显示未登录 | mp-callback 未正确设置 cookie | 检查 API 响应和 cookie 参数 |
| code 无效错误 | AppID 不一致或 code 已被消耗 | 确保小程序和服务端 AppID 一致 |
| 配置错误提示 | 环境变量未设置 | 检查 .env.local 文件 |
| WebView 无法加载 | 业务域名未配置 | 在微信公众平台配置业务域名 |

---

✅ 网页端适配已完成！现在可以在微信开发者工具中测试小程序登录功能了。
