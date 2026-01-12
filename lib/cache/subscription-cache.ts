// 简单的内存缓存，用于订阅计划数据
interface CacheEntry {
  data: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

export function getCachedPlan(userId: string): string | null {
  const entry = cache.get(userId);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(userId);
    return null;
  }

  return entry.data;
}

export function setCachedPlan(userId: string, plan: string): void {
  cache.set(userId, {
    data: plan,
    timestamp: Date.now()
  });
}

export function invalidatePlanCache(userId: string): void {
  cache.delete(userId);
}
