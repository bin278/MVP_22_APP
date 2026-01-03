export interface GeneratedProject {
  files: {
    [key: string]: string
  }
  projectName: string
}

// Content generation utilities
function generateContent(prompt: string, type: string, parsedPrompt: ParsedPrompt) {
  const baseContent = {
    heroTitle: generateHeroTitle(prompt, type, parsedPrompt.language),
    heroSubtitle: generateHeroSubtitle(prompt, type, parsedPrompt.language),
    features: generateFeatures(type, parsedPrompt.language),
    testimonials: generateTestimonials(type, parsedPrompt.language),
    ctaText: generateCtaText(type, parsedPrompt.language)
  }

  return baseContent
}

function generateHeroTitle(prompt: string, type: string, language: 'en' | 'zh'): string {
  const titles = {
    en: {
      dashboard: ["Advanced Analytics Dashboard", "Business Intelligence Hub", "Data Management Center", "Performance Monitoring Suite"],
      landing: ["Transform Your Business Today", "Welcome to the Future", "Innovation Starts Here", "Build Something Amazing"],
      form: ["Join Our Community", "Get Started Today", "Create Your Account", "Sign Up for Free"],
      pricing: ["Choose Your Perfect Plan", "Find the Right Solution", "Pricing That Works", "Get Started with Premium"],
      blog: ["Latest Insights & Stories", "Discover Our Blog", "Thoughts & Ideas", "News & Updates"],
      game: ["Epic Adventure Awaits", "Challenge Yourself", "Fun Gaming Experience", "Play & Win"],
      'ecommerce': ["Shop the Latest Trends", "Discover Amazing Products", "Your Shopping Destination", "Quality Products Online"],
      social: ["Connect with Friends", "Join the Community", "Share Your Moments", "Social Networking Made Easy"],
      education: ["Learn Something New", "Expand Your Knowledge", "Education for Everyone", "Master New Skills"],
      portfolio: ["Showcase Your Work", "Creative Portfolio", "Professional Showcase", "Build Your Brand"],
      business: ["Elevate Your Business", "Professional Solutions", "Business Excellence", "Achieve Success"],
      'ai-tool': ["AI-Powered Solutions", "Smart Automation", "Intelligent Tools", "Future of Technology"]
    },
    zh: {
      dashboard: ["高级分析仪表板", "商业智能中心", "数据管理中心", "性能监控套件"],
      landing: ["今天改变您的业务", "迎接未来", "创新从这里开始", "创造非凡"],
      form: ["加入我们的社区", "立即开始", "创建您的账户", "免费注册"],
      pricing: ["选择完美方案", "找到合适解决方案", "实用的定价", "开始高级体验"],
      blog: ["最新洞见与故事", "探索我们的博客", "想法与创意", "新闻与更新"],
      game: ["史诗冒险在等待", "挑战自我", "有趣的游戏体验", "玩耍与获胜"],
      'ecommerce': ["购物最新潮流", "发现惊人产品", "您的购物目的地", "在线优质产品"],
      social: ["与朋友连接", "加入社区", "分享您的时刻", "简单的社交网络"],
      education: ["学习新知识", "拓展您的知识", "全民教育", "掌握新技能"],
      portfolio: ["展示您的作品", "创意作品集", "专业展示", "打造您的品牌"],
      business: ["提升您的业务", "专业解决方案", "卓越商务", "实现成功"],
      'ai-tool': ["AI驱动解决方案", "智能自动化", "智能工具", "技术的未来"]
    }
  }

  const typeTitles = titles[language][type as keyof typeof titles['en']] || titles[language]['generic']
  return typeTitles[Math.floor(Math.random() * typeTitles.length)]
}

function generateHeroSubtitle(prompt: string, type: string, language: 'en' | 'zh'): string {
  const subtitles = {
    en: {
      dashboard: ["Monitor your business metrics in real-time with our comprehensive dashboard solution.", "Transform data into actionable insights with advanced analytics and reporting.", "Get complete visibility into your operations with our powerful dashboard tools."],
      landing: ["We provide innovative solutions that help businesses grow and succeed in today's competitive market.", "Experience the power of modern technology combined with expert craftsmanship.", "Join thousands of satisfied customers who trust us with their digital transformation."],
      form: ["Join thousands of users who are already benefiting from our platform. Sign up today!", "Create your account and start exploring all the amazing features we have to offer.", "Get started with our free trial and see why everyone is talking about us."],
      pricing: ["Flexible pricing plans designed to fit businesses of all sizes and budgets.", "Choose the perfect plan for your needs with our transparent pricing structure.", "Start free and upgrade as you grow with our scalable pricing options."],
      blog: ["Stay updated with the latest trends, insights, and stories from our expert team.", "Discover thought-provoking articles and industry insights from leading professionals.", "Explore our collection of articles covering technology, business, and innovation."],
      game: ["Embark on an exciting journey filled with challenges and rewards in our immersive game world.", "Test your skills and compete with players worldwide in this addictive gaming experience.", "Experience the thrill of victory as you master new levels and unlock achievements."],
      'ecommerce': ["Discover a wide range of quality products at competitive prices with fast, free shipping.", "Shop with confidence knowing you're getting the best deals on top-quality merchandise.", "Your one-stop destination for all your shopping needs with secure checkout and great service."],
      social: ["Connect with friends, share moments, and build lasting relationships in our vibrant community.", "Join millions of users sharing their stories and connecting with like-minded people worldwide.", "Experience social networking reimagined with modern features and intuitive design."],
      education: ["Learn from industry experts with our comprehensive courses and interactive learning platform.", "Master new skills and advance your career with our expert-led educational content.", "Access high-quality education anytime, anywhere with our flexible learning platform."],
      portfolio: ["Showcase your creative work and professional achievements with our stunning portfolio platform.", "Build an impressive online presence that captures attention and drives opportunities.", "Present your skills and experience in a visually compelling and professional manner."],
      business: ["Transform your business operations with our comprehensive suite of professional solutions.", "Drive growth and success with our proven strategies and expert business consulting.", "Achieve excellence in your industry with our innovative business solutions and support."],
      'ai-tool': ["Harness the power of artificial intelligence to automate tasks and boost productivity.", "Experience the future of technology with our intelligent tools and smart automation.", "Unlock new possibilities with AI-driven solutions that adapt to your unique needs."]
    },
    zh: {
      dashboard: ["通过我们的综合仪表板解决方案实时监控您的业务指标。", "通过高级分析和报告将数据转化为可操作的洞察。", "通过强大的仪表板工具全面了解您的运营情况。"],
      landing: ["我们提供创新解决方案，帮助企业在当今竞争激烈的市场中成长和成功。", "体验现代技术与专家工艺相结合的力量。", "加入数千满意的客户，他们信任我们进行数字化转型。"],
      form: ["加入已从我们平台受益的数千用户。今天就注册吧！", "创建您的账户，开始探索我们提供的所有惊人功能。", "通过我们的免费试用开始体验，看看为什么大家都对我们赞不绝口。"],
      pricing: ["灵活的定价计划，适合各种规模和预算的企业。", "通过透明的定价结构选择适合您需求的完美方案。", "免费开始，随着发展升级我们的可扩展定价选项。"],
      blog: ["通过我们专家团队的最新趋势、洞见和故事保持更新。", "探索来自领先专业人士的思想-provoking文章和行业洞见。", "探索我们涵盖技术、商业和创新的文章集合。"],
      game: ["在我们的沉浸式游戏世界中踏上充满挑战和奖励的激动旅程。", "在这个令人上瘾的游戏体验中测试您的技能并与全球玩家竞争。", "随着您掌握新关卡并解锁成就，体验胜利的快感。"],
      'ecommerce': ["以具有竞争力的价格发现各种优质产品，提供快速免费送货。", "放心购物，因为您在优质商品上获得最佳优惠。", "您所有购物需求的购物目的地，提供安全结账和优质服务。"],
      social: ["在我们的活力社区中与朋友连接、分享时刻并建立持久关系。", "加入数百万用户分享他们的故事并与全球志同道合的人联系。", "体验重新想象的社交网络，具有现代功能和直观设计。"],
      education: ["通过我们的综合课程和互动学习平台向行业专家学习。", "通过我们专家主导的教育内容掌握新技能并推进您的职业发展。", "随时随地通过我们的灵活学习平台访问优质教育。"],
      portfolio: ["通过我们令人惊叹的作品集平台展示您的创意作品和专业成就。", "建立引人注目的在线形象，吸引注意力和机遇。", "以视觉上引人注目和专业的方式展示您的技能和经验。"],
      business: ["通过我们的综合专业解决方案套件改造您的业务运营。", "通过我们经过验证的战略和专家商业咨询推动增长和成功。", "通过我们的创新商业解决方案和支持在您的行业中实现卓越。"],
      'ai-tool': ["利用人工智能的力量自动化任务并提高生产力。", "通过我们的智能工具和智能自动化体验技术未来。", "通过适应您独特需求的AI驱动解决方案解锁新可能性。"]
    }
  }

  const typeSubtitles = subtitles[language][type as keyof typeof subtitles['en']] || subtitles[language]['generic']
  return typeSubtitles[Math.floor(Math.random() * typeSubtitles.length)]
}

