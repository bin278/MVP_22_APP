import cloudbase from '@cloudbase/js-sdk';

// CloudBase应用实例
let app: any = null;
// CloudBase认证实例
let authInstance: any = null;

// 初始化CloudBase应用
export async function initializeCloudBase(): Promise<any> {
  console.log('🚀 开始CloudBase初始化...');

  // 检查是否应该使用 Supabase 而不是 CloudBase
  const authProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER;
  console.log('🔍 认证提供商检查:', authProvider);

  if (authProvider === 'supabase') {
    console.log('🌍 检测到国际版配置 (Supabase)，跳过 CloudBase 初始化');
    return null;
  }

  if (!app && typeof window !== 'undefined') {
    try {
      console.log('📡 正在获取环境变量...');

      // 清除环境变量缓存，确保获取最新值
      if (process.env.NODE_ENV === 'development') {
        const { clearEnvCache } = await import('./env-client');
        clearEnvCache();
      }

      // 从API异步获取环境变量
      const { getPublicEnv } = await import('./env-client');
      const env = await getPublicEnv();
      const envId = env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID;

      console.log('🔍 CloudBase初始化 - 环境变量检查:');
      console.log('   NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID:', envId);
      console.log('   NEXT_PUBLIC_APP_URL:', env.NEXT_PUBLIC_APP_URL);
      console.log('   WECHAT_APP_ID:', env.WECHAT_APP_ID);


      console.log('🔧 使用CloudBase环境ID:', envId);

      // 验证环境ID是否存在
      if (!envId || envId.trim() === '') {
        console.error('❌ CloudBase环境ID为空，无法初始化');
        console.error('请检查环境变量 NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID 是否正确配置');
        return null;
      }

      // CloudBase JS SDK v2 初始化方式
      // 参考: https://docs.cloudbase.net/api-reference/web/v2/initialization
      const initOptions = {
        env: envId.trim(),
      };

      console.log('🔧 CloudBase初始化参数:', initOptions);
      app = cloudbase.init(initOptions);

      console.log('✅ CloudBase前端SDK初始化成功，环境ID:', envId);

    } catch (error) {
      console.error('❌ CloudBase初始化失败:', error);
      console.error('错误详情:', error.message, error.stack);
      return null;
    }
  }
  return app;
}

// 获取CloudBase应用实例
export async function getCloudBaseApp(): Promise<any> {
  if (!app) {
    return await initializeCloudBase();
  }
  return app;
}

// 获取认证实例（确保只有一个实例）
export async function getAuth(): Promise<any> {
  if (!authInstance) {
    const app = await getCloudBaseApp();
    if (app) {
      authInstance = app.auth();
      console.log('CloudBase认证实例创建成功');
    } else {
      console.error('无法创建认证实例：CloudBase应用未初始化');
    }
  }
  return authInstance;
}

// 获取数据库实例
export async function getDatabase(): Promise<any> {
  const app = await getCloudBaseApp();
  return app?.database();
}
