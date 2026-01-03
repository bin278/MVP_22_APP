// lib/auth/auth.ts
// 认证相关的工具函数

import { NextRequest } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { verifyToken, verifySessionToken, CloudBaseUser } from './cloudbase-auth';

// 获取认证提供商
function getAuthProvider(): 'supabase' | 'cloudbase' {
  const provider = process.env.AUTH_PROVIDER || 'cloudbase';
  return provider as 'supabase' | 'cloudbase';
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email?: string;
    uid?: string; // CloudBase兼容字段
    // 其他用户字段
  };
  error?: string;
  token?: string; // 原始token
}

/**
 * 验证用户身份的中间件函数
 * @param request Next.js 请求对象
 * @returns 认证结果对象
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("Missing or invalid authorization header");
      return {
        success: false,
        error: "Missing or invalid authorization header"
      };
    }

    const token = authHeader.substring(7);

    if (!token) {
      console.warn("Empty token in authorization header");
      return {
        success: false,
        error: "Empty token in authorization header"
      };
    }

    const authProvider = getAuthProvider();

    if (authProvider === 'cloudbase') {
      // CloudBase认证：验证JWT token
      console.log("🔐 CloudBase认证服务已初始化");

      try {
        // 检查是否是开发环境，如果是则跳过认证
        // 如果NODE_ENV未设置，也认为是开发环境
        const nodeEnv = process.env.NODE_ENV;
        const isDev = !nodeEnv || nodeEnv === 'development';
        console.log(`🔐 Environment check: NODE_ENV=${nodeEnv}, isDev=${isDev}`);

        if (isDev) {
          console.log("开发环境：模拟用户认证");

          // 开发环境：尝试验证token（支持JWT和Session），如果失败则使用默认用户
          if (token && token !== "dev-token") {
            try {
              let verifiedUser = null;

              // 首先尝试Session token
              if (token.startsWith('session_')) {
                console.log("开发环境：尝试验证Session token...");
                verifiedUser = await verifySessionToken(token);
              }

              // 然后尝试JWT token
              if (!verifiedUser) {
                console.log("开发环境：尝试验证JWT token...");
                verifiedUser = await verifyToken(token);
              }

              if (verifiedUser) {
                console.log(`✅ 开发环境token验证成功，用户: ${verifiedUser.email || verifiedUser.id}`);
                return {
                  success: true,
                  user: {
                    id: verifiedUser.id,
                    email: verifiedUser.email,
                    uid: verifiedUser.id,
                    name: verifiedUser.name,
                    avatar: verifiedUser.avatar,
                    subscription_plan: verifiedUser.subscription_plan,
                  },
                  token: token,
                };
              } else {
                console.log("开发环境：所有token验证失败，使用默认用户");
              }
            } catch (error) {
              console.log("开发环境：token验证异常，使用默认用户:", error.message);
            }
          }

          // Token验证失败或无token，使用默认开发用户
          console.log("开发环境：使用默认用户");
          return {
            success: true,
            user: {
              id: "dev-user",
              email: "dev@example.com",
              uid: "dev-user",
            },
            token: token || "dev-token",
          };
        }

        // 生产环境：验证token（支持JWT和Session两种格式）
        if (!token) {
          console.warn("生产环境：Token为空");
          return {
            success: false,
            error: "认证令牌缺失"
          };
        }

        console.log(`生产环境：验证token (长度: ${token.length}, 前缀: ${token.substring(0, 10)}...)`);
        let verifiedUser = null;

        // 首先尝试验证Session token（邮箱登录）
        if (token.startsWith('session_')) {
          console.log("尝试验证Session token...");
          verifiedUser = await verifySessionToken(token);
          if (verifiedUser) {
            console.log(`✅ Session token验证成功，用户: ${verifiedUser.email || verifiedUser.id}`);
          }
        }

        // 如果Session token验证失败，尝试JWT token（微信登录）
        if (!verifiedUser) {
          console.log("尝试验证JWT token...");
          try {
            verifiedUser = await verifyToken(token);
            if (verifiedUser) {
              console.log(`✅ JWT token验证成功，用户: ${verifiedUser.email || verifiedUser.id}`);
            } else {
              console.log("❌ JWT token验证返回null");
            }
          } catch (error) {
            console.error("JWT token验证异常:", error.message);
          }
        }

        if (!verifiedUser) {
          console.warn("生产环境：所有token验证失败");
          console.warn("Token详情:", {
            length: token.length,
            startsWithSession: token.startsWith('session_'),
            prefix: token.substring(0, 20) + '...'
          });
          return {
            success: false,
            error: "无效的认证令牌"
          };
        }

        return {
          success: true,
          user: {
            id: verifiedUser.id,
            email: verifiedUser.email,
            uid: verifiedUser.id,
            name: verifiedUser.name,
            avatar: verifiedUser.avatar,
            subscription_plan: verifiedUser.subscription_plan,
          },
          token: token,
        };

      } catch (error) {
        console.error("CloudBase认证失败:", error);
        return {
          success: false,
          error: "认证服务暂时不可用"
        };
      }
    } else {
      // Supabase认证（默认）
      const supabase = await createSupabaseClient();
      if (!supabase) {
        console.error("Supabase not configured");
        return {
          success: false,
          error: "Supabase not configured"
        };
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError) {
        console.error("Error getting user:", userError);
        return {
          success: false,
          error: "Invalid token"
        };
      }

      if (!user) {
        console.warn("No user found with provided token");
        return {
          success: false,
          error: "User not found"
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          // 可以添加其他需要的用户字段
        },
        token,
      };
    }
  } catch (error: any) {
    console.error("Unexpected error in requireAuth:", error);
    return {
      success: false,
      error: error.message || "Authentication failed"
    };
  }
}

/**
 * 创建认证错误的响应
 */
export function createAuthErrorResponse() {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * 从请求中提取用户ID（简化版，用于不需要完整用户对象的场景）
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authResult = await requireAuth(request);
  return authResult?.user.id || null;
}
