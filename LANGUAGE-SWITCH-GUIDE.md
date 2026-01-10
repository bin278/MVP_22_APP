# 中英文切换功能实现指南

## ✅ 已完成的组件

### 1. 语言上下文 ([lib/language-context.tsx](lib/language-context.tsx))
```typescript
export type Language = 'zh' | 'en'

export function useLanguage() {
  const { language, setLanguage, t } = useLanguage()
  return { language, setLanguage, t }
}
```

### 2. 语言切换按钮 ([components/language-toggle.tsx](components/language-toggle.tsx))
```tsx
<LanguageToggle />
```

### 3. Layout集成 ([app/layout.tsx](app/layout.tsx))
```tsx
<LanguageProvider>
  {children}
</LanguageProvider>
```

## 🔄 需要更新的文件

### 登录页面 ([app/login/page.tsx](app/login/page.tsx))

#### 添加导入
```typescript
import { useLanguage } from '@/lib/language-context'
import { LanguageToggle } from '@/components/language-toggle'
```

#### 在组件中使用
```typescript
const { t } = useLanguage()
```

#### 更新文本内容

**标题和描述:**
```tsx
<CardTitle>{t('login.title')}</CardTitle>
<CardDescription>{t('login.description')}</CardDescription>
```

**表单字段:**
```tsx
<Label htmlFor="email">{t('login.email')}</Label>
<Input placeholder={t('login.emailPlaceholder')} />

<Label htmlFor="password">{t('login.password')}</Label>
<Input placeholder={t('login.passwordPlaceholder')} />
```

**按钮:**
```tsx
<Button>{isLoading ? t('login.signingIn') : t('login.signIn')}</Button>
```

**社交登录:**
```tsx
<span>{isWechatLoading ? t('login.connecting') : t('login.continueWithWeChat')}</span>
<span>{isGoogleLoading ? t('login.connecting') : t('login.continueWithGoogle')}</span>
```

**条款复选框:**
```tsx
<label>
  {t('login.agreeTerms')}{" "}
  <Link href="/terms">{t('login.termsOfService')}</Link>{" "}
  {t('login.and')}{" "}
  <Link href="/privacy">{t('login.privacyPolicy')}</Link>
</label>
```

**底部链接:**
```tsx
<Link href="/register">{t('login.signUp')}</Link>
```

**添加语言切换按钮:**
```tsx
<div className="min-h-screen ... relative">
  <div className="absolute top-4 right-4">
    <LanguageToggle />
  </div>
  <Card>...</Card>
</div>
```

### 注册页面 ([app/register/page.tsx](app/register/page.tsx))

同样的修改,使用 `register.*` 翻译键。

### Header组件 ([components/header.tsx](components/header.tsx))

在导航栏添加语言切换:
```tsx
<LanguageToggle />
```

## 📝 翻译键列表

### 登录页面
- `login.title` - "欢迎回来" / "Welcome Back"
- `login.description` - "登录到您的..." / "Sign in to your..."
- `login.email` - "邮箱" / "Email"
- `login.emailPlaceholder` - "输入您的邮箱" / "Enter your email"
- `login.password` - "密码" / "Password"
- `login.passwordPlaceholder` - "输入您的密码" / "Enter your password"
- `login.signIn` - "登录" / "Sign In"
- `login.signingIn` - "登录中..." / "Signing in..."
- `login.forgotPassword` - "忘记密码?" / "Forgot your password?"
- `login.noAccount` - "还没有账户?" / "Don't have an account?"
- `login.signUp` - "立即注册" / "Sign up"
- `login.orContinueWith` - "或通过以下方式继续" / "Or continue with"
- `login.continueWithWeChat` - "使用微信登录" / "Continue with WeChat"
- `login.continueWithGoogle` - "使用 Google 登录" / "Continue with Google"
- `login.connecting` - "连接中..." / "Connecting..."
- `login.agreeTerms` - "我同意" / "I agree to the"
- `login.and` - "和" / "and"
- `login.termsOfService` - "服务条款" / "Terms of Service"
- `login.privacyPolicy` - "隐私政策" / "Privacy Policy"
- `login.mustAcceptTerms` - "请先同意..." / "Please accept the..."

