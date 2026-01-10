"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Shield, Eye, User, Lock, Mail, FileText, AlertCircle, Zap } from 'lucide-react'
import { LanguageToggle } from '@/components/language-toggle'
import { Button } from '@/components/ui/button'

// 翻译字典
const translations = {
  zh: {
    // 隐私政策
    privacyTitle: '隐私政策',
    privacyDescription: '我们非常重视您的隐私保护和个人信息安全',
    lastUpdated: '最后更新时间',
    introTitle: '引言',
    introText: '欢迎使用CodeGen AI(以下简称"我们"或"本服务")。我们深知个人信息对您的重要性,并会尽全力保护您的个人信息安全可靠。我们致力于维持您对我们的信任,恪守以下原则保护您的个人信息:权责一致原则、目的明确原则、选择同意原则、最小必要原则、确保安全原则、主体参与原则、公开透明原则等。',
    collectInfoTitle: '我们收集的信息',
    accountInfo: '账户信息',
    accountInfoList: [
      '注册时提供的邮箱地址',
      '用户名和显示名称',
      '头像和个人资料信息',
      '登录凭证(安全存储的密码哈希)',
    ],
    usageData: '使用数据',
    usageDataList: [
      '生成的代码内容和配置',
      '对话历史记录',
      '使用频率和功能偏好',
      '错误日志和性能数据',
    ],
    techInfo: '技术信息',
    techInfoList: [
      'IP地址和设备信息',
      '浏览器类型和版本',
      '操作系统信息',
      'Cookie和类似技术',
    ],
    dataSecurityTitle: '数据安全',
    dataSecurityIntro: '我们采取适当的安全措施来保护您的个人信息:',
    encryption: '加密:',
    encryptionDesc: '使用HTTPS/TLS加密传输数据',
    accessControl: '访问控制:',
    accessControlDesc: '限制员工和第三方对个人信息的访问',
    dataBackup: '数据备份:',
    dataBackupDesc: '定期备份并实施灾难恢复计划',
    securityAudit: '安全审计:',
    securityAuditDesc: '定期进行安全评估和漏洞扫描',
    passwordSecurity: '密码安全:',
    passwordSecurityDesc: '使用bcrypt等安全算法存储密码',

    // 服务条款
    termsTitle: '服务条款',
    termsDescription: '使用CodeGen AI服务前,请仔细阅读以下条款',
    importantNotice: '重要提示',
    importantText1: '感谢您使用CodeGen AI(以下简称"本服务"、"我们")。本服务条款(以下简称"本条款")是您与我们之间关于使用本服务的法律协议。',
    importantText2: '通过注册账户或使用本服务,您确认您已阅读、理解并同意本条款。如果您不同意本条款的任何部分,请不要使用本服务。',
    serviceDescription: '服务描述',
    serviceIntro: 'CodeGen AI是一个基于人工智能的代码生成和UI设计平台,旨在帮助用户快速生成高质量的前端代码。',
    coreFeatures: '核心功能包括:',
    feature1: 'AI驱动的代码生成',
    feature2: 'UI组件自动创建',
    feature3: '代码优化和重构建议',
    feature4: '实时预览和编辑',
    feature5: '项目管理和协作',
    serviceReserve: '我们保留随时修改、暂停或终止全部或部分服务的权利,恕不另行通知。我们对服务的修改或中断不承担任何责任。',
    intellectualProperty: '知识产权',
    generatedCodeUse: '生成代码的使用',
    generatedCodeIntro: '您对自己生成的代码拥有完全的使用权,包括:',
    right1: '商业使用',
    right2: '修改和分发',
    right3: '纳入到您的项目中',
    right4: '出售或转让',
    generatedCodeWarning: '但是,生成的代码不提供任何明示或暗示的保证,您应自行承担使用风险。',
    disclaimer: '免责声明',
    disclaimerIntro: '本服务按"原样"和"可用"的基础提供,不提供任何形式的明示或暗示保证,包括但不限于:',
    disclaimer1: '服务的持续性、及时性或无错误性',
    disclaimer2: '生成代码的正确性、完整性或适用性',
    disclaimer3: '服务器或软件无病毒或其他有害组件',
    disclaimer4: '使用服务的特定结果的准确性或可靠性',
    disclaimerImportant: '重要:',
    disclaimerImportantText: 'AI生成的代码可能包含错误或安全漏洞。您应该始终审查、测试和验证生成的代码,然后再将其用于生产环境。我们不对因使用生成的代码而造成的任何损害或损失承担责任。',
    acknowledgment: '确认理解',
    acknowledgmentText: '通过注册账户或使用CodeGen AI服务,您确认您已阅读、理解并同意受本服务条款约束。如果您不同意这些条款,请不要使用我们的服务。',

    // 通用
    contactTitle: '联系我们',
    contactText: '如果您有任何疑问、意见或建议,请通过以下方式联系我们:',
    backToHome: '返回首页',
    login: '登录',
    viewPrivacy: '查看隐私政策',
    viewTerms: '查看服务条款',
  },
  en: {
    // Privacy Policy
    privacyTitle: 'Privacy Policy',
    privacyDescription: 'We highly value your privacy and personal information security',
    lastUpdated: 'Last Updated',
    introTitle: 'Introduction',
    introText: 'Welcome to CodeGen AI (hereinafter referred to as "we" or "this service"). We deeply understand the importance of your personal information to you and will do our utmost to protect the security and reliability of your personal information. We are committed to maintaining your trust in us and adhering to the following principles to protect your personal information: principle of consistency between rights and responsibilities, principle of clear purpose, principle of choice and consent, principle of minimum necessity, principle of ensuring security, principle of subject participation, principle of openness and transparency, etc.',
    collectInfoTitle: 'Information We Collect',
    accountInfo: 'Account Information',
    accountInfoList: [
      'Email address provided during registration',
      'Username and display name',
      'Avatar and profile information',
      'Login credentials (securely stored password hash)',
    ],
    usageData: 'Usage Data',
    usageDataList: [
      'Generated code content and configuration',
      'Conversation history',
      'Usage frequency and feature preferences',
      'Error logs and performance data',
    ],
    techInfo: 'Technical Information',
    techInfoList: [
      'IP address and device information',
      'Browser type and version',
      'Operating system information',
      'Cookies and similar technologies',
    ],
    dataSecurityTitle: 'Data Security',
    dataSecurityIntro: 'We take appropriate security measures to protect your personal information:',
    encryption: 'Encryption:',
    encryptionDesc: 'Using HTTPS/TLS to encrypt data transmission',
    accessControl: 'Access Control:',
    accessControlDesc: 'Restricting employee and third-party access to personal information',
    dataBackup: 'Data Backup:',
    dataBackupDesc: 'Regular backups and disaster recovery plans',
    securityAudit: 'Security Audits:',
    securityAuditDesc: 'Regular security assessments and vulnerability scans',
    passwordSecurity: 'Password Security:',
    passwordSecurityDesc: 'Using secure algorithms like bcrypt to store passwords',

    // Terms of Service
    termsTitle: 'Terms of Service',
    termsDescription: 'Please read these terms carefully before using CodeGen AI',
    importantNotice: 'Important Notice',
    importantText1: 'Thank you for using CodeGen AI (hereinafter referred to as "this service" or "we"). These Terms of Service (hereinafter referred to as "these terms") constitute a legal agreement between you and us regarding the use of this service.',
    importantText2: 'By registering an account or using this service, you confirm that you have read, understood and agree to these terms. If you do not agree to any part of these terms, please do not use this service.',
    serviceDescription: 'Service Description',
    serviceIntro: 'CodeGen AI is an AI-based code generation and UI design platform designed to help users quickly generate high-quality frontend code.',
    coreFeatures: 'Core features include:',
    feature1: 'AI-driven code generation',
    feature2: 'Automatic UI component creation',
    feature3: 'Code optimization and refactoring suggestions',
    feature4: 'Real-time preview and editing',
    feature5: 'Project management and collaboration',
    serviceReserve: 'We reserve the right to modify, suspend or terminate all or part of the service at any time without notice. We are not liable for any service modifications or interruptions.',
    intellectualProperty: 'Intellectual Property',
    generatedCodeUse: 'Use of Generated Code',
    generatedCodeIntro: 'You have full rights to use the code you generate, including:',
    right1: 'Commercial use',
    right2: 'Modification and distribution',
    right3: 'Incorporation into your projects',
    right4: 'Sale or transfer',
    generatedCodeWarning: 'However, generated code is provided without any express or implied warranties, and you use it at your own risk.',
    disclaimer: 'Disclaimer of Warranties',
    disclaimerIntro: 'This service is provided on an "as is" and "as available" basis, without any express or implied warranties, including but not limited to:',
    disclaimer1: 'Continuity, timeliness or error-free service',
    disclaimer2: 'Accuracy, completeness or suitability of generated code',
    disclaimer3: 'Servers or software being free of viruses or harmful components',
    disclaimer4: 'Accuracy or reliability of specific results from using the service',
    disclaimerImportant: 'Important:',
    disclaimerImportantText: 'AI-generated code may contain errors or security vulnerabilities. You should always review, test and verify generated code before using it in production. We are not liable for any damage or loss caused by using generated code.',
    acknowledgment: 'Acknowledgment',
    acknowledgmentText: 'By registering an account or using CodeGen AI services, you confirm that you have read, understood and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',

    // Common
    contactTitle: 'Contact Us',
    contactText: 'If you have any questions, comments, or suggestions, please contact us:',
    backToHome: 'Back to Home',
    login: 'Login',
    viewPrivacy: 'View Privacy Policy',
    viewTerms: 'View Terms of Service',
  },
}

