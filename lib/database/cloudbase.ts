// lib/database/cloudbase.ts
// 腾讯云CloudBase数据库配置和连接

// 只在服务器端导入CloudBase SDK
let cloudbase: any;
if (typeof window === 'undefined') {
  cloudbase = require('@cloudbase/node-sdk');
};

// CloudBase配置接口
export interface CloudBaseConfig {
  secretId: string;
  secretKey: string;
  envId: string;
}

// 从环境变量获取CloudBase配置
function getCloudBaseConfig(): CloudBaseConfig | null {
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
  // 在客户端环境中不创建CloudBase实例
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
export function getDatabase() {
  const app = getCloudBaseApp();
  if (!app) {
    return null;
  }

  try {
    return app.database();
  } catch (error) {
    console.error('❌ 获取CloudBase数据库实例失败:', error);
    return null;
  }
}

/**
 * 执行数据库查询
 */
export async function query(collectionName: string, options: any = {}) {
  // 在客户端环境中抛出错误
  if (typeof window !== 'undefined') {
    throw new Error('CloudBase数据库查询只能在服务器端使用');
  }

  const db = getDatabase();
  if (!db) {
    throw new Error('数据库连接不可用');
  }

  try {
    const collection = db.collection(collectionName);
    let query = collection;

    // 应用查询条件
    if (options.where) {
      query = query.where(options.where);
    }

    // 应用排序
    if (options.orderBy && options.orderDirection) {
      query = query.orderBy(options.orderBy, options.orderDirection);
    }

    // 应用限制
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // 应用偏移
    if (options.offset) {
      query = query.skip(options.offset);
    }

    const result = await query.get();
    return {
      data: result.data || [],
      requestId: result.requestId,
    };
  } catch (error: any) {
    console.error('CloudBase数据库查询错误:', error);

    // 如果是集合不存在的错误，返回空结果而不是抛出错误
    if (error.message && (error.message.includes('DATABASE_COLLECTION_NOT_EXIST') ||
                          error.message.includes('Db or Table not exist'))) {
      console.warn(`集合 ${collectionName} 不存在，返回空结果`);
      return {
        data: [],
        requestId: 'collection-not-found',
      };
    }

    throw error;
  }
}

/**
 * 添加文档
 */
export async function add(collectionName: string, data: any) {
  // 在客户端环境中抛出错误
  if (typeof window !== 'undefined') {
    throw new Error('CloudBase数据库操作只能在服务器端使用');
  }

  const db = getDatabase();
  if (!db) {
    throw new Error('数据库连接不可用');
  }

  try {
    const collection = db.collection(collectionName);
    const result = await collection.add(data);
    return {
      id: result.id,
      requestId: result.requestId,
    };
  } catch (error: any) {
    console.error('CloudBase数据库添加错误:', error);

    // 如果是集合不存在的错误，尝试创建集合后重试
    if (error.message && (error.message.includes('DATABASE_COLLECTION_NOT_EXIST') || error.message.includes('Db or Table not exist'))) {
      console.log(`集合 ${collectionName} 不存在，尝试创建...`);

      try {
        // CloudBase会在第一次插入数据时自动创建集合
        // 这里我们直接重试插入操作
        const collection = db.collection(collectionName);
        const result = await collection.add(data);
        console.log(`集合 ${collectionName} 创建成功并插入数据，文档ID: ${result.id}`);
        return {
          id: result.id,
          requestId: result.requestId,
        };
      } catch (retryError: any) {
        console.error(`重试创建集合 ${collectionName} 失败:`, retryError.message);
        console.error('错误详情:', retryError);

        // 如果重试仍然失败，返回更友好的错误信息
        if (retryError.message && (retryError.message.includes('DATABASE_COLLECTION_NOT_EXIST') || retryError.message.includes('Db or Table not exist'))) {
          throw new Error(`数据库集合 ${collectionName} 无法访问。请在CloudBase控制台创建该集合并设置适当的权限。`);
        }

        throw retryError;
      }
    }

    throw error;
  }
}

/**
 * 更新文档
 */
export async function update(collectionName: string, docId: string, data: any) {
  // 在客户端环境中抛出错误
  if (typeof window !== 'undefined') {
    throw new Error('CloudBase数据库操作只能在服务器端使用');
  }

  const db = getDatabase();
  if (!db) {
    throw new Error('数据库连接不可用');
  }

  try {
    const collection = db.collection(collectionName);
    const result = await collection.doc(docId).update(data);
    return {
      updated: result.updated,
      requestId: result.requestId,
    };
  } catch (error: any) {
    console.error('CloudBase数据库更新错误:', error);

    // 如果是集合不存在的错误，返回错误（因为更新需要集合已存在）
    if (error.message && error.message.includes('DATABASE_COLLECTION_NOT_EXIST')) {
      console.warn(`集合 ${collectionName} 不存在，无法更新文档`);
      throw new Error(`集合 ${collectionName} 不存在`);
    }

    throw error;
  }
}

/**
 * 删除文档
 */
export async function remove(collectionName: string, docId: string) {
  // 在客户端环境中抛出错误
  if (typeof window !== 'undefined') {
    throw new Error('CloudBase数据库操作只能在服务器端使用');
  }

  const db = getDatabase();
  if (!db) {
    throw new Error('数据库连接不可用');
  }

  try {
    const collection = db.collection(collectionName);
    const result = await collection.doc(docId).remove();
    return {
      deleted: result.deleted,
      requestId: result.requestId,
    };
  } catch (error) {
    console.error('CloudBase数据库删除错误:', error);
    throw error;
  }
}

/**
 * 测试数据库连接
 */
export async function testConnection(): Promise<boolean> {
  // 在客户端环境中返回false
  if (typeof window !== 'undefined') {
    console.warn('CloudBase连接测试只能在服务器端进行');
    return false;
  }

  try {
    // 尝试查询payments集合
    const result = await query('payments', { limit: 1 });
    console.log('✅ 腾讯云CloudBase数据库连接测试成功');
    console.log(`   数据库环境: ${process.env.TENCENT_CLOUD_ENV_ID}`);
    return true;
  } catch (error) {
    console.error('❌ 腾讯云CloudBase数据库连接测试失败:', error);
    return false;
  }
}

// 兼容现有代码的接口
export const cloudbaseDB = {
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          try {
            const result = await query(table, {
              where: { [column]: value },
              limit: 1
            });
            return {
              data: result.data[0] || null,
              error: null
            };
          } catch (error) {
            return {
              data: null,
              error
            };
          }
        }
      }),
      single: async () => {
        try {
          const result = await query(table, { limit: 1 });
          return {
            data: result.data[0] || null,
            error: null
          };
        } catch (error) {
          return {
            data: null,
            error
          };
        }
      }
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          try {
            const result = await add(table, data);
            return {
              data: { id: result.id },
              error: null
            };
          } catch (error) {
            return {
              data: null,
              error
            };
          }
        }
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          try {
            // CloudBase需要先查询获取文档ID
            const queryResult = await query(table, {
              where: { [column]: value },
              limit: 1
            });

            if (queryResult.data.length === 0) {
              return {
                data: null,
                error: new Error('Document not found')
              };
            }

            const docId = queryResult.data[0]._id;
            const result = await update(table, docId, data);
            return {
              data: { updated: result.updated },
              error: null
            };
          } catch (error) {
            return {
              data: null,
              error
            };
          }
        }
      })
    }),
    upsert: (data: any) => ({
      single: async () => {
        try {
          // CloudBase没有原生的upsert，需要手动实现
          // 这里简化为直接添加（如果需要upsert，需要更复杂的逻辑）
          const result = await add(table, data);
          return {
            data: { id: result.id },
            error: null
          };
        } catch (error) {
          return {
            data: null,
            error
          };
        }
      }
    })
  })
};

export default cloudbaseDB;