### 注册页面
- `register.title` - "创建账户" / "Create Account"
- `register.description` - "加入 CodeGen AI..." / "Join CodeGen AI..."
- `register.fullName` - "全名" / "Full Name"
- `register.fullNamePlaceholder` - "输入您的全名" / "Enter your full name"
- `register.signUp` - "注册账户" / "Sign Up"
- `register.signingUp` - "注册中..." / "Signing up..."
- `register.hasAccount` - "已有账户？" / "Already have an account?"
- `register.signIn` - "立即登录" / "Sign in"
- `register.orSignUpWith` - "或通过以下方式注册" / "Or sign up with"
- 其他同登录页面

## 🎨 使用示例

### 在任何页面中使用

```tsx
"use client"

import { useLanguage } from '@/lib/language-context'
import { LanguageToggle } from '@/components/language-toggle'

export default function MyPage() {
  const { t, language } = useLanguage()

  return (
    <div>
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>

      <h1>{t('common.title')}</h1>
      <p>{t('common.description')}</p>

      <p>当前语言: {language === 'zh' ? '中文' : 'English'}</p>
    </div>
  )
}
```

### 动态切换语言

```tsx
const { setLanguage, t } = useLanguage()

const switchToEnglish = () => setLanguage('en')
const switchToChinese = () => setLanguage('zh')

// 或使用按钮
<button onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}>
  {language === 'zh' ? 'Switch to English' : '切换到中文'}
</button>
```

## 🔧 高级功能

### 1. 添加更多翻译

在 `lib/language-context.tsx` 的 `translations` 对象中添加:

```typescript
zh: {
  'page.title': '页面标题',
  'page.subtitle': '页面副标题',
},
en: {
  'page.title': 'Page Title',
  'page.subtitle': 'Page Subtitle',
}
```

### 2. 嵌套翻译键

```typescript
t('user.profile.title') // 访问嵌套的翻译
```

需要更新翻译结构:
```typescript
zh: {
  'user.profile.title': '用户资料',
}
```

### 3. 动态参数

```typescript
// 翻译函数支持
const t = (key: string, params?: Record<string, string>) => {
  let value = translations[language]
  // ...
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, v)
    })
  }
  return value
}

// 使用
t('welcome', { name: 'John' }) // "Welcome, John!"
```

### 4. 日期/数字格式化

```typescript
import { formatDate, formatNumber } from '@/lib/format'

const formattedDate = formatDate(new Date(), language)
const formattedNumber = formatNumber(1234.56, language)
```

## 📱 用户体验

### 切换效果
- ✅ 点击按钮立即切换所有文本
- ✅ 语言设置保存到 localStorage
- ✅ 刷新页面后保持语言选择
- ✅ 所有页面同步语言状态

### 默认语言
```typescript
const [language, setLanguageState] = useState<Language>('zh') // 默认中文
```

## 🧪 测试

### 测试清单
- [ ] 点击语言切换按钮
- [ ] 检查所有文本是否正确翻译
- [ ] 刷新页面后语言保持
- [ ] 注册页面同样支持
- [ ] 错误提示信息也翻译

### 手动测试步骤
1. 启动开发服务器
2. 访问登录页面
3. 点击右上角的语言按钮
4. 检查所有文本是否切换
5. 刷新页面
6. 确认语言保持不变

## 🌍 未来扩展

### 支持更多语言

```typescript
export type Language = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr'
```

### RTL支持

```typescript
const dir = language === 'ar' ? 'rtl' : 'ltr'
<html lang={language} dir={dir}>
```

### 自动检测

```typescript
const [language, setLanguageState] = useState<Language>(() => {
  const browserLang = navigator.language.split('-')[0]
  return browserLang === 'zh' ? 'zh' : 'en'
})
```

## 📚 相关文档

- [Next.js国际化文档](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [React Context API](https://react.dev/reference/react/useContext)
- [localStorage最佳实践](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

**状态**: 🟡 进行中 - 需要更新登录和注册页面的文本
