import jwt from 'jsonwebtoken';
import { getCloudBaseDatabase, CloudBaseCollections, nowISO } from '../database/cloudbase-client';
import { getUserPlan } from '../subscription/usage-tracker';

export interface VerifiedUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  subscription_plan?: string;
}

/**
 * 验证Session token（邮箱登录生成）
 */
export async function verifySessionToken(token: string): Promise<VerifiedUser | null> {
  try {
    // Session token格式: session_${userId}_${timestamp}
    const parts = token.split('_');
    if (parts.length !== 3 || parts[0] !== 'session') {
      return null;
    }

    const userId = parts[1];
    const timestamp = parseInt(parts[2]);

    // 检查token是否过期（1小时）
    const now = Date.now();
    const expireTime = timestamp + 3600000; // 1小时
    if (now > expireTime) {
      console.warn('[Session] Token expired');
      return null;
    }

    // 从数据库获取用户信息
    const db = getCloudBaseDatabase();
    const userResult = await db.collection(CloudBaseCollections.USERS)
      .where({ _id: userId })
      .get();

    if (!userResult.data || userResult.data.length === 0) {
      console.warn(`[Session] User not found: ${userId}`);
      return null;
    }

    const user = userResult.data[0];

    // 获取真实的订阅计划（从 user_subscriptions 表）
    const subscriptionPlan = await getUserPlan(user._id);

    return {
      id: user._id,
      email: user.email || undefined,
      name: user.name || undefined,
      avatar: user.avatar || undefined,
      subscription_plan: subscriptionPlan
    };

  } catch (error) {
    console.error('[Session] Token verification error:', error);
    return null;
  }
}

/**
 * 验证JWT token并返回用户信息
 */
export async function verifyToken(token: string): Promise<VerifiedUser | null> {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[JWT] JWT_SECRET not configured');
      return null;
    }

    // 验证并解码token
    const decoded = jwt.verify(token, jwtSecret) as any;

    // 检查token类型和过期时间
    if (decoded.type !== 'access') {
      console.warn('[JWT] Token is not an access token');
      return null;
    }

    if (!decoded.userId) {
      console.warn('[JWT] Token missing userId');
      return null;
    }

    // 从数据库获取用户信息
    const db = getCloudBaseDatabase();
    let user;

    try {
      // 首先尝试通过doc()方法查询（CloudBase推荐的方式）
      const userDoc = await db.collection(CloudBaseCollections.USERS)
        .doc(decoded.userId)
        .get();

      if (userDoc.data && userDoc.data.length > 0) {
        user = userDoc.data[0];
        console.log(`[JWT] User found via doc(): ${user.email || user._id}`);
      } else {
        // 如果doc()查询失败，尝试where()查询
        console.log(`[JWT] doc() query failed, trying where() query for userId: ${decoded.userId}`);
        const userResult = await db.collection(CloudBaseCollections.USERS)
          .where({ _id: decoded.userId })
          .get();

        if (!userResult.data || userResult.data.length === 0) {
          console.warn(`[JWT] User not found: ${decoded.userId}`);
          return null;
        }

        user = userResult.data[0];
        console.log(`[JWT] User found via where(): ${user.email || user._id}`);
      }
    } catch (error) {
      console.error(`[JWT] Database query error for userId ${decoded.userId}:`, error);
      return null;
    }

    if (!user) {
      console.warn(`[JWT] User not found: ${decoded.userId}`);
      return null;
    }

    // 获取真实的订阅计划（从 user_subscriptions 表）
    const subscriptionPlan = await getUserPlan(user._id);

    return {
      id: user._id,
      email: user.email || undefined,
      name: user.name || undefined,
      avatar: user.avatar || undefined,
      subscription_plan: subscriptionPlan
    };

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('[JWT] Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('[JWT] Invalid token');
    } else {
      console.error('[JWT] Token verification error:', error);
    }
    return null;
  }
}

interface CloudBaseUser {
  _id?: string;
  email: string | null;
  password?: string | null;
  name: string | null;
  avatar?: string | null;
  pro: boolean;
  region: string;

  // 微信登录相关字段
  wechatOpenId?: string;
  wechatUnionId?: string | null;

