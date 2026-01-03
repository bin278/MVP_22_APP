/**
 * 部署配置文件 - mornFront
 *
 * mornFront中国版配置，使用腾讯云 CloudBase + 微信支付/支付宝
 */

import type { DeploymentRegion, DeploymentConfig } from "./types";

/**
 * 部署区域类型
 */
export type { DeploymentRegion, DeploymentConfig } from "./types";

/**
 * mornFront 部署配置
 * 中国版配置，使用 CloudBase + 微信支付/支付宝
 */
export const deploymentConfig: DeploymentConfig = {
  region: "CN",
  appName: "mornFront",
  version: "1.0.0",

  auth: {
    provider: "cloudbase",
    features: {
      emailAuth: true,
      wechatAuth: true,
      googleAuth: false,
      githubAuth: false,
    },
  },

  database: {
    provider: "cloudbase",
  },

  payment: {
    // 中国支持：微信支付、支付宝
    providers: ["wechat", "alipay"],
  },

  apis: {
    authCallbackPath: "/auth/callback",
  },

  logging: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    enableConsole: process.env.NODE_ENV !== "production",
  },
};

/**
 * 当前部署区域
 */
export const currentRegion: DeploymentRegion = "CN";

/**
 * 判断是否为中国区域
 */
export function isChinaDeployment(): boolean {
  return deploymentConfig.region === "CN";
}

/**
 * 判断是否为国际区域
 */
export function isInternationalDeployment(): boolean {
  return deploymentConfig.region === "INTL";
}

/**
 * 获取认证提供商
 */
export function getAuthProvider(): "cloudbase" | "supabase" {
  return deploymentConfig.auth.provider;
}

/**
 * 获取数据库提供商
 */
export function getDatabaseProvider(): "cloudbase" | "supabase" {
  return deploymentConfig.database.provider;
}

/**
 * 检查是否支持某个认证功能
 */
export function isAuthFeatureSupported(
  feature: keyof typeof deploymentConfig.auth.features
): boolean {
  return deploymentConfig.auth.features[feature];
}

/**
 * 获取支持的支付提供商列表
 */
export function getPaymentProviders(): DeploymentConfig["payment"]["providers"] {
  return deploymentConfig.payment.providers;
}

/**
 * 检查是否支持某个支付方式
 */
export function isPaymentMethodSupported(
  method: DeploymentConfig["payment"]["providers"][number]
): boolean {
  return deploymentConfig.payment.providers.includes(method);
}

/**
 * 导出完整配置（用于调试）
 */
export function getFullConfig(): DeploymentConfig {
  return deploymentConfig;
}
