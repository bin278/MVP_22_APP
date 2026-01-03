/**
 * 部署配置类型定义
 */

export type DeploymentRegion = "CN" | "INTL";

export interface DeploymentConfig {
  /** 部署区域：CN=中国，INTL=国际 */
  region: DeploymentRegion;

  /** 应用名称 */
  appName: string;

  /** 应用版本 */
  version: string;

  /** 认证配置 */
  auth: {
    provider: "cloudbase" | "supabase";
    features: {
      emailAuth: boolean;
      wechatAuth: boolean;
      googleAuth: boolean;
      githubAuth: boolean;
    };
  };

  /** 数据库配置 */
  database: {
    provider: "cloudbase" | "supabase";
  };

  /** 支付配置 */
  payment: {
    providers: Array<"stripe" | "paypal" | "wechat" | "alipay">;
  };

  /** API 端点 */
  apis: {
    authCallbackPath: string;
  };

  /** 日志配置 */
  logging: {
    level: "debug" | "info" | "warn" | "error";
    enableConsole: boolean;
  };
}