function generateFeatures(type: string, language: 'en' | 'zh'): Array<{title: string, description: string, icon: string}> {
  const features = {
    en: {
      dashboard: [
        { title: "Real-time Analytics", description: "Monitor your data in real-time with live dashboards and instant updates.", icon: "BarChart3" },
        { title: "Custom Reports", description: "Generate detailed reports tailored to your specific business needs.", icon: "FileText" },
        { title: "Data Visualization", description: "Transform complex data into beautiful, easy-to-understand charts and graphs.", icon: "PieChart" }
      ],
      landing: [
        { title: "Lightning Fast", description: "Blazing fast performance that keeps your users engaged and satisfied.", icon: "Zap" },
        { title: "Secure & Reliable", description: "Built with security best practices and enterprise-grade reliability.", icon: "Shield" },
        { title: "Easy to Use", description: "Intuitive interface that requires no training or technical expertise.", icon: "Smile" }
      ],
      'ecommerce': [
        { title: "Quality Products", description: "Carefully curated selection of high-quality products from trusted brands.", icon: "Star" },
        { title: "Fast Shipping", description: "Free shipping on orders over $50 with fast, reliable delivery.", icon: "Truck" },
        { title: "Secure Payments", description: "Multiple secure payment options with buyer protection guarantee.", icon: "CreditCard" }
      ]
    },
    zh: {
      dashboard: [
        { title: "实时分析", description: "通过实时仪表板和即时更新监控您的数据。", icon: "BarChart3" },
        { title: "自定义报告", description: "生成针对您特定业务需求量身定制的详细报告。", icon: "FileText" },
        { title: "数据可视化", description: "将复杂数据转换为美丽、易于理解的图表。", icon: "PieChart" }
      ],
      landing: [
        { title: "闪电般快速", description: "超快的性能让您的用户保持参与和满意。", icon: "Zap" },
        { title: "安全可靠", description: "采用安全最佳实践和企业级可靠性构建。", icon: "Shield" },
        { title: "易于使用", description: "无需培训或技术专业知识的直观界面。", icon: "Smile" }
      ],
      'ecommerce': [
        { title: "优质产品", description: "来自可信品牌的精心挑选的高质量产品。", icon: "Star" },
        { title: "快速发货", description: "超过50美元的订单免费发货，提供快速可靠的交付。", icon: "Truck" },
        { title: "安全支付", description: "多种安全支付选项，提供买家保护保证。", icon: "CreditCard" }
      ]
    }
  }

  return features[language][type as keyof typeof features['en']] || features[language]['landing']
}

function generateTestimonials(type: string, language: 'en' | 'zh'): Array<{name: string, position: string, content: string, avatar: string}> {
  const testimonials = {
    en: [
      {
        name: "Sarah Johnson",
        position: "CEO, TechStart Inc.",
        content: "Outstanding service and exceptional results. They transformed our digital presence completely.",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=60&h=60&fit=crop&crop=face"
      },
      {
        name: "Michael Chen",
        position: "CTO, InnovateCorp",
        content: "Professional team with cutting-edge solutions. Highly recommend their expertise.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face"
      },
      {
        name: "Emily Davis",
        position: "Director, GrowthCo",
        content: "The best investment we made for our business. Results exceeded all expectations.",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face"
      }
    ],
    zh: [
      {
        name: "张晓明",
        position: "CEO, 创新科技公司",
        content: "出色的服务和卓越的结果。他们完全改变了我们的数字形象。",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=60&h=60&fit=crop&crop=face"
      },
      {
        name: "李华",
        position: "CTO, 未来创新公司",
        content: "专业的团队，尖端解决方案。强烈推荐他们的专业知识。",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face"
      },
      {
        name: "王美丽",
        position: "总监, 成长公司",
        content: "我们做过的最好的投资。结果超出了所有期望。",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face"
      }
    ]
  }

  return testimonials[language]
}

function generateCtaText(type: string, language: 'en' | 'zh'): string {
  const ctas = {
    en: {
      dashboard: "Start Analyzing",
      landing: "Get Started Today",
      form: "Create Account",
      pricing: "Choose Plan",
      blog: "Read More",
      game: "Start Playing",
      'ecommerce': "Shop Now",
      social: "Join Community",
      education: "Start Learning",
      portfolio: "View Portfolio",
      business: "Contact Us",
      'ai-tool': "Try Now"
    },
    zh: {
      dashboard: "开始分析",
      landing: "立即开始",
      form: "创建账户",
      pricing: "选择方案",
      blog: "阅读更多",
      game: "开始游戏",
      'ecommerce': "立即购物",
      social: "加入社区",
      education: "开始学习",
      portfolio: "查看作品集",
      business: "联系我们",
      'ai-tool': "立即试用"
    }
  }

  return ctas[language][type as keyof typeof ctas['en']] || ctas[language]['landing']
}

// Enhanced prompt parsing interface
interface ParsedPrompt {
  type: 'dashboard' | 'landing' | 'form' | 'pricing' | 'blog' | 'game' | 'ai-tool' | 'ecommerce' | 'social' | 'education' | 'portfolio' | 'business' | 'generic'
  theme: 'light' | 'dark' | 'colorful' | 'minimal' | 'professional' | 'creative'
  features: string[]
  colorScheme: {
    primary: string
    secondary: string
    accent: string
  }
  language: 'en' | 'zh'
  complexity: 'simple' | 'medium' | 'complex'
}

