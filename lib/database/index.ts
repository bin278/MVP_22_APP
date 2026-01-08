// lib/database/index.ts
// 数据库切换配置 - 支持国内版(腾讯云CloudBase)

import { tencentCloudDB } from './tencent-cloud';
import { cloudbaseDB } from './cloudbase';

// 数据库提供商类型
export type DatabaseProvider = 'tencent-cloud' | 'cloudbase';

// 获取当前数据库提供商
export function getDatabaseProvider(): DatabaseProvider {
  const provider = process.env.DATABASE_PROVIDER || 'cloudbase';

  if (provider === 'tencent-cloud') {
    console.log('🇨🇳 国内版模式 - 使用腾讯云PostgreSQL数据库');
    return 'tencent-cloud';
  }

  // 默认使用CloudBase(国内版)
  console.log('🇨🇳 国内版模式 - 使用腾讯云CloudBase数据库');
  return 'cloudbase';
}

// 根据配置选择数据库客户端
export function getDatabaseClient() {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'tencent-cloud':
      return tencentCloudDB;
    case 'cloudbase':
      return cloudbaseDB;
    default:
      return cloudbaseDB;
  }
}

// 导出统一的数据库客户端
export const supabaseAdmin = getDatabaseClient();

// 获取用户数据库适配器
export async function getUserAdapter() {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'cloudbase':
      const { CloudBaseUserAdapter } = await import('./adapters/cloudbase-user');
      return new CloudBaseUserAdapter();
    case 'tencent-cloud':
      // TODO: 实现腾讯云PostgreSQL用户适配器
      throw new Error('Tencent Cloud PostgreSQL user adapter not implemented yet');
    default:
      throw new Error(`Unknown database provider: ${provider}`);
  }
}

// 导出测试连接函数
export async function testDatabaseConnection(): Promise<boolean> {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'tencent-cloud':
      // 动态导入腾讯云测试函数
      const { testConnection } = await import('./tencent-cloud');
      return await testConnection();
    case 'cloudbase':
      // CloudBase连接测试
      const { testConnection: testCloudBaseConnection } = await import('./cloudbase');
      return await testCloudBaseConnection();
    default:
      console.error(`❌ 未知的数据库提供商: ${provider}`);
      return false;
  }
}
