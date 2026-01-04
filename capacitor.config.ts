import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mornfront.android.app',
  appName: 'mornfront',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // 本地构建模式:不设置 url,加载 public 目录
    // 这样 Capacitor JS 会注入,微信 SDK 可用
    // 开发环境：设置环境变量 export CAPACITOR_SERVER_URL=http://10.0.2.2:3000
    // 允许导航到 CloudBase 域名进行 API 调用
    allowNavigation: [
      '*',
      'https://mornfront.mornscience.top',
      'https://*.tcb.qcloud.la',
      'https://*.cloudbase.net',
      'https://*.cloud.tencent.com'
    ],
  },
  android: {
    buildOptions: {
      signingType: 'apksigner'
    }
  },
  plugins: {
    WeChat: {
      appId: process.env.WECHAT_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID || '',
      appName: 'mornfront',
      debug: false
    }
  }
};

export default config;