// Advanced prompt parsing
function parsePrompt(prompt: string): ParsedPrompt {
  const promptLower = prompt.toLowerCase()
  const promptWords = promptLower.split(/\s+/)

  // Detect application type with improved logic
  let type: ParsedPrompt['type'] = 'generic'

  // Dashboard patterns
  if (promptLower.includes('dashboard') || promptLower.includes('analytics') ||
      promptLower.includes('数据面板') || promptLower.includes('分析') ||
      promptLower.includes('管理后台') || promptLower.includes('控制台')) {
    type = 'dashboard'
  }
  // Landing page patterns
  else if (promptLower.includes('landing') || promptLower.includes('homepage') ||
           promptLower.includes('营销') || promptLower.includes('产品') ||
           promptLower.includes('展示') || promptLower.includes('宣传')) {
    type = 'landing'
  }
  // Form patterns
  else if (promptLower.includes('form') || promptLower.includes('signup') ||
           promptLower.includes('login') || promptLower.includes('注册') ||
           promptLower.includes('登录') || promptLower.includes('表单')) {
    type = 'form'
  }
  // Pricing patterns
  else if (promptLower.includes('pricing') || promptLower.includes('价格') ||
           promptLower.includes('收费') || promptLower.includes('订阅')) {
    type = 'pricing'
  }
  // Blog patterns
  else if (promptLower.includes('blog') || promptLower.includes('article') ||
           promptLower.includes('博客') || promptLower.includes('文章') ||
           promptLower.includes('新闻') || promptLower.includes('资讯')) {
    type = 'blog'
  }
  // Game patterns
  else if (promptLower.includes('game') || promptLower.includes('gaming') ||
           promptLower.includes('play') || promptLower.includes('游戏') ||
           promptLower.includes('娱乐') || promptLower.includes('互动')) {
    type = 'game'
  }
  // E-commerce patterns
  else if (promptLower.includes('shop') || promptLower.includes('store') ||
           promptLower.includes('commerce') || promptLower.includes('电商') ||
           promptLower.includes('商店') || promptLower.includes('购物') ||
           promptLower.includes('购买') || promptLower.includes('商城')) {
    type = 'ecommerce'
  }
  // Social patterns
  else if (promptLower.includes('social') || promptLower.includes('network') ||
           promptLower.includes('community') || promptLower.includes('社交') ||
           promptLower.includes('社区') || promptLower.includes('朋友')) {
    type = 'social'
  }
  // Education patterns
  else if (promptLower.includes('education') || promptLower.includes('learning') ||
           promptLower.includes('course') || promptLower.includes('教育') ||
           promptLower.includes('学习') || promptLower.includes('课程') ||
           promptLower.includes('培训')) {
    type = 'education'
  }
  // Portfolio patterns
  else if (promptLower.includes('portfolio') || promptLower.includes('resume') ||
           promptLower.includes('作品集') || promptLower.includes('简历') ||
           promptLower.includes('个人网站')) {
    type = 'portfolio'
  }
  // Business patterns
  else if (promptLower.includes('business') || promptLower.includes('company') ||
           promptLower.includes('corporate') || promptLower.includes('企业') ||
           promptLower.includes('公司') || promptLower.includes('商务')) {
    type = 'business'
  }
  // AI Tool patterns
  else if (promptLower.includes('ai') || promptLower.includes('tool') ||
           promptLower.includes('assistant') || promptLower.includes('智能') ||
           promptLower.includes('工具') || promptLower.includes('助手') ||
           promptLower.includes('自动化')) {
    type = 'ai-tool'
  }

  // Detect theme
  let theme: ParsedPrompt['theme'] = 'light'
  if (promptLower.includes('dark') || promptLower.includes('深色') || promptLower.includes('夜晚')) {
    theme = 'dark'
  } else if (promptLower.includes('colorful') || promptLower.includes('彩色') || promptLower.includes('多彩')) {
    theme = 'colorful'
  } else if (promptLower.includes('minimal') || promptLower.includes('极简') || promptLower.includes('简洁')) {
    theme = 'minimal'
  } else if (promptLower.includes('professional') || promptLower.includes('专业') || promptLower.includes('商务')) {
    theme = 'professional'
  } else if (promptLower.includes('creative') || promptLower.includes('创意') || promptLower.includes('艺术')) {
    theme = 'creative'
  }

  // Detect features
  const features: string[] = []
  const featureKeywords = {
    'responsive': ['responsive', 'mobile', 'responsive', '自适应', '移动端'],
    'authentication': ['auth', 'login', 'signup', 'user', 'authentication', '登录', '注册', '用户'],
    'search': ['search', 'filter', 'find', '搜索', '筛选', '查找'],
    'notifications': ['notification', 'alert', 'message', '通知', '提醒', '消息'],
    'charts': ['chart', 'graph', 'analytics', '图表', '数据', '分析'],
    'payment': ['payment', 'stripe', 'checkout', '支付', '结算'],
    'admin': ['admin', 'management', 'control', '管理', '控制'],
    'api': ['api', 'integration', 'connect', '接口', '集成', '连接'],
    'multilingual': ['multi', 'language', 'i18n', '多语言', '国际化']
  }

  Object.entries(featureKeywords).forEach(([feature, keywords]) => {
    if (keywords.some(keyword => promptLower.includes(keyword))) {
      features.push(feature)
    }
  })

  // Detect color scheme based on type and theme
  let colorScheme = {
    primary: '#3b82f6', // blue-500
    secondary: '#64748b', // slate-500
    accent: '#f59e0b' // amber-500
  }

  if (theme === 'dark') {
    colorScheme = {
      primary: '#1e40af', // blue-800
      secondary: '#475569', // slate-600
      accent: '#d97706' // amber-600
    }
  } else if (theme === 'colorful') {
    colorScheme = {
      primary: '#7c3aed', // violet-600
      secondary: '#ec4899', // pink-500
      accent: '#10b981' // emerald-500
    }
  } else if (type === 'ecommerce') {
    colorScheme = {
      primary: '#059669', // emerald-600
      secondary: '#dc2626', // red-600
      accent: '#f59e0b' // amber-500
    }
  } else if (type === 'social') {
    colorScheme = {
      primary: '#7c3aed', // violet-600
      secondary: '#ec4899', // pink-500
      accent: '#06b6d4' // cyan-500
    }
  }

  // Detect language
  const language: ParsedPrompt['language'] = /[一-龯]/.test(prompt) ? 'zh' : 'en'

  // Detect complexity
  let complexity: ParsedPrompt['complexity'] = 'simple'
  const wordCount = promptWords.length
  if (wordCount > 20) complexity = 'complex'
  else if (wordCount > 10) complexity = 'medium'

  if (features.length > 3) complexity = 'complex'
  else if (features.length > 1) complexity = 'medium'

  return {
    type,
    theme,
    features,
    colorScheme,
    language,
    complexity
  }
}

export function generateFrontendCode(prompt: string): GeneratedProject {
  const parsedPrompt = parsePrompt(prompt)

  const projectName = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) || 'generated-app'

  // Generate based on parsed prompt
  switch (parsedPrompt.type) {
    case 'dashboard':
      return generateDashboard(prompt, projectName, parsedPrompt)
    case 'landing':
      return generateLandingPage(prompt, projectName, parsedPrompt)
    case 'form':
      return generateFormPage(prompt, projectName, parsedPrompt)
    case 'pricing':
      return generatePricingPage(prompt, projectName, parsedPrompt)
    case 'blog':
      return generateBlogPage(prompt, projectName, parsedPrompt)
    case 'game':
      return generateGamePage(prompt, projectName, parsedPrompt)
    case 'ecommerce':
      return generateEcommerceApp(prompt, projectName, parsedPrompt)
    case 'social':
      return generateSocialApp(prompt, projectName, parsedPrompt)
    case 'education':
      return generateEducationApp(prompt, projectName, parsedPrompt)
    case 'portfolio':
      return generatePortfolioApp(prompt, projectName, parsedPrompt)
    case 'business':
      return generateBusinessApp(prompt, projectName, parsedPrompt)
    case 'ai-tool':
      return generateAIToolWebsite(prompt, projectName, parsedPrompt)
    default:
      return generateGenericApp(prompt, projectName, parsedPrompt)
  }
}

