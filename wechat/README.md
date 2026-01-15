# MornClient 微信小程序模板

网页套壳微信小程序模板，支持集中配置管理。

---

## 配置说明

所有配置集中在 `appConfig.js`：

```javascript
module.exports = {
  general: {
    initialUrl: 'https://mornfront.mornscience.top',  // 目标网页 URL
    appName: '应用名称',
    appId: 'wx1234567890abcdef',              // 小程序 AppID
    version: '1.0.0',
  },
};
```

| 字段 | 说明 |
|------|------|
| `initialUrl` | 内嵌网页 URL |
| `appName` | 应用名称 |
| `appId` | 小程序 AppID |
| `version` | 版本号 |

## 项目结构

```
wechat/
├── app.js              // 小程序入口文件
├── app.json            // 小程序全局配置
├── app.wxss            // 全局样式
├── appConfig.js        // 集中配置管理
├── images/             // 图片资源
│   ├── logo.png        // 应用Logo
│   ├── default-avatar.png // 默认头像
│   ├── link-icon.png   // 链接图标
│   └── tabbar/         // 底部导航图标
│       ├── home.png
│       ├── home-active.png
│       ├── profile.png
│       └── profile-active.png
├── pages/              // 页面文件
│   ├── index/          // 首页
│   ├── privacy/        // 隐私政策
│   ├── qrcode/         // 链接复制页面
│   └── webshell/       // Web容器页面
│       ├── webshell.wxml
│       ├── webshell.js
│       ├── webshell.wxss
│       ├── login.wxml  // 登录页面
│       ├── login.js
│       ├── login.wxss
│       ├── profile.wxml // 用户资料页面
│       ├── profile.js
│       └── profile.wxss
├── project.config.json // 项目配置
└── project.private.config.json // 私有配置
```

## 功能特点

1. **微信小程序登录**：通过`wx.login()`获取code，调用后端接口换取token
2. **新用户资料完善**：为首次登录的小程序用户提供昵称和头像设置
3. **外部链接拦截**：在webview中拦截外部链接，引导用户复制后在浏览器打开
4. **Cookie设置**：通过API在webview上下文中设置认证cookie

## 后端API接口

- `/api/wxlogin/check` - 小程序登录检查接口
- `/api/auth/mp-callback` - 小程序回调接口，设置cookie并更新用户资料

## 前端工具库

- `lib/wechat-mp.ts` - 微信小程序工具函数
- `components/mp-link-interceptor.tsx` - 外部链接拦截组件

## 环境变量配置

在`.env.local`中配置：

```bash
# 微信小程序配置
WX_MINI_APPID=wx1234567890abcdef
WX_MINI_SECRET=your_app_secret_here

# 或使用通用配置
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_app_secret_here
```

## 部署说明

1. 将此小程序项目导入微信开发者工具
2. 修改`appConfig.js`中的配置项
3. 替换`images/`目录下的图标文件
4. 在微信公众平台配置业务域名
5. 上传并发布小程序

## 注意事项

1. 确保业务域名已在微信公众平台配置
2. 需要在服务器端实现相应的登录接口
3. 小程序AppID必须与服务端环境变量保持一致
4. 如果需要UnionID功能，需将小程序绑定到微信开放平台