  // 订阅相关字段
  subscriptionTier?: string;
  plan?: string | null;
  plan_exp?: string | null;
  paymentMethod?: string | null;
  hide_ads?: boolean;

  // 时间戳
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

/**
 * CloudBase 微信登录认证服务
 */
export async function cloudbaseSignInWithWechat(params: {
  openid: string;
  unionid?: string | null;
  nickname?: string | null;
  avatar?: string | null;
}) {
  const { openid, unionid, nickname, avatar } = params;

  try {
    const db = getCloudBaseDatabase();
    const usersCollection = db.collection(CloudBaseCollections.USERS);
    const now = nowISO();

    console.log(`[CloudBase Auth] Processing WeChat login for openid: ${openid}`);

    // 1. 查找现有用户（优先按 wechatOpenId，其次按 email）
    let userResult = await usersCollection.where({ wechatOpenId: openid }).get();

    // 兼容早期用 email 存储 openid 的情况
    if (!userResult.data || userResult.data.length === 0) {
      const wechatEmail = `wechat_${openid}@local.wechat`;
      userResult = await usersCollection.where({ email: wechatEmail }).get();
    }

    let user: CloudBaseUser;

    if (userResult.data && userResult.data.length > 0) {
      // 现有用户：更新登录信息
      user = userResult.data[0] as CloudBaseUser;

      console.log(`[CloudBase Auth] Found existing user: ${user.email}`);

      // 更新用户信息
      const updateData: Partial<CloudBaseUser> = {
        lastLoginAt: now,
        updatedAt: now,
      };

      // 只在有新信息且不同的情况下更新
      if (nickname && nickname !== user.name) {
        updateData.name = nickname;
      }
      if (avatar && avatar !== user.avatar) {
        updateData.avatar = avatar;
      }

      // 如果有unionid但用户没有，更新unionid
      if (unionid && !user.wechatUnionId) {
        updateData.wechatUnionId = unionid;
      }

      // 如果有更新数据，执行更新
      if (Object.keys(updateData).length > 2) { // 除了lastLoginAt和updatedAt还有其他更新
        await usersCollection.doc(user._id!).update(updateData);
        console.log(`[CloudBase Auth] Updated user info for: ${user.email}`);
      }

      user = { ...user, ...updateData };

    } else {
      // 新用户：创建用户记录
      console.log(`[CloudBase Auth] Creating new user for openid: ${openid}`);

      const newUser: Omit<CloudBaseUser, '_id'> = {
        email: `wechat_${openid}@local.wechat`,
        password: null,
        name: nickname || '微信用户',
        avatar: avatar || null,
        pro: false,
        region: 'CN',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        wechatOpenId: openid,
        wechatUnionId: unionid || null,
        subscriptionTier: 'free',
        plan: 'free',
        plan_exp: null,
        paymentMethod: null,
        hide_ads: false,
      };

      const result = await usersCollection.add(newUser);
      user = { _id: result.id, ...newUser };

      console.log(`[CloudBase Auth] Created new user: ${user.email} (${user._id})`);
    }

    // 2. 生成 JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';

    // 定义过期时间（秒）
    const accessTokenExpiresIn = user.pro ? 90 * 24 * 60 * 60 : 60 * 60; // Pro: 90天, 普通: 1小时
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7天

    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        region: 'CN',
        wechatOpenId: openid,
        type: 'access'
      },
      jwtSecret,
      { expiresIn: accessTokenExpiresIn }
    );

    const refreshToken = jwt.sign(
      {
        userId: user._id,
        type: 'refresh',
        region: 'CN'
      },
      jwtSecret,
      { expiresIn: refreshTokenExpiresIn }
    );

    console.log(`[CloudBase Auth] Generated tokens for user: ${user.email}`);
    console.log(`[CloudBase Auth] Access token expires in: ${accessTokenExpiresIn}s (${user.pro ? '90 days' : '1 hour'})`);
    console.log(`[CloudBase Auth] Refresh token expires in: ${refreshTokenExpiresIn}s (7 days)`);

    return {
      success: true,
      user,
      accessToken,
      refreshToken,
      tokenMeta: {
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
      },
    };

  } catch (error) {
    console.error('[CloudBase Auth] Error during WeChat authentication:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}