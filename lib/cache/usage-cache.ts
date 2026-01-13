// localStorage 缓存生成次数
const CACHE_KEY = 'usage-remaining';
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

interface UsageCache {
  remaining: number;
  timestamp: number;
}

export function getUsageCache(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: UsageCache = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data.remaining;
  } catch {
    return null;
  }
}

export function setUsageCache(remaining: number): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(CACHE_KEY, JSON.stringify({
    remaining,
    timestamp: Date.now()
  }));
}

export function decrementUsageCache(): void {
  const current = getUsageCache();
  if (current !== null && current > 0) {
    setUsageCache(current - 1);
  }
}

export function clearUsageCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_KEY);
}
