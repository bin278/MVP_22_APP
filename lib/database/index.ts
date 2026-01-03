// lib/database/index.ts
// 数据库切换配置

import { supabaseAdmin as supabaseAdminClient } from '../supabase';
import { tencentCloudDB } from './tencent-cloud';
import { cloudbaseDB } from './cloudbase';

// 数据库提供商
export type DatabaseProvider = 'supabase' | 'tencent-cloud' | 'cloudbase';

// 获取当前数据库提供商
function getDatabaseProvider(): DatabaseProvider {
  const provider = process.env.DATABASE_PROVIDER || 'supabase';
  return provider as DatabaseProvider;
}

// 根据配置选择数据库客户端
export function getDatabaseClient() {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'tencent-cloud':
      console.log('📊 使用腾讯云PostgreSQL数据库');
      return tencentCloudDB;
    case 'cloudbase':
      console.log('📊 使用腾讯云CloudBase数据库');
      return cloudbaseDB;
    case 'supabase':
    default:
      console.log('📊 使用Supabase数据库');
      return supabaseAdminClient;
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
      // TODO: 实现腾讯云用户适配器
      throw new Error('Tencent Cloud user adapter not implemented yet');
    case 'supabase':
    default:
      // TODO: 实现Supabase用户适配器
      throw new Error('Supabase user adapter not implemented yet');
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
    default:
      // Supabase连接测试
      try {
        if (!supabaseAdminClient) {
          console.error('❌ Supabase客户端未初始化');
          return false;
        }

        // 尝试一个简单的查询
        const result = await supabaseAdminClient
          .from('payments')
          .select('count', { count: 'exact', head: true });

        console.log('✅ Supabase数据库连接测试成功');
        return true;
      } catch (error) {
        console.error('❌ Supabase数据库连接测试失败:', error);
        return false;
      }
  }
}

// 导出数据库提供商信息
export { getDatabaseProvider };
