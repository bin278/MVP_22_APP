// 腾讯云CloudBase SDK配置（服务端使用）
let cloudbase: any;
if (typeof window === 'undefined') {
  cloudbase = require('@cloudbase/node-sdk');
}

// 获取CloudBase配置
function getCloudBaseConfig() {
  const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
  const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;
  const envId = process.env.TENCENT_CLOUD_ENV_ID;

  if (!secretId || !secretKey || !envId) {
    console.warn('腾讯云CloudBase配置不完整');
    return null;
  }

  return {
    secretId,
    secretKey,
    envId,
  };
}

// CloudBase 应用实例
let app: any = null;

/**
 * 获取CloudBase应用实例
 */
export function getCloudBaseApp() {
  if (typeof window !== 'undefined') {
    console.warn('CloudBase SDK不可在客户端使用');
    return null;
  }

  if (!app) {
    const config = getCloudBaseConfig();
    if (!config) {
      console.error('无法获取腾讯云CloudBase配置');
      return null;
    }

    if (!cloudbase) {
      console.error('CloudBase SDK未加载');
      return null;
    }

    try {
      app = cloudbase.init({
        secretId: config.secretId,
        secretKey: config.secretKey,
        env: config.envId,
      });
      console.log('📊 腾讯云CloudBase连接已建立');
    } catch (error) {
      console.error('❌ 创建CloudBase应用实例失败:', error);
      return null;
    }
  }

  return app;
}

/**
 * 获取数据库实例
 */
export function database() {
  const app = getCloudBaseApp();
  if (!app) {
    throw new Error('CloudBase应用实例不可用');
  }

  try {
    return app.database();
  } catch (error) {
    console.error('❌ 获取CloudBase数据库实例失败:', error);
    throw error;
  }
}

// 导出CloudBase SDK
export { cloudbase };