function generateDashboard(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0',
          recharts: '^2.15.4'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          vite: '^5.0.0'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { BarChart3, Users, DollarSign, TrendingUp, Activity } from 'lucide-react'

export default function App() {
  const stats = [
    { name: 'Total Revenue', value: '$45,231', icon: DollarSign, change: '+20.1%', positive: true },
    { name: 'Active Users', value: '2,345', icon: Users, change: '+12.5%', positive: true },
    { name: 'Conversion', value: '3.24%', icon: TrendingUp, change: '-4.3%', positive: false },
    { name: 'Activity', value: '89%', icon: Activity, change: '+5.2%', positive: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold">${prompt}</h1>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Export
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-8 h-8 text-blue-600" />
                  <span className={\`text-sm font-medium \${stat.positive ? 'text-green-600' : 'text-red-600'}\`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{stat.name}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Activity {i}</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart placeholder - Add recharts for real charts
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Project Structure

- \`src/App.tsx\` - Main application component
- \`src/main.tsx\` - Application entry point
- \`src/index.css\` - Global styles

Enjoy your generated frontend! 🚀
`,
      '.gitignore': `# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Production
build
dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
`
    }
  }
}

function generateLandingPage(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  const content = generateContent(prompt, 'landing', parsedPrompt)

  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          vite: '^5.0.0',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { Rocket, Zap, Shield, ArrowRight, Star, Check } from 'lucide-react'

export default function App() {
  const features = ${JSON.stringify(content.features, null, 2)}

  const testimonials = ${JSON.stringify(content.testimonials, null, 2)}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-indigo-600">Logo</div>
          <div className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-700 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#testimonials" className="text-gray-700 hover:text-indigo-600 transition-colors">Testimonials</a>
            <a href="#contact" className="text-gray-700 hover:text-indigo-600 transition-colors">Contact</a>
          </div>
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            ${content.ctaText}
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-600 text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            New Release 2024
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            ${content.heroTitle}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            ${content.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 transition-colors">
              ${content.ctaText}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 font-medium border-2 border-indigo-600 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Why Choose Us
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon === 'Zap' ? Zap : feature.icon === 'Shield' ? Shield : Rocket
            return (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            What Our Customers Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.position}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
                <div className="flex text-yellow-400 mt-4">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-indigo-600 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Join thousands of satisfied customers today
          </p>
          <button className="px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 font-medium transition-colors">
            ${content.ctaText}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200">
        <p className="text-center text-gray-600">
          © 2024 Generated by mornFront. All rights reserved.
        </p>
      </footer>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your generated landing page! 🚀
`,
      '.gitignore': `node_modules
dist
.DS_Store
*.log
.env.local`
    }
  }
}

function generateFormPage(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      ...generateGenericApp(prompt, projectName).files,
      'src/App.tsx': `import { useState } from 'react'
import { Mail, Lock, User, AlertCircle } from 'lucide-react'

export default function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    
    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      alert('Form submitted successfully!')
      console.log('Form data:', formData)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{prompt || 'Sign Up Form'}</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={\`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent \${errors.name ? 'border-red-500' : 'border-gray-300'}\`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={\`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent \${errors.email ? 'border-red-500' : 'border-gray-300'}\`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={\`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent \${errors.password ? 'border-red-500' : 'border-gray-300'}\`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}`
    }
  }
}

function generatePricingPage(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      ...generateGenericApp(prompt, projectName).files,
      'src/App.tsx': `import { Check } from 'lucide-react'

export default function App() {
  const plans = [
    {
      name: 'Starter',
      price: '$9',
      period: '/month',
      features: [
        '10 Projects',
        '5GB Storage',
        'Basic Support',
        'Email Support'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      features: [
        'Unlimited Projects',
        '50GB Storage',
        'Priority Support',
        '24/7 Phone Support',
        'Advanced Analytics'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      features: [
        'Unlimited Everything',
        '500GB Storage',
        'Dedicated Support',
        'Custom Integration',
        'SLA Guarantee',
        'White-label Option'
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {prompt || 'Choose Your Plan'}
          </h1>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={\`bg-white rounded-2xl shadow-lg p-8 relative \${
                plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : ''
              }\`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={\`w-full py-3 rounded-lg font-medium transition-colors \${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }\`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 mt-12">
          All plans include 14-day free trial. No credit card required.
        </p>
      </div>
    </div>
  )
}`
    }
  }
}

function generateBlogPage(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      ...generateGenericApp(prompt, projectName).files,
      'src/App.tsx': `import { Calendar, Clock, User } from 'lucide-react'

export default function App() {
  const posts = [
    {
      title: 'Getting Started with Modern Web Development',
      excerpt: 'Learn the fundamentals of building modern web applications with React and TypeScript.',
      author: 'John Doe',
      date: 'Mar 15, 2024',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop'
    },
    {
      title: 'The Future of Frontend Development',
      excerpt: 'Explore upcoming trends and technologies shaping the future of web development.',
      author: 'Jane Smith',
      date: 'Mar 12, 2024',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=250&fit=crop'
    },
    {
      title: 'Best Practices for React Applications',
      excerpt: 'Discover proven patterns and techniques for building scalable React applications.',
      author: 'Mike Johnson',
      date: 'Mar 10, 2024',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">{prompt || 'Blog'}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <article key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readTime}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}`
    }
  }
}

function generateAIToolWebsite(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      ...generateGenericApp(prompt, projectName).files,
      'src/App.tsx': `import { useState } from 'react'
import { Sparkles, Zap, Brain, Wand2, ArrowRight, Check, Star, Users, Globe } from 'lucide-react'

export default function App() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState('')

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      setResult('Generated content based on your input...')
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ${prompt.includes('AI') ? 'AI' : 'Smart'} Tool
              </h1>
            </div>
            <nav className="hidden md:flex gap-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-indigo-600">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-indigo-600">About</a>
            </nav>
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-600 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Powered by Advanced AI
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              ${prompt || 'AI-Powered Tool'}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your ideas into reality with our cutting-edge AI technology. 
              Generate, create, and innovate like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Start Creating
                  </>
                )}
              </button>
              <button className="px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-gray-50 font-medium border-2 border-indigo-600 flex items-center justify-center gap-2">
                <Globe className="w-5 h-5" />
                View Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to bring your ideas to life
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-4">AI-Powered Generation</h4>
              <p className="text-gray-600">
                Advanced machine learning algorithms that understand context and generate high-quality content.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Smart Templates</h4>
              <p className="text-gray-600">
                Pre-built templates and components that adapt to your specific needs and requirements.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Lightning Fast</h4>
              <p className="text-gray-600">
                Generate complex applications in seconds, not hours. Built for speed and efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {(isGenerating || result) && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h4 className="text-2xl font-semibold mb-6 text-center">Generation Results</h4>
                {isGenerating ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-gray-600">AI is working on your request...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Generation Complete</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-800">{result}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">10K+</div>
              <div className="text-gray-600">Projects Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">5★</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Ideas?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of creators who are already using our AI-powered platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-gray-100 font-medium flex items-center justify-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-indigo-700 text-white rounded-xl hover:bg-indigo-800 font-medium">
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">AI Tool</span>
              </div>
              <p className="text-gray-400">
                Transforming ideas into reality with the power of artificial intelligence.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Product</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AI Tool. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## 🚀 AI Tool Website

This is a modern, professional AI tool website with interactive features and beautiful design.

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✨ Features

✅ **Modern Design** - Beautiful gradient backgrounds and glassmorphism effects
✅ **Interactive Elements** - Working buttons with hover effects and animations
✅ **AI Generation** - Simulated AI content generation with loading states
✅ **Responsive Layout** - Works perfectly on all screen sizes
✅ **Professional UI** - Clean, modern interface with proper typography
✅ **Real-time Updates** - Dynamic content updates and state management

## 🎨 Customization

You can easily customize this website:

### Styling
- Update colors in the gradient backgrounds
- Modify the color scheme (indigo/purple theme)
- Change typography and spacing
- Add custom animations

### Content
- Update the hero section text
- Modify feature descriptions
- Change the company information
- Add your own branding

### Functionality
- Connect to real AI APIs
- Add user authentication
- Implement real data fetching
- Add more interactive features

## 🔧 Technical Details

- Built with React 18 and TypeScript
- Uses Tailwind CSS for styling
- Lucide React for icons
- State management with React hooks
- Responsive design with CSS Grid and Flexbox

## 🚀 Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your AI tool website! 🚀

Visit: https://mornhub.dev
`
    }
  }
}

