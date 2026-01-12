// lib/database/index.ts
// 数据库切换配置 - 支持国内版(腾讯云CloudBase)和国际版(Supabase)

import { tencentCloudDB } from './tencent-cloud';
import { cloudbaseDB } from './cloudbase';
import { supabaseDB } from './supabase';

// 数据库提供商类型
export type DatabaseProvider = 'tencent-cloud' | 'cloudbase' | 'supabase';

// 获取当前数据库提供商
export function getDatabaseProvider(): DatabaseProvider {
  const provider = process.env.DATABASE_PROVIDER || 'cloudbase';

  if (provider === 'supabase') {
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
    case 'supabase':
      return supabaseDB;
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
    case 'supabase':
      // Supabase连接测试
      const { testConnection: testSupabaseConnection } = await import('./supabase');
      return await testSupabaseConnection();
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

// 允许的表名白名单
const ALLOWED_TABLES = ['users', 'user_subscriptions', 'usage_records', 'tasks', 'sessions'];

// 验证表名
function validateTableName(tableName: string): string {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }
  return tableName;
}

// 验证列名（只允许字母、数字、下划线）
function validateColumnName(columnName: string): string {
  if (!/^[a-zA-Z0-9_]+$/.test(columnName)) {
    throw new Error(`Invalid column name: ${columnName}`);
  }
  return columnName;
}

// 统一的数据添加函数 - 支持所有数据库提供商
export async function add(tableName: string, data: any) {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      const { add: supabaseAdd } = await import('./supabase');
      return await supabaseAdd(tableName, data);
    case 'cloudbase':
      const { add: cloudbaseAdd } = await import('./cloudbase');
      return await cloudbaseAdd(tableName, data);
    case 'tencent-cloud':
      // 腾讯云PostgreSQL使用INSERT语句
      const { query } = await import('./tencent-cloud');
      const validatedTable = validateTableName(tableName);
      const columns = Object.keys(data).map(validateColumnName).join(', ');
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const result = await query(
        `INSERT INTO ${validatedTable} (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return { id: result[0]?.id, data: result[0] };
    default:
      throw new Error(`Unknown database provider: ${provider}`);
  }
}

// 统一的查询函数 - 支持所有数据库提供商
export async function query(tableName: string, options: any = {}) {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      const { query: supabaseQuery } = await import('./supabase');
      return await supabaseQuery(tableName, options);
    case 'cloudbase':
      const { query: cloudbaseQuery } = await import('./cloudbase');
      return await cloudbaseQuery(tableName, options);
    case 'tencent-cloud':
      // 腾讯云PostgreSQL查询
      const { query: tencentQuery } = await import('./tencent-cloud');
      const validatedTable = validateTableName(tableName);
      // 构建SELECT查询
      let queryStr = `SELECT * FROM ${validatedTable}`;
      const params: any[] = [];

      if (options.where) {
        const conditions = Object.entries(options.where).map(([key, value]) => {
          params.push(value);
          return `${validateColumnName(key)} = $${params.length}`;
        });
        queryStr += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (options.orderBy) {
        queryStr += ` ORDER BY ${validateColumnName(options.orderBy)}`;
        if (options.orderDirection === 'desc') {
          queryStr += ' DESC';
        }
      }

      if (options.limit) {
        queryStr += ` LIMIT ${options.limit}`;
      }

      const result = await tencentQuery(queryStr, params);
      return { data: result, error: null };
    default:
      throw new Error(`Unknown database provider: ${provider}`);
  }
}

// 统一的更新函数 - 支持所有数据库提供商
export async function update(tableName: string, docId: string, data: any) {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      const { update: supabaseUpdate } = await import('./supabase');
      return await supabaseUpdate(tableName, docId, data);
    case 'cloudbase':
      const { update: cloudbaseUpdate } = await import('./cloudbase');
      return await cloudbaseUpdate(tableName, docId, data);
    case 'tencent-cloud':
      const { query: tencentQuery } = await import('./tencent-cloud');
      const validatedTable = validateTableName(tableName);
      const updates = Object.entries(data).map(([key, value], index) => {
        return `${validateColumnName(key)} = $${index + 2}`;
      }).join(', ');
      const result = await tencentQuery(
        `UPDATE ${validatedTable} SET ${updates} WHERE id = $1 RETURNING *`,
        [docId, ...Object.values(data)]
      );
      return { data: result[0], error: null };
    default:
      throw new Error(`Unknown database provider: ${provider}`);
  }
}

// 统一的删除函数 - 支持所有数据库提供商
export async function remove(tableName: string, docId: string) {
  const provider = getDatabaseProvider();

  switch (provider) {
    case 'supabase':
      const { remove: supabaseRemove } = await import('./supabase');
      return await supabaseRemove(tableName, docId);
    case 'cloudbase':
      const { remove: cloudbaseRemove } = await import('./cloudbase');
      return await cloudbaseRemove(tableName, docId);
    case 'tencent-cloud':
      const { query: tencentQuery } = await import('./tencent-cloud');
      const validatedTable = validateTableName(tableName);
      await tencentQuery(`DELETE FROM ${validatedTable} WHERE id = $1`, [docId]);
      return { success: true, error: null };
    default:
      throw new Error(`Unknown database provider: ${provider}`);
  }
}
