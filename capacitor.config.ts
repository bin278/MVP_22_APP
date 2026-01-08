import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mornfront.android.app',
  appName: 'mornfront',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // 远程 URL 模式:加载远程网站
    // 这样内容可以实时更新,但微信 SDK 不可用
    url: 'https://mornfront.mornscience.top',
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
