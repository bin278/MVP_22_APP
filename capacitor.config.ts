import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mornfront.android.app',
  appName: 'mornfront',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
    // 关键配置：使用本地路径 + 允许导航到远程
    // 这会让 Capacitor 注入 JS,同时允许访问远程 API
    url: 'https://mornfront.mornscience.top',
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