function generateEcommerceApp(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0',
          'react-router-dom': '^6.8.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { useState } from 'react'
import { ShoppingCart, Search, Heart, Star, Menu, X } from 'lucide-react'

export default function App() {
  const [cartCount, setCartCount] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const products = [
    {
      id: 1,
      name: 'Premium Wireless Headphones',
      price: 199.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
      rating: 4.8,
      reviews: 234
    },
    {
      id: 2,
      name: 'Smart Fitness Watch',
      price: 299.99,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
      rating: 4.6,
      reviews: 189
    },
    {
      id: 3,
      name: 'Ergonomic Office Chair',
      price: 349.99,
      image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',
      rating: 4.9,
      reviews: 156
    },
    {
      id: 4,
      name: 'Professional Camera Kit',
      price: 899.99,
      image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop',
      rating: 4.7,
      reviews: 98
    }
  ]

  const addToCart = () => {
    setCartCount(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-2xl font-bold text-gray-900">ShopHub</h1>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#home" className="text-gray-700 hover:text-blue-600">Home</a>
              <a href="#products" className="text-gray-700 hover:text-blue-600">Products</a>
              <a href="#categories" className="text-gray-700 hover:text-blue-600">Categories</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600">About</a>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="relative p-2">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t">
              <div className="flex flex-col gap-4">
                <a href="#home" className="text-gray-700 hover:text-blue-600">Home</a>
                <a href="#products" className="text-gray-700 hover:text-blue-600">Products</a>
                <a href="#categories" className="text-gray-700 hover:text-blue-600">Categories</a>
                <a href="#about" className="text-gray-700 hover:text-blue-600">About</a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {prompt || 'Discover Amazing Products'}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Shop the latest trends and find everything you need with fast, free shipping on orders over $50
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Shop Now
          </button>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Featured Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6">
                  <h4 className="font-semibold mb-2">{product.name}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{product.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">\${product.price}</span>
                    <button
                      onClick={addToCart}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-bold mb-4">ShopHub</h4>
              <p className="text-gray-400">
                Your one-stop shop for all your needs. Quality products, great prices, fast delivery.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Shipping</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Customer Service</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Returns</a></li>
                <li><a href="#" className="hover:text-white">Size Guide</a></li>
                <li><a href="#" className="hover:text-white">Track Order</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Follow Us</h5>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ShopHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## 🛒 E-commerce Store

A modern, responsive e-commerce website with product listings, shopping cart, and user-friendly interface.

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✨ Features

✅ **Responsive Design** - Works perfectly on all screen sizes
✅ **Product Catalog** - Beautiful product cards with images and ratings
✅ **Shopping Cart** - Add items to cart with counter
✅ **Search Functionality** - Search bar for finding products
✅ **Modern UI** - Clean, professional design with hover effects
✅ **Mobile Menu** - Responsive navigation for mobile devices

## 🎨 Customization

You can easily customize this e-commerce store:

### Styling
- Update colors in the gradient backgrounds
- Change product card layouts
- Modify button styles and hover effects
- Add custom animations

### Products
- Add more product categories
- Include product variants (sizes, colors)
- Add product filtering and sorting
- Implement product reviews and ratings

### Features
- Connect to real e-commerce APIs
- Add user authentication
- Implement payment processing
- Add order tracking
- Include wishlist functionality

## 🔧 Technical Details

- Built with React 18 and TypeScript
- Uses Tailwind CSS for styling
- Lucide React for icons
- Responsive design with CSS Grid and Flexbox

## 🚀 Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your e-commerce store! 🛒

Visit: https://mornhub.dev
`,
      '.gitignore': `node_modules
dist
.DS_Store
*.log
.env.local`
    }
  }
}

function generateSocialApp(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { useState } from 'react'
import { Heart, MessageCircle, Share, User, Search, Home, Users, Bell, Settings } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')

  const posts = [
    {
      id: 1,
      user: {
        name: 'Alice Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Just finished an amazing project! The team collaboration was incredible. 🚀 #work #success',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
      likes: 24,
      comments: 8,
      time: '2h ago'
    },
    {
      id: 2,
      user: {
        name: 'Bob Smith',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Beautiful sunset from my evening walk. Nature never ceases to amaze me! 🌅',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      likes: 156,
      comments: 23,
      time: '4h ago'
    },
    {
      id: 3,
      user: {
        name: 'Carol Davis',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Excited to share my latest blog post about modern web development trends. Check it out! 📝',
      likes: 42,
      comments: 12,
      time: '6h ago'
    }
  ]

  const stories = [
    { id: 1, user: 'Alice', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=60&h=60&fit=crop&crop=face' },
    { id: 2, user: 'Bob', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face' },
    { id: 3, user: 'Carol', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face' },
    { id: 4, user: 'David', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face' },
    { id: 5, user: 'Emma', avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=60&h=60&fit=crop&crop=face' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">SocialHub</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Stories */}
        <div className="mb-6">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {stories.map(story => (
              <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-blue-500 p-0.5">
                  <img
                    src={story.avatar}
                    alt={story.user}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="text-xs text-gray-600">{story.user}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Create Post */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
              alt="Your avatar"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <textarea
                placeholder="What's on your mind?"
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-4 text-gray-500">
                  <button className="flex items-center gap-2 hover:text-blue-600">
                    📷 Photo
                  </button>
                  <button className="flex items-center gap-2 hover:text-blue-600">
                    📹 Video
                  </button>
                  <button className="flex items-center gap-2 hover:text-blue-600">
                    📍 Location
                  </button>
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3">
                <img
                  src={post.user.avatar}
                  alt={post.user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{post.user.name}</h3>
                  <p className="text-sm text-gray-500">{post.time}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  ⋯
                </button>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-gray-900">{post.content}</p>
              </div>

              {/* Post Image */}
              {post.image && (
                <div className="relative">
                  <img
                    src={post.image}
                    alt="Post content"
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Post Actions */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-red-600">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-green-600">
                      <Share className="w-5 h-5" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div className="flex justify-around py-3">
          <button
            onClick={() => setActiveTab('home')}
            className={\`flex flex-col items-center gap-1 \${activeTab === 'home' ? 'text-blue-600' : 'text-gray-500'}\`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={\`flex flex-col items-center gap-1 \${activeTab === 'search' ? 'text-blue-600' : 'text-gray-500'}\`}
          >
            <Search className="w-6 h-6" />
            <span className="text-xs">Search</span>
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={\`flex flex-col items-center gap-1 \${activeTab === 'friends' ? 'text-blue-600' : 'text-gray-500'}\`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Friends</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={\`flex flex-col items-center gap-1 \${activeTab === 'notifications' ? 'text-blue-600' : 'text-gray-500'}\`}
          >
            <Bell className="w-6 h-6" />
            <span className="text-xs">Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={\`flex flex-col items-center gap-1 \${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'}\`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## 👥 Social Media Platform

A modern social media application with posts, stories, and interactive features.

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✨ Features

✅ **Post Feed** - Scroll through posts with likes and comments
✅ **Stories** - Horizontal scrolling story highlights
✅ **Create Posts** - Rich text posting with media options
✅ **Responsive Design** - Mobile-first design with bottom navigation
✅ **Modern UI** - Clean, Instagram-like interface
✅ **Interactive Elements** - Hover effects and smooth animations

## 🎨 Customization

You can easily customize this social platform:

### Features
- Add real-time messaging
- Implement video posts
- Add user profiles and following
- Include notifications system
- Add post categories/tags

### UI/UX
- Customize color schemes
- Add dark mode toggle
- Implement infinite scroll
- Add search and filtering
- Include user authentication

### Functionality
- Connect to real backend APIs
- Add image upload functionality
- Implement real-time updates
- Add push notifications
- Include analytics tracking

## 🔧 Technical Details

- Built with React 18 and TypeScript
- Uses Tailwind CSS for styling
- Lucide React for icons
- Responsive design with mobile navigation

## 🚀 Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your social platform! 👥

Visit: https://mornhub.dev
`,
      '.gitignore': `node_modules
dist
.DS_Store
*.log
.env.local`
    }
  }
}

function generateEducationApp(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { useState } from 'react'
import { BookOpen, Play, CheckCircle, Star, Clock, Users, Award, Search } from 'lucide-react'

export default function App() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const courses = [
    {
      id: 1,
      title: 'Introduction to React Development',
      instructor: 'Sarah Johnson',
      category: 'programming',
      level: 'Beginner',
      duration: '8 hours',
      students: 1234,
      rating: 4.8,
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
      completed: false
    },
    {
      id: 2,
      title: 'Advanced JavaScript Concepts',
      instructor: 'Mike Chen',
      category: 'programming',
      level: 'Advanced',
      duration: '12 hours',
      students: 856,
      rating: 4.9,
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
      completed: false
    },
    {
      id: 3,
      title: 'UI/UX Design Fundamentals',
      instructor: 'Emma Davis',
      category: 'design',
      level: 'Intermediate',
      duration: '6 hours',
      students: 2156,
      rating: 4.7,
      price: 39.99,
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
      completed: false
    },
    {
      id: 4,
      title: 'Data Science with Python',
      instructor: 'Dr. Alex Kumar',
      category: 'data-science',
      level: 'Intermediate',
      duration: '15 hours',
      students: 942,
      rating: 4.6,
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
      completed: false
    },
    {
      id: 5,
      title: 'Digital Marketing Mastery',
      instructor: 'Lisa Wong',
      category: 'marketing',
      level: 'Beginner',
      duration: '10 hours',
      students: 1876,
      rating: 4.5,
      price: 59.99,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
      completed: false
    },
    {
      id: 6,
      title: 'Machine Learning Basics',
      instructor: 'Prof. Robert Smith',
      category: 'data-science',
      level: 'Advanced',
      duration: '20 hours',
      students: 634,
      rating: 4.9,
      price: 129.99,
      image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop',
      completed: false
    }
  ]

  const categories = [
    { id: 'all', name: 'All Courses', icon: BookOpen },
    { id: 'programming', name: 'Programming', icon: BookOpen },
    { id: 'design', name: 'Design', icon: BookOpen },
    { id: 'data-science', name: 'Data Science', icon: BookOpen },
    { id: 'marketing', name: 'Marketing', icon: BookOpen }
  ]

  const filteredCourses = courses.filter(course => {
    const matchesCategory = activeCategory === 'all' || course.category === activeCategory
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">LearnHub</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {prompt || 'Learn Something New Today'}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Discover courses taught by expert instructors. Learn at your own pace with lifetime access.
          </p>
          <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Explore Courses
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {categories.map(category => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={\`flex items-center gap-2 px-6 py-3 rounded-lg whitespace-nowrap transition-colors \${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }\`}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Featured Courses</h3>
            <p className="text-gray-600">Expand your knowledge with our expert-led courses</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={\`px-3 py-1 rounded-full text-sm font-medium \${
                      course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                      course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }\`}>
                      {course.level}
                    </span>
                  </div>
                  <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="p-6">
                  <h4 className="font-bold text-lg mb-2 line-clamp-2">{course.title}</h4>
                  <p className="text-gray-600 text-sm mb-3">by {course.instructor}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.students}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      {course.rating}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">\${course.price}</span>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">LearnHub</span>
              </div>
              <p className="text-gray-400">
                Empowering learners worldwide with quality education and expert instructors.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Platform</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Browse Courses</a></li>
                <li><a href="#" className="hover:text-white">Become Instructor</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">System Status</a></li>
                <li><a href="#" className="hover:text-white">Feedback</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Community</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Forum</a></li>
                <li><a href="#" className="hover:text-white">Events</a></li>
                <li><a href="#" className="hover:text-white">Newsletter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LearnHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## 🎓 Online Learning Platform

A comprehensive e-learning platform with course catalog, student progress tracking, and modern design.

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✨ Features

✅ **Course Catalog** - Browse courses by category and skill level
✅ **Search Functionality** - Find courses by title or instructor
✅ **Course Details** - Rating, duration, student count, and pricing
✅ **Responsive Design** - Works perfectly on all devices
✅ **Modern UI** - Clean, professional learning platform design
✅ **Category Filtering** - Filter courses by programming, design, data science, etc.

## 🎨 Customization

You can easily customize this learning platform:

### Content
- Add real course content and videos
- Include course progress tracking
- Add student dashboards
- Implement payment processing
- Include certificates and achievements

### Features
- Add user authentication and profiles
- Implement course enrollment system
- Add discussion forums
- Include progress tracking
- Add instructor dashboards

### UI/UX
- Customize color schemes and branding
- Add course preview videos
- Include student reviews and ratings
- Add course difficulty levels
- Implement advanced search filters

## 🔧 Technical Details

- Built with React 18 and TypeScript
- Uses Tailwind CSS for styling
- Lucide React for icons
- Responsive grid layouts
- Search and filtering functionality

## 🚀 Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your learning platform! 🎓

Visit: https://mornhub.dev
`,
      '.gitignore': `node_modules
dist
.DS_Store
*.log
.env.local`
    }
  }
}

function generatePortfolioApp(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { useState } from 'react'
import { Mail, Github, Linkedin, ExternalLink, Download, Menu, X, Home, User, Briefcase, Image, Phone } from 'lucide-react'

export default function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const projects = [
    {
      id: 1,
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with React, Node.js, and MongoDB. Features include user authentication, payment processing, and admin dashboard.',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      github: 'https://github.com',
      demo: 'https://demo.com'
    },
    {
      id: 2,
      title: 'Task Management App',
      description: 'A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features.',
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
      technologies: ['React', 'Firebase', 'Material-UI'],
      github: 'https://github.com',
      demo: 'https://demo.com'
    },
    {
      id: 3,
      title: 'Weather Dashboard',
      description: 'A responsive weather dashboard with location-based forecasts, interactive maps, and weather alerts.',
      image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=300&fit=crop',
      technologies: ['React', 'OpenWeather API', 'Chart.js'],
      github: 'https://github.com',
      demo: 'https://demo.com'
    },
    {
      id: 4,
      title: 'Social Media Analytics',
      description: 'A comprehensive analytics dashboard for social media performance tracking and content optimization.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
      technologies: ['React', 'D3.js', 'Node.js', 'PostgreSQL'],
      github: 'https://github.com',
      demo: 'https://demo.com'
    }
  ]

  const skills = [
    { name: 'JavaScript', level: 95 },
    { name: 'React', level: 90 },
    { name: 'Node.js', level: 85 },
    { name: 'Python', level: 80 },
    { name: 'TypeScript', level: 85 },
    { name: 'MongoDB', level: 75 },
    { name: 'AWS', level: 70 },
    { name: 'Docker', level: 65 }
  ]

  const experiences = [
    {
      title: 'Senior Full Stack Developer',
      company: 'Tech Corp',
      period: '2022 - Present',
      description: 'Led development of scalable web applications serving 100k+ users. Mentored junior developers and implemented CI/CD pipelines.'
    },
    {
      title: 'Frontend Developer',
      company: 'StartupXYZ',
      period: '2020 - 2022',
      description: 'Built responsive React applications and collaborated with design team to create pixel-perfect user interfaces.'
    },
    {
      title: 'Junior Developer',
      company: 'WebAgency',
      period: '2019 - 2020',
      description: 'Developed custom websites and web applications using modern JavaScript frameworks and best practices.'
    }
  ]

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    setIsMenuOpen(false)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-blue-600 transition-colors">Home</button>
              <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-blue-600 transition-colors">About</button>
              <button onClick={() => scrollToSection('skills')} className="text-gray-700 hover:text-blue-600 transition-colors">Skills</button>
              <button onClick={() => scrollToSection('projects')} className="text-gray-700 hover:text-blue-600 transition-colors">Projects</button>
              <button onClick={() => scrollToSection('experience')} className="text-gray-700 hover:text-blue-600 transition-colors">Experience</button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-blue-600 transition-colors">Contact</button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                <button onClick={() => scrollToSection('home')} className="text-left text-gray-700 hover:text-blue-600 transition-colors">Home</button>
                <button onClick={() => scrollToSection('about')} className="text-left text-gray-700 hover:text-blue-600 transition-colors">About</button>
                <button onClick={() => scrollToSection('skills')} className="text-left text-gray-700 hover:text-blue-600 transition-colors">Skills</button>
                <button onClick={() => scrollToSection('projects')} className="text-left text-gray-700 hover:text-blue-600 transition-colors">Projects</button>
                <button onClick={() => scrollToSection('experience')} className="text-left text-gray-700 hover:text-blue-600 transition-colors">Experience</button>
                <button onClick={() => scrollToSection('contact')} className="text-left text-gray-700 hover:text-blue-600 transition-colors">Contact</button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Hi, I'm <span className="text-blue-600">John Doe</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Full Stack Developer passionate about creating beautiful, functional, and user-centered digital experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => scrollToSection('projects')}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View My Work
              </button>
              <button className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-medium border-2 border-blue-600">
                Download CV
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">About Me</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face"
                  alt="Profile"
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Passionate Developer & Problem Solver</h3>
                <p className="text-gray-600 mb-6">
                  With over 5 years of experience in web development, I specialize in creating scalable applications
                  using modern technologies. I love turning complex problems into simple, beautiful, and intuitive solutions.
                </p>
                <p className="text-gray-600 mb-6">
                  When I'm not coding, you can find me exploring new technologies, contributing to open-source projects,
                  or sharing knowledge with the developer community.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Skills & Technologies</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {skills.map(skill => (
                <div key={skill.name} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-sm text-gray-500">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: \`\${skill.level}%\` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Featured Projects</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {projects.map(project => (
                <div key={project.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3">{project.title}</h3>
                    <p className="text-gray-600 mb-4">{project.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map(tech => (
                        <span key={tech} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <a
                        href={project.github}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        Code
                      </a>
                      <a
                        href={project.demo}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Live Demo
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Work Experience</h2>
            <div className="space-y-8">
              {experiences.map((exp, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <h3 className="text-xl font-bold">{exp.title}</h3>
                    <span className="text-blue-600 font-medium">{exp.period}</span>
                  </div>
                  <p className="text-gray-600 mb-2">{exp.company}</p>
                  <p className="text-gray-700">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Get In Touch</h2>
            <p className="text-xl text-gray-600 mb-12">
              I'm always interested in new opportunities and exciting projects. Let's connect!
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <Mail className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-600">john.doe@example.com</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <Phone className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold mb-2">Phone</h3>
                <p className="text-gray-600">+1 (555) 123-4567</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
                <Github className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold mb-2">GitHub</h3>
                <p className="text-gray-600">@johndoe</p>
              </div>
            </div>

            <div className="flex justify-center gap-6">
              <a href="#" className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href="#" className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 John Doe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## 🎨 Personal Portfolio

A modern, responsive portfolio website showcasing projects, skills, and experience with smooth scrolling navigation.

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✨ Features

✅ **Smooth Scrolling Navigation** - Single-page application with smooth section transitions
✅ **Responsive Design** - Works perfectly on all screen sizes with mobile menu
✅ **Project Showcase** - Featured projects with technologies, GitHub links, and live demos
✅ **Skills Visualization** - Progress bars showing proficiency levels
✅ **Experience Timeline** - Professional work history and achievements
✅ **Contact Information** - Multiple ways to get in touch

## 🎨 Customization

You can easily customize this portfolio:

### Personal Information
- Update name, bio, and contact details
- Add your own photo and branding
- Customize color schemes and fonts
- Include your social media links

### Content
- Replace projects with your own work
- Update skills and proficiency levels
- Add your work experience and education
- Include testimonials or recommendations

### Features
- Add a blog section
- Include a contact form
- Add project filtering
- Include downloadable resume
- Add animation effects

## 🔧 Technical Details

- Built with React 18 and TypeScript
- Uses Tailwind CSS for styling
- Lucide React for icons
- Smooth scrolling navigation
- Responsive design with mobile-first approach

## 🚀 Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your portfolio website! 🎨

Visit: https://mornhub.dev
`,
      '.gitignore': `node_modules
dist
.DS_Store
*.log
.env.local`
    }
  }
}

function generateBusinessApp(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { useState } from 'react'
import { Building, Users, TrendingUp, Award, Check, ArrowRight, Phone, Mail, MapPin, Menu, X } from 'lucide-react'

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const services = [
    {
      title: 'Digital Strategy',
      description: 'Comprehensive digital transformation strategies tailored to your business goals.',
      icon: TrendingUp
    },
    {
      title: 'Web Development',
      description: 'Custom web applications and websites built with modern technologies.',
      icon: Building
    },
    {
      title: 'Consulting',
      description: 'Expert consultation to optimize your business processes and operations.',
      icon: Users
    },
    {
      title: 'Analytics',
      description: 'Data-driven insights to make informed business decisions.',
      icon: Award
    }
  ]

  const stats = [
    { number: '500+', label: 'Projects Completed' },
    { number: '98%', label: 'Client Satisfaction' },
    { number: '50+', label: 'Team Members' },
    { number: '24/7', label: 'Support Available' }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      position: 'CEO, TechStart Inc.',
      content: 'Outstanding service and exceptional results. They transformed our digital presence completely.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=60&h=60&fit=crop&crop=face'
    },
    {
      name: 'Michael Chen',
      position: 'CTO, InnovateCorp',
      content: 'Professional team with cutting-edge solutions. Highly recommend their expertise.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
    },
    {
      name: 'Emily Davis',
      position: 'Director, GrowthCo',
      content: 'The best investment we made for our business. Results exceeded all expectations.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">BusinessCorp</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
              <a href="#services" className="text-gray-700 hover:text-blue-600 transition-colors">Services</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Testimonials</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
            </nav>

            <div className="flex items-center gap-4">
              <button className="hidden md:block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Get Quote
              </button>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                <a href="#home" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
                <a href="#services" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 transition-colors">Services</a>
                <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
                <a href="#testimonials" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 transition-colors">Testimonials</a>
                <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit">
                  Get Quote
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {prompt || 'Elevate Your Business'}
            </h1>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              We deliver innovative solutions that drive growth, optimize performance, and transform your business operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                Get Started
              </button>
              <button className="px-8 py-4 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprehensive solutions designed to accelerate your business growth and success.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service, index) => {
                const Icon = service.icon
                return (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                      Learn More
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  About BusinessCorp
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  With over a decade of experience in business consulting and digital transformation,
                  we have helped hundreds of companies achieve their goals and scale their operations.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  Our team of experts combines deep industry knowledge with cutting-edge technology
                  to deliver solutions that drive real business value.
                </p>

                <div className="space-y-4">
                  {[
                    'Proven track record of success',
                    'Expert team with diverse backgrounds',
                    'Commitment to client satisfaction',
                    'Innovation-driven approach'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop"
                  alt="Business meeting"
                  className="rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
              <p className="text-xl text-gray-600">
                Don't just take our word for it - hear from our satisfied clients.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.position}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.content}"</p>
                  <div className="flex text-yellow-400 mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Award key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Let's discuss how we can help you achieve your business objectives.
            </p>
            <button className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium">
              Get Started Today
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-xl text-gray-600">
                Get in touch with our team to discuss your project.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold mb-6">Get In Touch</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Phone</h4>
                      <p className="text-gray-600">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Email</h4>
                      <p className="text-gray-600">contact@businesscorp.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Address</h4>
                      <p className="text-gray-600">123 Business Ave, Suite 100<br />New York, NY 10001</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tell us about your project..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">BusinessCorp</span>
              </div>
              <p className="text-gray-400">
                Transforming businesses through innovative solutions and expert consulting.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Services</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Digital Strategy</a></li>
                <li><a href="#" className="hover:text-white">Web Development</a></li>
                <li><a href="#" className="hover:text-white">Consulting</a></li>
                <li><a href="#" className="hover:text-white">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">News</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Follow Us</h5>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white">LinkedIn</a>
                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BusinessCorp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## 🏢 Business Website

A professional business website with services, testimonials, contact form, and modern design.

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✨ Features

✅ **Professional Design** - Clean, corporate website with modern UI
✅ **Services Section** - Showcase your business services with icons
✅ **Testimonials** - Client reviews and ratings
✅ **Contact Form** - Functional contact form with validation
✅ **Responsive Layout** - Works perfectly on all devices
✅ **Business Statistics** - Display company achievements and metrics

## 🎨 Customization

You can easily customize this business website:

### Branding
- Update company name and logo
- Change color scheme (currently blue theme)
- Modify typography and fonts
- Add your own branding elements

### Content
- Replace services with your offerings
- Update testimonials with real client feedback
- Add your contact information
- Include company statistics and achievements

### Features
- Add blog/news section
- Include team member profiles
- Add case studies or portfolio
- Implement newsletter signup
- Add appointment booking

## 🔧 Technical Details

- Built with React 18 and TypeScript
- Uses Tailwind CSS for styling
- Lucide React for icons
- Responsive design with mobile navigation
- Form handling and validation

## 🚀 Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your business website! 🏢

Visit: https://mornhub.dev
`,
      '.gitignore': `node_modules
dist
.DS_Store
*.log
.env.local`
    }
  }
}

function generateGamePage(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      ...generateGenericApp(prompt, projectName).files,
      'src/App.tsx': `import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Trophy, Target, Zap } from 'lucide-react'

export default function App() {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'paused' | 'gameOver'>('waiting')
  const [targets, setTargets] = useState<Array<{id: number, x: number, y: number, points: number}>>([])

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameStatus('gameOver')
      setIsPlaying(false)
    }
  }, [timeLeft, isPlaying])

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setTargets(prev => [
          ...prev.slice(-2), // Keep only last 2 targets
          {
            id: Date.now(),
            x: Math.random() * 80 + 10,
            y: Math.random() * 60 + 20,
            points: Math.floor(Math.random() * 50) + 10
          }
        ])
      }, 1500)

      return () => clearInterval(interval)
    }
  }, [isPlaying])

  const startGame = () => {
    setScore(0)
    setTimeLeft(60)
    setTargets([])
    setGameStatus('playing')
    setIsPlaying(true)
  }

  const pauseGame = () => {
    setIsPlaying(!isPlaying)
    setGameStatus(isPlaying ? 'paused' : 'playing')
  }

  const resetGame = () => {
    setIsPlaying(false)
    setGameStatus('waiting')
    setScore(0)
    setTimeLeft(60)
    setTargets([])
  }

  const hitTarget = (targetId: number, points: number) => {
    setScore(prev => prev + points)
    setTargets(prev => prev.filter(t => t.id !== targetId))
  }

  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'waiting': return 'Click Play to start!'
      case 'paused': return 'Game Paused'
      case 'gameOver': return 'Game Over!'
      default: return 'Playing...'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-center">
            {prompt || 'Game Page'} 🎮
          </h1>
        </div>
      </header>

      {/* Game Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-sm opacity-80">Score</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <div className="text-2xl font-bold">{timeLeft}</div>
            <div className="text-sm opacity-80">Time Left</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold">{targets.length}</div>
            <div className="text-sm opacity-80">Targets</div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {gameStatus === 'waiting' || gameStatus === 'gameOver' ? (
            <button
              onClick={startGame}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              <Play className="w-5 h-5" />
              {gameStatus === 'gameOver' ? 'Play Again' : 'Start Game'}
            </button>
          ) : (
            <button
              onClick={pauseGame}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? 'Pause' : 'Resume'}
            </button>
          )}
          
          <button
            onClick={resetGame}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {/* Game Status */}
        <div className="text-center mb-6">
          <div className="text-xl font-semibold">{getStatusMessage()}</div>
        </div>

        {/* Game Area */}
        <div className="relative bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 h-96 overflow-hidden">
          {/* Game Instructions */}
          {gameStatus === 'waiting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold mb-2">Target Practice Game</h2>
                <p className="text-lg opacity-80 mb-4">
                  Click on targets to score points!<br />
                  You have 60 seconds to get the highest score.
                </p>
                <div className="text-sm opacity-60">
                  Different targets give different points
                </div>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {gameStatus === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                <p className="text-xl mb-4">Final Score: <span className="text-yellow-400 font-bold">{score}</span></p>
                <div className="text-sm opacity-80">
                  {score > 500 ? 'Excellent!' : score > 300 ? 'Great job!' : score > 100 ? 'Good effort!' : 'Keep practicing!'}
                </div>
              </div>
            </div>
          )}

          {/* Targets */}
          {isPlaying && targets.map(target => (
            <button
              key={target.id}
              onClick={() => hitTarget(target.id, target.points)}
              className="absolute w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg hover:scale-110 transition-transform animate-pulse border-2 border-white/30"
              style={{
                left: \`\${target.x}%\`,
                top: \`\${target.y}%\`,
              }}
              title={\`+\${target.points} points\`}
            >
              <div className="text-white font-bold text-sm">
                {target.points}
              </div>
            </button>
          ))}

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 text-2xl">🎯</div>
            <div className="absolute top-8 right-8 text-xl">⭐</div>
            <div className="absolute bottom-8 left-8 text-xl">🎮</div>
            <div className="absolute bottom-4 right-4 text-2xl">🏆</div>
          </div>
        </div>

        {/* Game Info */}
        <div className="mt-6 text-center text-sm opacity-80">
          <p>Click on targets to score points • Higher targets = more points • Beat your high score!</p>
        </div>
      </div>
    </div>
  )
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## 🎮 Game Description

This is an interactive target practice game where you click on targets to score points within a time limit.

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 How to Play

1. Click "Start Game" to begin
2. Click on targets that appear to score points
3. Try to get the highest score in 60 seconds
4. Use "Pause" to pause the game
5. Click "Reset" to start over

## 🏆 Scoring

- Different targets give different point values (10-60 points)
- The faster you click, the more targets you can hit
- Try to beat your high score!

## 🛠️ Customization

You can easily customize this game:

### Add New Game Mechanics
- Edit \`src/App.tsx\` to add power-ups
- Modify target spawning logic
- Add sound effects
- Implement high score saving

### Styling
- Update colors in the gradient backgrounds
- Change target appearance
- Add animations
- Modify the game area size

### Game Rules
- Adjust time limit (change \`timeLeft\` initial value)
- Modify target spawn rate (change interval in useEffect)
- Change point values for different target types

## 🎨 Features

✅ **Interactive Gameplay** - Click targets to score points  
✅ **Timer System** - 60-second countdown  
✅ **Score Tracking** - Real-time score updates  
✅ **Pause/Resume** - Control game state  
✅ **Responsive Design** - Works on all screen sizes  
✅ **Modern UI** - Beautiful gradient design with glassmorphism  
✅ **Game States** - Waiting, playing, paused, game over  
✅ **Target Spawning** - Dynamic target generation  

## 🎮 Game Controls

- **Start Game**: Click the green "Start Game" button
- **Pause**: Click "Pause" to pause/resume
- **Reset**: Click "Reset" to restart
- **Hit Targets**: Click on red targets to score points

## 🔧 Technical Details

- Built with React 18 and TypeScript
- Uses Tailwind CSS for styling
- Lucide React for icons
- State management with React hooks
- Responsive design with CSS Grid

## 🚀 Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your game! 🎮

Visit: https://mornhub.dev
`
    }
  }
}

function generateGenericApp(prompt: string, projectName: string, parsedPrompt: ParsedPrompt): GeneratedProject {
  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          vite: '^5.0.0',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { Sparkles } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12">
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          {prompt || 'Your App Idea Here'}
        </h1>
        
        <p className="text-center text-gray-600 mb-8">
          This is your generated frontend application. Customize it to match your vision!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium">
            Get Started
          </button>
          <button className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your generated app! 🚀
`,
      '.gitignore': `node_modules
dist
.DS_Store
*.log
.env.local`
    }
  }
}

