/**
 * 获取基础URL（支持Vercel部署）
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // 浏览器环境
    return window.location.origin;
  }

  // 服务器环境
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 开发环境
  return `http://localhost:${process.env.PORT || 3000}`;
}
