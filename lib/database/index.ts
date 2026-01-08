// lib/database/index.ts
// 数据库切换配置 - 支持国内版(腾讯云CloudBase)和国际版(Supabase)

import { supabaseAdmin as supabaseAdminClient } from '../supabase';
import { tencentCloudDB } from './tencent-cloud';
import { cloudbaseDB } from './cloudbase';
import { supabaseDB } from './supabase';

// 数据库提供商类型
export type DatabaseProvider = 'supabase' | 'tencent-cloud' | 'cloudbase';

// 获取当前数据库提供商
export function getDatabaseProvider(): DatabaseProvider {
  const provider = process.env.DATABASE_PROVIDER || 'cloudbase';

  // 验证环境变量
  if (provider === 'supabase') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('your-project-id') || key.includes('your-supabase')) {
      console.warn('⚠️ Supabase配置不完整,回退到CloudBase');
      return 'cloudbase';
    }
    console.log('🌍 国际版模式 - 使用Supabase数据库');
    return 'supabase';
  }

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
    case 'supabase':
      return supabaseDB;
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
    case 'supabase':
      const { SupabaseUserAdapter } = await import('./adapters/supabase-user');
      return new SupabaseUserAdapter();
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
    case 'supabase':
      // Supabase连接测试
      const { testConnection: testSupabaseConnection } = await import('./supabase');
      return await testSupabaseConnection();
    default:
      console.error(`❌ 未知的数据库提供商: ${provider}`);
      return false;
  }
}

// 导出数据库提供商信息
export { getDatabaseProvider };
