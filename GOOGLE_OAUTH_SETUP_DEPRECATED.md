# Google OAuth 配置指南 (已弃用)

> **注意：** 该文档已弃用。项目已不再支持Google登录功能。如需第三方登录，请使用微信登录。

# Google OAuth 配置指南

## 问题排查

如果你遇到 `400 (Bad Request)` 错误，通常是因为 Google OAuth 配置不正确。

## 配置步骤

### 1. 在 Google Cloud Console 中配置 OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API：
   - 进入 **APIs & Services** → **Library**
   - 搜索 "Google+ API" 或 "Google Identity"
   - 点击启用
4. 创建 OAuth 2.0 凭据：
   - 进入 **APIs & Services** → **Credentials**
   - 点击 **Create Credentials** → **OAuth client ID**
   - 如果提示配置 OAuth 同意屏幕，先完成配置：
     - 选择 **External**（外部用户）
     - 填写应用名称、用户支持电子邮件等
     - 添加你的电子邮件到测试用户（开发阶段）
   - 应用类型选择 **Web application**
   - 名称：`CodeGen AI`（或你喜欢的名称）
   - **Authorized redirect URIs** 添加：
     ```
     https://ctiydmjqhxmtjwmrilip.supabase.co/auth/v1/callback
     ```
     ⚠️ **重要**：这是 Supabase 的回调 URL，不是你的应用 URL！
   - 点击 **Create**
5. 复制 **Client ID** 和 **Client Secret**

### 2. 在 Supabase Dashboard 中配置 Google Provider

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Authentication** → **Providers**
4. 找到 **Google** 提供商
5. 点击 **Enable Google**
6. 填入从 Google Cloud Console 获取的信息：
   - **Client ID (for OAuth)**: 粘贴你的 Google Client ID
   - **Client Secret (for OAuth)**: 粘贴你的 Google Client Secret
7. 点击 **Save**

### 3. 检查重定向 URL

Supabase 会自动处理重定向，但需要确保：

- **Supabase 项目 URL**: `https://ctiydmjqhxmtjwmrilip.supabase.co`
- **回调 URL**: `https://ctiydmjqhxmtjwmrilip.supabase.co/auth/v1/callback`

这个 URL 必须添加到 Google Cloud Console 的 **Authorized redirect URIs** 中。

### 4. 常见问题

#### 问题 1: 400 Bad Request
**原因**：
- Google Client ID 或 Client Secret 不正确
- 重定向 URI 未在 Google Cloud Console 中配置
- Supabase 中的 Google Provider 未启用

**解决方案**：
1. 检查 Google Cloud Console 中的 Client ID 和 Secret 是否正确
2. 确保重定向 URI `https://ctiydmjqhxmtjwmrilip.supabase.co/auth/v1/callback` 已添加到 Google Cloud Console
3. 检查 Supabase Dashboard 中 Google Provider 是否已启用

#### 问题 2: redirect_uri_mismatch
**原因**：Google Cloud Console 中的重定向 URI 与 Supabase 的回调 URL 不匹配

**解决方案**：
- 确保 Google Cloud Console 中的 **Authorized redirect URIs** 包含：
  ```
  https://ctiydmjqhxmtjwmrilip.supabase.co/auth/v1/callback
  ```
- 注意：不要添加 `http://localhost:3000/auth/callback`，那是你的应用回调，不是 Supabase 的回调

#### 问题 3: OAuth consent screen 未配置
**原因**：Google Cloud Console 要求先配置 OAuth 同意屏幕

**解决方案**：
1. 在 Google Cloud Console 中进入 **APIs & Services** → **OAuth consent screen**
2. 选择 **External**（外部用户）
3. 填写必填字段：
   - App name: `CodeGen AI`
   - User support email: 你的邮箱
   - Developer contact information: 你的邮箱
4. 添加测试用户（开发阶段）
5. 保存并继续

### 5. 测试配置

配置完成后：

1. 重启开发服务器（如果正在运行）
2. 访问登录页面
3. 点击 "Continue with Google" 按钮
4. 应该会跳转到 Google 授权页面
5. 授权后会自动返回应用并登录

## 重要提示

- **Supabase 回调 URL** 格式：`https://[your-project-id].supabase.co/auth/v1/callback`
- **应用回调 URL**（在代码中）：`http://localhost:3000/auth/callback`（开发环境）
- 这两个 URL 是不同的：
  - Supabase 回调 URL → 用于 Google → Supabase 的 OAuth 流程
  - 应用回调 URL → 用于 Supabase → 应用的会话交换

## 参考链接

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Provider](https://supabase.com/docs/guides/auth/social-login/auth-google)





















