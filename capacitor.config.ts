import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mornfront.app',
  appName: 'mornfront',
  webDir: 'public',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true,
    // 在开发时连接本地服务器,生产环境连接实际服务器
    url: process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:3000',
    // 允许导航到任何URL
    allowNavigation: [
      '*'
    ],
    // 配置 CORS 和网络安全
    cleartext: true,
  },
  android: {
    buildOptions: {
      signingType: 'apksigner'
    }
  }
};

export default config;