type TabType = 'privacy' | 'terms'

export default function PrivacyPage() {
  const [language, setLanguage] = useState<"zh" | "en">("zh")
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('privacy')

  // Load language preference from localStorage after mount
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      try {
        const savedLanguage = localStorage.getItem('language') as "zh" | "en" | null
        if (savedLanguage === "zh" || savedLanguage === "en") {
          setLanguage(savedLanguage)
        }

        // Check URL hash for initial tab
        if (window.location.hash === '#terms') {
          setActiveTab('terms')
        } else if (window.location.hash === '#privacy') {
          setActiveTab('privacy')
        }
      } catch (error) {
        console.error('Error reading language from localStorage:', error)
      }
    }
  }, [])

  const handleLanguageChange = (newLanguage: "zh" | "en") => {
    setLanguage(newLanguage)
    if (isMounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('language', newLanguage)
      } catch (error) {
        console.error('Error saving language to localStorage:', error)
      }
    }
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.zh] || key
  }

  const lastUpdated = new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle language={language} setLanguage={handleLanguageChange} />
      </div>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              {activeTab === 'privacy' ? (
                <Shield className="h-8 w-8 text-accent-foreground" />
              ) : (
                <FileText className="h-8 w-8 text-accent-foreground" />
              )}
            </div>
          </div>

          {/* Tab Toggle */}
          <div className="flex justify-center gap-2 mb-6">
            <Button
              variant={activeTab === 'privacy' ? 'default' : 'outline'}
              onClick={() => setActiveTab('privacy')}
              className="min-w-[140px]"
            >
              <Shield className="h-4 w-4 mr-2" />
              {t('privacyTitle')}
            </Button>
            <Button
              variant={activeTab === 'terms' ? 'default' : 'outline'}
              onClick={() => setActiveTab('terms')}
              className="min-w-[140px]"
            >
              <FileText className="h-4 w-4 mr-2" />
              {t('termsTitle')}
            </Button>
          </div>

          <h1 className="text-4xl font-bold mb-4">
            {activeTab === 'privacy' ? t('privacyTitle') : t('termsTitle')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {activeTab === 'privacy' ? t('privacyDescription') : t('termsDescription')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('lastUpdated')}: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="bg-background rounded-lg shadow-lg p-8 md:p-12 space-y-8">

          {activeTab === 'privacy' ? (
            <>
              {/* Privacy Policy Content */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Eye className="h-6 w-6 mr-2 text-accent" />
                  {t('introTitle')}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('introText')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <User className="h-6 w-6 mr-2 text-accent" />
                  {t('collectInfoTitle')}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">1. {t('accountInfo')}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {translations[language].accountInfoList.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">2. {t('usageData')}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {translations[language].usageDataList.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">3. {t('techInfo')}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {translations[language].techInfoList.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Lock className="h-6 w-6 mr-2 text-accent" />
                  {t('dataSecurityTitle')}
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>{t('dataSecurityIntro')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>{t('encryption')}</strong> {t('encryptionDesc')}</li>
                    <li><strong>{t('accessControl')}</strong> {t('accessControlDesc')}</li>
                    <li><strong>{t('dataBackup')}</strong> {t('dataBackupDesc')}</li>
                    <li><strong>{t('securityAudit')}</strong> {t('securityAuditDesc')}</li>
                    <li><strong>{t('passwordSecurity')}</strong> {t('passwordSecurityDesc')}</li>
                  </ul>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Terms of Service Content */}
              <section className="bg-secondary/50 rounded-lg p-6 border-l-4 border-accent">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <AlertCircle className="h-6 w-6 mr-2 text-accent" />
                  {t('importantNotice')}
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>{t('importantText1')}</p>
                  <p className="font-semibold text-foreground">{t('importantText2')}</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Zap className="h-6 w-6 mr-2 text-accent" />
                  {t('serviceDescription')}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>{t('serviceIntro')}</p>

                  <div className="bg-secondary/30 rounded-lg p-4">
                    <h3 className="font-semibold text-foreground mb-2">{t('coreFeatures')}</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>{t('feature1')}</li>
                      <li>{t('feature2')}</li>
                      <li>{t('feature3')}</li>
                      <li>{t('feature4')}</li>
                      <li>{t('feature5')}</li>
                    </ul>
                  </div>

                  <p className="text-sm">{t('serviceReserve')}</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-accent" />
                  {t('intellectualProperty')}
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{t('generatedCodeUse')}</h3>
                    <div className="bg-secondary/30 rounded-lg p-4 mt-2">
                      <p className="text-sm mb-2">{t('generatedCodeIntro')}</p>
                      <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                        <li>{t('right1')}</li>
                        <li>{t('right2')}</li>
                        <li>{t('right3')}</li>
                        <li>{t('right4')}</li>
                      </ul>
                      <p className="text-sm mt-2">{t('generatedCodeWarning')}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">{t('disclaimer')}</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>{t('disclaimerIntro')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('disclaimer1')}</li>
                    <li>{t('disclaimer2')}</li>
                    <li>{t('disclaimer3')}</li>
                    <li>{t('disclaimer4')}</li>
                  </ul>
                  <p className="text-sm bg-secondary/30 rounded-lg p-4 mt-4">
                    <strong>{t('disclaimerImportant')}</strong> {t('disclaimerImportantText')}
                  </p>
                </div>
              </section>

              <section className="bg-accent/10 rounded-lg p-6 border border-accent">
                <h2 className="text-xl font-semibold mb-3">{t('acknowledgment')}</h2>
                <p className="text-sm text-muted-foreground">{t('acknowledgmentText')}</p>
              </section>
            </>
          )}

          {/* Contact Information - Common to both */}
          <section className="bg-secondary/50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('contactTitle')}</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>{t('contactText')}</p>
              <div className="space-y-2 mt-4">
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="font-mono text-sm">mornfront@sina.com</span>
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-12 space-y-4">
          <div className="text-sm text-muted-foreground">
            <Link href="/" className="text-accent hover:underline">{t('backToHome')}</Link>
            <span className="mx-2">•</span>
            <Link href="/login" className="text-accent hover:underline">{t('login')}</Link>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CodeGen AI. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
