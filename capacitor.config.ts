import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mornfront.app',
  appName: 'mornfront',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // 生产环境：连接 CloudBase 网站
    // 开发环境：连接本地开发服务器
    url: process.env.CAPACITOR_SERVER_URL || 'https://mornfront.mornscience.top',
    // 开发环境：export CAPACITOR_SERVER_URL=http://10.0.2.2:3000
    // 允许导航到 CloudBase 域名
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
