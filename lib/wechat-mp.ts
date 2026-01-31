/**
 * 微信小程序登录工具库
 */

interface WxMiniProgram {
  postMessage?: (data: unknown) => void;
  navigateTo?: (options: { url: string }) => void;
  navigateBack?: (options?: { delta?: number }) => void;
  getEnv?: (callback: (res: { miniprogram: boolean }) => void) => void;
}

declare global {
  interface Window {
    wx?: { miniProgram?: WxMiniProgram };
    __wxjs_environment?: string;
  }
}

/** 检测是否在微信小程序环境中（同步快速检测） */
export function isMiniProgram(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  console.log('[wechat-mp] User-Agent:', ua);
  if (ua.includes("miniprogram")) {
    console.log('[wechat-mp] Detected miniprogram from UA');
    return true;
  }
  if (window.__wxjs_environment === "miniprogram") {
    console.log('[wechat-mp] Detected miniprogram from __wxjs_environment');
    return true;
  }
  // 检查 URL 参数
  const params = new URLSearchParams(window.location.search);
  if (params.get("_wxjs_environment") === "miniprogram") {
    console.log('[wechat-mp] Detected miniprogram from URL param');
    return true;
  }
  console.log('[wechat-mp] Not in miniprogram environment');
  return false;
}

/** 获取微信小程序 SDK 对象 */
export function getWxMiniProgram(): WxMiniProgram | null {
  if (typeof window === "undefined") return null;
  const wxObj = window.wx;
  if (!wxObj || typeof wxObj !== "object") return null;
  const mp = wxObj.miniProgram;
  if (!mp || typeof mp !== "object") return null;
  return mp;
}

/** 等待微信 JS SDK 加载完成 */
export function waitForWxSDK(timeout = 3000): Promise<WxMiniProgram | null> {
  return new Promise((resolve) => {
    const mp = getWxMiniProgram();
    if (mp) {
      resolve(mp);
      return;
    }
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const mp = getWxMiniProgram();
      if (mp) {
        clearInterval(checkInterval);
        resolve(mp);
        return;
      }
      if (Date.now() - startTime >= timeout) {
        clearInterval(checkInterval);
        resolve(null);
      }
    }, 100);
  });
}

/** 登录回调数据 */
export interface WxMpLoginCallback {
  token: string | null;
  openid: string | null;
  expiresIn: string | null;
  nickName: string | null;
  avatarUrl: string | null;
  code: string | null;
}

/** 解析 URL 参数中的登录回调数据 */
export function parseWxMpLoginCallback(): WxMpLoginCallback | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const openid = params.get("openid");
  const code = params.get("mpCode");

  if (!token && !openid && !code) return null;

  return {
    token,
    openid,
    expiresIn: params.get("expiresIn"),
    nickName: params.get("mpNickName") ? decodeURIComponent(params.get("mpNickName")!) : null,
    avatarUrl: params.get("mpAvatarUrl") ? decodeURIComponent(params.get("mpAvatarUrl")!) : null,
    code,
  };
}

/** 清除 URL 中的登录参数 */
export function clearWxMpLoginParams(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const paramsToRemove = [
    "token", "openid", "expiresIn", "mpCode",
    "mpNickName", "mpAvatarUrl", "mpProfileTs", "mpReadyTs", "mpPongTs"
  ];
  paramsToRemove.forEach((key) => url.searchParams.delete(key));
  window.history.replaceState({}, "", url.toString());
}

/** 请求微信小程序原生登录（异步版本，更健壮） */
export async function requestWxMpLogin(returnUrl?: string): Promise<boolean> {
  console.log("[wechat-mp] requestWxMpLogin called");

  const mp = await waitForWxSDK();
  if (!mp) {
    console.warn("[wechat-mp] Not in WeChat MiniProgram environment or SDK not loaded");
    return false;
  }

  console.log("[wechat-mp] WeChat SDK loaded successfully");
  const currentUrl = returnUrl || window.location.href;
  console.log("[wechat-mp] Current URL:", currentUrl);

  if (typeof mp.navigateTo === "function") {
    const loginUrl = `/pages/webshell/login?returnUrl=${encodeURIComponent(currentUrl)}`;
    console.log("[wechat-mp] Attempting to navigate to:", loginUrl);

    try {
      mp.navigateTo({ url: loginUrl });
      console.log("[wechat-mp] navigateTo called successfully");
      return true;
    } catch (error) {
      console.error("[wechat-mp] navigateTo failed:", error);
      return false;
    }
  }

  // 备用方案：使用 postMessage
  if (typeof mp.postMessage === "function") {
    console.log("[wechat-mp] Using postMessage fallback");
    mp.postMessage({ data: { type: "REQUEST_WX_LOGIN", returnUrl: currentUrl } });
    if (typeof mp.navigateBack === "function") {
      mp.navigateBack({ delta: 1 });
    }
    return true;
  }

  console.warn("[wechat-mp] No available method to trigger login");
  return false;
}

/** 使用 code 换取 token（兜底方案） */
export async function exchangeCodeForToken(
  code: string,
  nickName?: string | null,
  avatarUrl?: string | null
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const response = await fetch("/api/wxlogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, nickName, avatarUrl }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.message || "登录失败" };
    }

    return { success: true, token: data.token };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "网络错误" };
  }
}

/** 请求微信小程序原生支付 */
export async function requestWxMpPayment(params: {
  planType: string;
  billingCycle: string;
  amount: number;
  token: string;
}): Promise<boolean> {
  const mp = await waitForWxSDK();
  if (!mp || typeof mp.postMessage !== "function") {
    console.warn("[wechat-mp] Not in WeChat MiniProgram environment");
    return false;
  }

  mp.postMessage({
    data: {
      type: "REQUEST_WX_PAYMENT",
      ...params,
    },
  });

  // 小程序需要用户触发才能跳转，这里返回 true 表示消息已发送
  return true;
}