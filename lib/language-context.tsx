"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'zh' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 翻译字典
const translations = {
  zh: {
    // 登录页面
    'login.title': '欢迎回来',
    'login.description': '登录到您的 CodeGen AI 账户',
    'login.email': '邮箱',
    'login.emailPlaceholder': '输入您的邮箱',
    'login.password': '密码',
    'login.passwordPlaceholder': '输入您的密码',
    'login.signIn': '登录',
    'login.signingIn': '登录中...',
    'login.forgotPassword': '忘记密码?',
    'login.noAccount': '还没有账户?',
    'login.signUp': '立即注册',
    'login.orContinueWith': '或通过以下方式继续',
    'login.continueWithWeChat': '使用微信登录',
    'login.continueWithGoogle': '使用 Google 登录',
    'login.connecting': '连接中...',
    'login.agreeTerms': '我同意',
    'login.termsOfService': '服务条款',
    'login.privacyPolicy': '隐私政策',
    'login.mustAcceptTerms': '请先同意服务条款和隐私政策',
    'login.qrcodeError': '获取微信登录二维码失败',
    'login.unknownError': '未知错误',
    'login.noQrcode': '未获取到微信登录二维码',
    'login.wechatError': '微信登录过程中发生错误',
    'login.googleOnlyIntl': 'Google登录仅在 国际版中可用',
    'login.googleError': 'Google登录过程中发生错误',
    'login.resetPassword': '重置密码',
    'login.resetPasswordDescription': '输入您的邮箱地址,我们将向您发送重置密码的链接',
    'login.resetEmailSent': '密码重置邮件已发送!请检查您的收件箱',
    'login.sending': '发送中...',
    'login.sendResetLink': '发送重置链接',
    'login.backToLogin': '返回登录',

    // 注册页面
    'register.title': '创建账户',
    'register.description': '加入 CodeGen AI，开始构建精彩的 UI 界面',
    'register.fullName': '全名',
    'register.fullNamePlaceholder': '输入您的全名',
    'register.email': '邮箱',
    'register.emailPlaceholder': '输入您的邮箱',
    'register.password': '密码',
    'register.passwordPlaceholder': '请输入密码（至少6位）',
    'register.confirmPassword': '确认密码',
    'register.confirmPasswordPlaceholder': '请再次输入密码',
    'register.signUp': '注册账户',
    'register.signingUp': '注册中...',
    'register.hasAccount': '已有账户？',
    'register.signIn': '立即登录',
    'register.orSignUpWith': '或通过以下方式注册',
    'register.agreeTerms': '我同意',
    'register.termsOfService': '服务条款',
    'register.privacyPolicy': '隐私政策',
    'register.mustAcceptTerms': '请同意服务条款和隐私政策',
    'register.fillAllFields': '请填写所有字段',
    'register.passwordTooShort': '密码长度至少6位',
    'register.passwordMismatch': '两次密码输入不一致',
    'register.registrationFailed': '注册失败,请稍后重试',
    'register.successTitle': '注册成功!',
    'register.successMessage': '欢迎加入!您的账户已成功注册。',
    'register.successInfo': '您现在可以使用您的邮箱和密码登录系统。',
    'register.goToLogin': '前往登录',
    'register.continueWithWeChat': '使用微信注册',
    'register.continueWithGoogle': '使用 Google 注册',

    // 隐私政策
    'privacy.title': '隐私政策',
    'privacy.subtitle': '我们非常重视您的隐私保护和个人信息安全',
    'privacy.lastUpdated': '最后更新时间',
    'privacy.introduction.title': '引言',
    'privacy.information.title': '我们收集的信息',
    'privacy.usage.title': '信息使用方式',
    'privacy.sharing.title': '信息共享',
    'privacy.security.title': '数据安全',
    'privacy.rights.title': '您的权利',
    'privacy.retention.title': '数据保留',
    'privacy.children.title': '儿童隐私',
    'privacy.international.title': '国际用户',
    'privacy.changes.title': '政策变更',
    'privacy.contact.title': '联系我们',
    'privacy.footer.home': '返回首页',
    'privacy.footer.terms': '服务条款',
    'privacy.footer.login': '登录',

    // 通用
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.back': '返回',
    'common.next': '下一步',
    'common.submit': '提交',
  },
  en: {
    // Login page
    'login.title': 'Welcome Back',
    'login.description': 'Sign in to your CodeGen AI account',
    'login.email': 'Email',
    'login.emailPlaceholder': 'Enter your email',
    'login.password': 'Password',
    'login.passwordPlaceholder': 'Enter your password',
    'login.signIn': 'Sign In',
    'login.signingIn': 'Signing in...',
    'login.forgotPassword': 'Forgot your password?',
    'login.noAccount': "Don't have an account?",
    'login.signUp': 'Sign up',
    'login.orContinueWith': 'Or continue with',
    'login.continueWithWeChat': 'Continue with WeChat',
    'login.continueWithGoogle': 'Continue with Google',
    'login.connecting': 'Connecting...',
    'login.agreeTerms': 'I agree to the',
    'login.termsOfService': 'Terms of Service',
    'login.privacyPolicy': 'Privacy Policy',
    'login.mustAcceptTerms': 'Please accept the Terms of Service and Privacy Policy',
    'login.qrcodeError': 'Failed to get WeChat login QR code',
    'login.unknownError': 'Unknown error',
    'login.noQrcode': 'Failed to get WeChat login QR code',
    'login.wechatError': 'An error occurred during WeChat login',
    'login.googleOnlyIntl': 'Google login is only available in international version',
    'login.googleError': 'An error occurred during Google login',
    'login.resetPassword': 'Reset Password',
    'login.resetPasswordDescription': 'Enter your email address and we\'ll send you a link to reset your password',
    'login.resetEmailSent': 'Password reset email sent! Check your inbox',
    'login.sending': 'Sending...',
    'login.sendResetLink': 'Send Reset Link',
    'login.backToLogin': 'Back to Login',

    // Register page
    'register.title': 'Create Account',
    'register.description': 'Join CodeGen AI and start building amazing UI',
    'register.fullName': 'Full Name',
    'register.fullNamePlaceholder': 'Enter your full name',
    'register.email': 'Email',
    'register.emailPlaceholder': 'Enter your email',
    'register.password': 'Password',
    'register.passwordPlaceholder': 'Enter your password (at least 6 characters)',
    'register.confirmPassword': 'Confirm Password',
    'register.confirmPasswordPlaceholder': 'Confirm your password',
    'register.signUp': 'Sign Up',
    'register.signingUp': 'Signing up...',
    'register.hasAccount': 'Already have an account?',
    'register.signIn': 'Sign in',
    'register.orSignUpWith': 'Or sign up with',
    'register.agreeTerms': 'I agree to the',
    'register.termsOfService': 'Terms of Service',
    'register.privacyPolicy': 'Privacy Policy',
    'register.mustAcceptTerms': 'Please accept the Terms of Service and Privacy Policy',
    'register.fillAllFields': 'Please fill in all fields',
    'register.passwordTooShort': 'Password must be at least 6 characters',
    'register.passwordMismatch': 'Passwords do not match',
    'register.registrationFailed': 'Registration failed, please try again later',
    'register.successTitle': 'Registration Successful!',
    'register.successMessage': 'Welcome! Your account has been successfully registered.',
    'register.successInfo': 'You can now log in to the system with your email and password.',
    'register.goToLogin': 'Go to Login',
    'register.continueWithWeChat': 'Continue with WeChat',
    'register.continueWithGoogle': 'Continue with Google',

    // Privacy Policy
    'privacy.title': 'Privacy Policy',
    'privacy.subtitle': 'We highly value your privacy and personal information security',
    'privacy.lastUpdated': 'Last Updated',
    'privacy.introduction.title': 'Introduction',
    'privacy.information.title': 'Information We Collect',
    'privacy.usage.title': 'How We Use Your Information',
    'privacy.sharing.title': 'Information Sharing',
    'privacy.security.title': 'Data Security',
    'privacy.rights.title': 'Your Rights',
    'privacy.retention.title': 'Data Retention',
    'privacy.children.title': 'Children\'s Privacy',
    'privacy.international.title': 'International Users',
    'privacy.changes.title': 'Policy Changes',
    'privacy.contact.title': 'Contact Us',
    'privacy.footer.home': 'Back to Home',
    'privacy.footer.terms': 'Terms of Service',
    'privacy.footer.login': 'Login',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.submit': 'Submit',
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // 初始化语言状态,默认为中文
  const [language, setLanguageState] = useState<Language>('zh')

  // 从 localStorage 读取语言设置(仅在客户端)
  useEffect(() => {
    const saved = localStorage.getItem('language')
    if (saved && (saved === 'zh' || saved === 'en')) {
      setLanguageState(saved as Language)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }

  const value = {
    language,
    setLanguage,
    t,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
