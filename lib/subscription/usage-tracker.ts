/**
 * 订阅使用次数追踪服务
 * 支持双环境架构：INTL (Supabase) 和 CN (CloudBase)
 *
 * 追踪用户的推荐使用次数并检查是否超出限制
 */

import { createClient } from "@supabase/supabase-js";
import cloudbase from "@cloudbase/node-sdk";
import { isChinaDeployment } from "@/lib/config/deployment.config";
import { PlanType } from "../payment/payment-config-cn";
import { PLAN_FEATURES } from "./features";
import { getCachedPlan, setCachedPlan } from "@/lib/cache/subscription-cache";

// ==========================================
// 数据库客户端
// ==========================================

// Supabase 客户端缓存
let supabaseAdminInstance: any = null;

function getSupabaseAdmin() {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseAdminInstance;
}

// CloudBase 客户端缓存
let cloudbaseAppInstance: any = null;

function getCloudBaseApp() {
  // 检查是否应该使用 Supabase
  const authProvider = process.env.AUTH_PROVIDER;
  const dbProvider = process.env.DATABASE_PROVIDER;

  if (authProvider === 'supabase' || dbProvider === 'supabase') {
    console.log('[Usage Tracker] 国际版模式 (Supabase)，跳过 CloudBase 初始化');
    throw new Error('CloudBase not available in Supabase mode');
  }

  if (cloudbaseAppInstance) {
    return cloudbaseAppInstance;
  }

  const envId = process.env.TENCENT_CLOUD_ENV_ID || process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID;
  const secretId = process.env.CLOUDBASE_SECRET_ID || process.env.TENCENT_CLOUD_SECRET_ID;
  const secretKey = process.env.CLOUDBASE_SECRET_KEY || process.env.TENCENT_CLOUD_SECRET_KEY;

  if (!envId) {
    throw new Error('Missing TENCENT_CLOUD_ENV_ID or NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID environment variable');
  }

  if (!secretId || !secretKey) {
    throw new Error('Missing CLOUDBASE_SECRET_ID/CLOUDBASE_SECRET_KEY or TENCENT_CLOUD_SECRET_ID/TENCENT_CLOUD_SECRET_KEY environment variables');
  }

  console.log('[CloudBase Usage Tracker] Initializing CloudBase with envId:', envId);

  cloudbaseAppInstance = cloudbase.init({
    env: envId,
    secretId,
    secretKey,
  });

  return cloudbaseAppInstance;
}

function getCloudBaseDb() {
  return getCloudBaseApp().database();
}

// ==========================================
// 类型定义
// ==========================================

/**
 * 使用统计接口
 */
export interface UsageStats {
  userId: string;
  planType: PlanType;
  currentPeriodUsage: number;
  periodLimit: number;
  periodType: "daily" | "monthly";
  periodStart: Date;
  periodEnd: Date;
  remainingUsage: number;
  isUnlimited: boolean;
}

// ==========================================
// 获取用户订阅计划
// ==========================================

/**
 * 获取用户当前订阅计划
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
  const cached = getCachedPlan(userId);
  if (cached) return cached as PlanType;

  const plan = isChinaDeployment()
    ? await getUserPlanCloudBase(userId)
    : await getUserPlanSupabase(userId);

  setCachedPlan(userId, plan);
  return plan;
}

async function getUserPlanSupabase(userId: string): Promise<PlanType> {
  const supabase = getSupabaseAdmin();

  const { data: subscription, error } = await supabase
    .from("user_subscriptions")
    .select("plan_type, status, subscription_end")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("subscription_end", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !subscription) {
    return "free";
  }

  return subscription.plan_type as PlanType;
}

async function getUserPlanCloudBase(userId: string): Promise<PlanType> {
  const db = getCloudBaseDb();
  const now = new Date().toISOString();

  try {
    // 查询活跃订阅
    const result = await db
      .collection("user_subscriptions")
      .where({
        user_id: userId,
        status: "active",
      })
      .orderBy("subscription_end", "desc")
      .limit(1)
      .get();

    if (!result.data || result.data.length === 0) {
      // 如果没有订阅记录，检查 users 集合中的订阅计划
      const userResult = await db.collection("users").doc(userId).get();
      const userData = userResult.data?.[0] || userResult.data;

      if (userData?.subscription_plan) {
        const plan = (userData.subscription_plan as string).toLowerCase();
        if (plan.includes("enterprise")) return "enterprise";
        if (plan.includes("pro")) return "pro";
      }

      // 没有活跃订阅，返回免费计划
      console.log(`[CloudBase Plan] User ${userId} has no active subscription, returning free plan`);
      return "free";
    }

    const subscription = result.data[0];

    // 检查是否过期
    if (subscription.subscription_end < now) {
      console.log(`[CloudBase Plan] User ${userId} subscription expired at ${subscription.subscription_end}`);

      // 异步更新数据库中的订阅状态为 expired
      updateExpiredSubscription(subscription._id, userId).catch((err) => {
        console.error(`[CloudBase Plan] Failed to update expired subscription status:`, err);
      });

      return "free";
    }

    const planType = (subscription.plan_type as string || "").toLowerCase();
    if (planType.includes("enterprise")) return "enterprise";
    if (planType.includes("pro")) return "pro";
    return "free";
  } catch (error) {
    console.error("[getUserPlanCloudBase] Error:", error);
    // 出错时返回免费计划，避免意外授予高级权限
    return "free";
  }
}

/**
 * 更新过期的订阅状态
 * @param subscriptionId 订阅记录ID
 * @param userId 用户ID（用于日志）
 */
async function updateExpiredSubscription(
  subscriptionId: string,
  userId: string
): Promise<void> {
  if (!isChinaDeployment()) {
    // Supabase 环境暂不支持
    return;
  }

  const db = getCloudBaseDb();

  try {
    console.log(`[Subscription Cleanup] Updating expired subscription ${subscriptionId} for user ${userId}`);

    await db
      .collection("user_subscriptions")
      .doc(subscriptionId)
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      });

    console.log(`[Subscription Cleanup] Successfully marked subscription ${subscriptionId} as expired`);
  } catch (error: any) {
    console.error(`[Subscription Cleanup] Failed to update subscription ${subscriptionId}:`, error);
    throw error;
  }
}

// ==========================================
// 周期计算
// ==========================================

/**
 * 获取周期开始和结束时间
 */
function getPeriodBounds(periodType: "daily" | "monthly"): { start: Date; end: Date } {
  const now = new Date();

  if (periodType === "daily") {
    // 获取中国时区（UTC+8）的今天开始和结束时间
    // 使用本地时间构造，然后转换为 ISO 字符串时数据库会正确理解
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  } else {
    // 月度周期：从本月1号00:00:00到本月最后一天23:59:59
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
}

// ==========================================
// 获取使用统计
// ==========================================

/**
 * 获取用户使用统计
 */
export async function getUserUsageStats(userId: string): Promise<UsageStats> {
  if (isChinaDeployment()) {
    return getUserUsageStatsCloudBase(userId);
  } else {
    return getUserUsageStatsSupabase(userId);
  }
}

async function getUserUsageStatsSupabase(userId: string): Promise<UsageStats> {
  const supabase = getSupabaseAdmin();
  const planType = await getUserPlanSupabase(userId);
  const features = PLAN_FEATURES[planType];

  const periodType = features.recommendationPeriod;
  let periodLimit = features.recommendationLimit;
  const isUnlimited = periodLimit === -1;

  const { start, end } = getPeriodBounds(periodType);

  // 查询当前周期的使用次数
  const { count, error } = await supabase
    .from("recommendation_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const currentPeriodUsage = count || 0;

  console.log('📊 [getUserUsageStatsSupabase] 查询使用统计:', {
    userId,
    planType,
    periodType,
    periodLimit,
    isUnlimited,
    currentPeriodUsage,
    start: start.toISOString(),
    end: end.toISOString()
  });

  // ✅ 新增：查询有效的加油包，累加加油包次数到限额
  try {
    const now = new Date().toISOString();
    const { data: creditPackages, error: creditError } = await supabase
      .from("user_credit_packages")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    if (!creditError && creditPackages && creditPackages.length > 0) {
      let totalCreditPackageRemaining = 0;

      for (const pkg of creditPackages) {
        const credits = pkg.credits_remaining || 0;
        const expiryDate = pkg.expiry_date;

        // 检查是否过期
        if (expiryDate < now) {
          // 标记为过期
          console.log(`[getUserUsageStatsSupabase] 加油包 ${pkg.id} 已过期，更新状态`);
          await supabase
            .from("user_credit_packages")
            .update({ status: "expired", updated_at: now })
            .eq("id", pkg.id);
          continue;
        }

        totalCreditPackageRemaining += credits;
        console.log(`[getUserUsageStatsSupabase] 有效加油包: ${pkg.package_type}, 剩余 ${credits} 次`);
      }

      // 将加油包剩余次数加到限额中
      if (totalCreditPackageRemaining > 0 && !isUnlimited) {
        const originalLimit = periodLimit;
        periodLimit += totalCreditPackageRemaining;
        console.log(`✅ [getUserUsageStatsSupabase] 加油包次数已累加:`, {
          原始限额: originalLimit,
          加油包剩余: totalCreditPackageRemaining,
          总限额: periodLimit,
        });
      }
    }
  } catch (creditError) {
    console.error("[getUserUsageStatsSupabase] Error querying credit packages:", creditError);
    // 继续处理，不影响主要功能
  }

  return {
    userId,
    planType,
    currentPeriodUsage,
    periodLimit,
    periodType,
    periodStart: start,
    periodEnd: end,
    remainingUsage: isUnlimited ? -1 : Math.max(0, periodLimit - currentPeriodUsage),
    isUnlimited,
  };
}

async function getUserUsageStatsCloudBase(userId: string): Promise<UsageStats> {
  const db = getCloudBaseDb();
  const planType = await getUserPlanCloudBase(userId);
  const features = PLAN_FEATURES[planType];

  const periodType = features.recommendationPeriod;
  let periodLimit = features.recommendationLimit;
  const isUnlimited = periodLimit === -1;

  const { start, end } = getPeriodBounds(periodType);

  console.log('📊 [getUserUsageStatsCloudBase] 查询使用统计:', {
    userId,
    planType,
    periodType,
    periodLimit,
    isUnlimited,
    start: start.toISOString(),
    end: end.toISOString()
  });

  // 查询当前周期的使用次数
  let currentPeriodUsage = 0;
  try {
    const _ = db.command;
    const result = await db
      .collection("recommendation_usage")
      .where({
        user_id: userId,
        created_at: _.gte(start.toISOString()).and(_.lte(end.toISOString())),
      })
      .count();

    currentPeriodUsage = result.total || 0;
    console.log('✅ [getUserUsageStatsCloudBase] 查询结果:', { total: currentPeriodUsage });
  } catch (error: any) {
    console.error("[getUserUsageStatsCloudBase] Error counting usage:", error);

    // 检查是否是集合不存在的错误
    const isCollectionNotExist = error?.code === 'DATABASE_COLLECTION_NOT_EXIST' ||
                                error?.message?.includes('Db or Table not exist') ||
                                error?.message?.includes('ResourceNotFound');

    if (isCollectionNotExist) {
      console.log("[getUserUsageStatsCloudBase] Collection 'recommendation_usage' does not exist, attempting to create it");

      // 尝试创建集合（通过插入初始化记录）
      try {
        const initRecord = {
          user_id: 'system-init',
          usage_count: 0,
          created_at: new Date().toISOString(),
          period_start: start.toISOString(),
          period_end: end.toISOString(),
          is_init_record: true
        };

        await db.collection("recommendation_usage").add(initRecord);
        console.log("[getUserUsageStatsCloudBase] Successfully created recommendation_usage collection");

        // 立即删除初始化记录
        const queryResult = await db.collection("recommendation_usage")
          .where({ user_id: 'system-init' })
          .get();

        if (queryResult.data && queryResult.data.length > 0) {
          const deleteId = queryResult.data[0]._id || (queryResult.data as any).id;
          await db.collection("recommendation_usage").doc(deleteId).remove();
        }
      } catch (createError: any) {
        console.error("[getUserUsageStatsCloudBase] Failed to create collection:", createError);
      }
    }
  }

  // ✅ 新增：查询有效的加油包，累加加油包次数到限额
  try {
    const now = new Date().toISOString();
    const creditPackagesResult = await db
      .collection("user_credit_packages")
      .where({
        user_id: userId,
        status: "active",
      })
      .get();

    if (creditPackagesResult.data && creditPackagesResult.data.length > 0) {
      let totalCreditPackageRemaining = 0;

      for (const pkg of creditPackagesResult.data) {
        const credits = pkg.credits_remaining || 0;
        const expiryDate = pkg.expiry_date;

        // 检查是否过期
        if (expiryDate < now) {
          // 标记为过期
          console.log(`[getUserUsageStatsCloudBase] 加油包 ${pkg._id} 已过期，更新状态`);
          await db.collection("user_credit_packages").doc(pkg._id).update({
            status: "expired",
            updated_at: now,
          });
          continue;
        }

        totalCreditPackageRemaining += credits;
        console.log(`[getUserUsageStatsCloudBase] 有效加油包: ${pkg.package_type}, 剩余 ${credits} 次`);
      }

      // 将加油包剩余次数加到限额中
      if (totalCreditPackageRemaining > 0 && !isUnlimited) {
        const originalLimit = periodLimit;
        periodLimit += totalCreditPackageRemaining;
        console.log(`✅ [getUserUsageStatsCloudBase] 加油包次数已累加:`, {
          原始限额: originalLimit,
          加油包剩余: totalCreditPackageRemaining,
          总限额: periodLimit,
        });
      }
    }
  } catch (creditError) {
    console.error("[getUserUsageStatsCloudBase] Error querying credit packages:", creditError);
    // 继续处理，不影响主要功能
  }

  return {
    userId,
    planType,
    currentPeriodUsage,
    periodLimit,
    periodType,
    periodStart: start,
    periodEnd: end,
    remainingUsage: isUnlimited ? -1 : Math.max(0, periodLimit - currentPeriodUsage),
    isUnlimited,
  };
}

// ==========================================
// 检查使用权限
// ==========================================

/**
 * 检查用户是否可以使用推荐功能
 */
export async function canUseRecommendation(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  stats: UsageStats;
}> {
  const stats = await getUserUsageStats(userId);

  if (stats.isUnlimited) {
    return { allowed: true, stats };
  }

  if (stats.remainingUsage <= 0) {
    const periodText = stats.periodType === "daily" ? "today" : "this month";
    return {
      allowed: false,
      reason: `You have reached your ${stats.periodLimit} recommendation limit for ${periodText}. Upgrade to Pro or Enterprise for more recommendations.`,
      stats,
    };
  }

  return { allowed: true, stats };
}

// ==========================================
// 记录使用
// ==========================================

/**
 * 记录一次推荐使用
 */
export async function recordRecommendationUsage(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  console.log('📝 [recordRecommendationUsage] 开始记录使用...');
  console.log('👤 用户ID:', userId);
  console.log('📊 元数据:', metadata);
  console.log('🌍 部署环境检查:', {
    isChinaDeployment: isChinaDeployment(),
    authProvider: process.env.AUTH_PROVIDER,
    dbProvider: process.env.DATABASE_PROVIDER
  });

  // 首先检查是否可以使用
  const { allowed, reason } = await canUseRecommendation(userId);

  if (!allowed) {
    console.log('❌ [recordRecommendationUsage] 不允许使用:', reason);
    return { success: false, error: reason };
  }

  console.log('✅ [recordRecommendationUsage] 用户有使用权限');

  if (isChinaDeployment()) {
    console.log('🇨🇳 [recordRecommendationUsage] 使用国内版 (CloudBase)');
    return recordRecommendationUsageCloudBase(userId, metadata);
  } else {
    console.log('🌍 [recordRecommendationUsage] 使用国际版 (Supabase)');
    return recordRecommendationUsageSupabase(userId, metadata);
  }
}

async function recordRecommendationUsageSupabase(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  console.log('🌍 [recordRecommendationUsageSupabase] 开始记录使用 - 国际版');
  console.log('👤 用户ID:', userId);
  console.log('📊 元数据:', metadata);

  const supabase = getSupabaseAdmin();
  const nowISO = new Date().toISOString();

  console.log('🔍 [recordRecommendationUsageSupabase] 查询加油包...');

  console.log('📝 [recordRecommendationUsageSupabase] 准备记录使用:', {
    userId,
    metadata,
    nowISO,
  });

  // ✅ 新增：优先扣除加油包的次数
  try {
    console.log('🔍 [recordRecommendationUsageSupabase] 查询活跃的加油包...');
    const { data: creditPackages, error: creditError } = await supabase
      .from("user_credit_packages")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("purchase_date", { ascending: true });

    console.log('📊 [recordRecommendationUsageSupabase] 加油包查询结果:', {
      error: creditError,
      count: creditPackages?.length || 0,
      packages: creditPackages?.map(p => ({
        id: p.id,
        type: p.package_type,
        status: p.status,
        remaining: p.credits_remaining,
        expiry: p.expiry_date
      }))
    });

    if (!creditError && creditPackages && creditPackages.length > 0) {
      console.log(`✅ [recordRecommendationUsageSupabase] 找到 ${creditPackages.length} 个加油包`);

      // 找到最早购买的未过期加油包（先进先出）
      let targetPackage: any = null;

      for (const pkg of creditPackages) {
        console.log(`🔍 [recordRecommendationUsageSupabase] 检查加油包 ${pkg.id}:`, {
          type: pkg.package_type,
          status: pkg.status,
          remaining: pkg.credits_remaining,
          expiry: pkg.expiry_date,
          now: nowISO
        });

        // 检查是否过期
        if (pkg.expiry_date < nowISO) {
          console.log(`⚠️ [recordRecommendationUsageSupabase] 加油包 ${pkg.id} 已过期，标记为 expired`);
          // 标记为过期
          await supabase
            .from("user_credit_packages")
            .update({ status: "expired", updated_at: nowISO })
            .eq("id", pkg.id);
          continue;
        }

        // 找到第一个有剩余次数的加油包
        if (pkg.credits_remaining > 0) {
          console.log(`✅ [recordRecommendationUsageSupabase] 找到有效加油包 ${pkg.id}`);
          targetPackage = pkg;
          break;
        }
      }

      // 如果找到有效的加油包，扣除次数
      if (targetPackage) {
        console.log(`💰 [recordRecommendationUsageSupabase] 准备从加油包扣除次数:`, {
          packageId: targetPackage.id,
          packageType: targetPackage.package_type,
          currentRemaining: targetPackage.credits_remaining
        });

        const newCreditsRemaining = Math.max(0, targetPackage.credits_remaining - 1);

        const { error: updateError } = await supabase
          .from("user_credit_packages")
          .update({
            credits_remaining: newCreditsRemaining,
            updated_at: nowISO,
          })
          .eq("id", targetPackage.id);

        if (updateError) {
          console.error("❌ [recordRecommendationUsageSupabase] 扣除加油包次数失败:", updateError);
          // 继续处理，记录到 recommendation_usage
        } else {
          console.log('✅ [recordRecommendationUsageSupabase] 已成功扣除加油包次数:', {
            creditPackageId: targetPackage.id,
            packageType: targetPackage.package_type,
            原剩余: targetPackage.credits_remaining,
            新剩余: newCreditsRemaining,
          });

          // 如果加油包用完了，标记为已用完
          if (newCreditsRemaining === 0) {
            await supabase
              .from("user_credit_packages")
              .update({ status: "used_up", updated_at: nowISO })
              .eq("id", targetPackage.id);
            console.log('✅ [recordRecommendationUsageSupabase] 加油包已用完:', targetPackage.id);
          }

          // 加油包记录成功，不记录到 recommendation_usage
          console.log('✅ [recordRecommendationUsageSupabase] 使用次数已从加油包扣除，完成');
          return { success: true };
        }
      } else {
        console.log('⚠️ [recordRecommendationUsageSupabase] 没有找到有效的加油包（都已过期或用完）');
      }
    } else {
      console.log('ℹ️ [recordRecommendationUsageSupabase] 没有找到加油包，将检查订阅额度');
    }
  } catch (creditError) {
    console.error("❌ [recordRecommendationUsageSupabase] 查询加油包时发生错误:", creditError);
    // 继续处理，记录到 recommendation_usage
  }

  // 没有加油包或加油包已用完，检查订阅额度（包括免费版限额）
  console.log('📊 [recordRecommendationUsageSupabase] 检查用户订阅额度...');

  // 获取用户计划
  const planType = await getUserPlanSupabase(userId);
  const features = PLAN_FEATURES[planType];
  const periodLimit = features.recommendationLimit;
  const periodType = features.recommendationPeriod;

  console.log('📋 [recordRecommendationUsageSupabase] 用户计划信息:', {
    planType,
    periodLimit,
    periodType
  });

  // 如果是无限额度，直接记录使用
  if (periodLimit === -1) {
    console.log('♾️ [recordRecommendationUsageSupabase] 用户拥有无限额度，直接记录使用');
    const { error } = await supabase.from("recommendation_usage").insert({
      user_id: userId,
      metadata: metadata || {},
      created_at: nowISO,
    });

    if (error) {
      console.error("❌ [recordRecommendationUsageSupabase] Error recording recommendation usage:", error);
      return { success: false, error: "Failed to record usage" };
    }

    console.log('✅ [recordRecommendationUsageSupabase] 成功记录使用到 recommendation_usage 表');
    return { success: true };
  }

  // 检查当前周期的使用次数
  const { start, end } = getPeriodBounds(periodType);
  const { count, error: countError } = await supabase
    .from("recommendation_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const currentUsage = count || 0;

  console.log('📊 [recordRecommendationUsageSupabase] 当前周期使用情况:', {
    currentUsage,
    periodLimit,
    remaining: periodLimit - currentUsage,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString()
  });

  // 检查是否超出限额
  if (currentUsage >= periodLimit) {
    const periodText = periodType === "daily" ? "今天" : "本月";
    const errorMessage = `您${periodText}的 ${periodLimit} 次代码生成额度已用完。请升级到 Pro 或 Enterprise 版本，或购买加油包继续使用。`;
    console.log(`❌ [recordRecommendationUsageSupabase] 超出${periodText}限额: ${currentUsage}/${periodLimit}`);
    return { success: false, error: errorMessage };
  }

  // 未超出限额，记录使用
  console.log('📝 [recordRecommendationUsageSupabase] 准备插入推荐使用记录到 recommendation_usage 表...');
  const { error } = await supabase.from("recommendation_usage").insert({
    user_id: userId,
    metadata: metadata || {},
    created_at: nowISO,
  });

  if (error) {
    console.error("❌ [recordRecommendationUsageSupabase] Error recording recommendation usage:", error);
    return { success: false, error: "Failed to record usage" };
  }

  console.log('✅ [recordRecommendationUsageSupabase] 成功记录使用到 recommendation_usage 表');
  return { success: true };
}

async function recordRecommendationUsageCloudBase(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const db = getCloudBaseDb();

  try {
    const now = new Date();
    const nowISO = now.toISOString();
    const nowLocal = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    console.log('📝 [recordRecommendationUsageCloudBase] 准备记录使用:', {
      userId,
      metadata,
      nowISO,
      nowLocal,
      timestamp: now.getTime()
    });

    // ✅ 新增：优先扣除加油包的次数
    try {
      const creditPackagesResult = await db
        .collection("user_credit_packages")
        .where({
          user_id: userId,
          status: "active",
        })
        .get();

      if (creditPackagesResult.data && creditPackagesResult.data.length > 0) {
        // 找到最早购买的未过期加油包（先进先出）
        const nowForCheck = new Date().toISOString();
        let targetPackage: any = null;

        for (const pkg of creditPackagesResult.data) {
          // 检查是否过期
          if (pkg.expiry_date < nowForCheck) {
            // 标记为过期
            await db.collection("user_credit_packages").doc(pkg._id).update({
              status: "expired",
              updated_at: nowISO,
            });
            continue;
          }

          // 找到第一个有剩余次数的加油包
          if (pkg.credits_remaining > 0) {
            targetPackage = pkg;
            break;
          }
        }

        // 如果找到有效的加油包，扣除次数
        if (targetPackage) {
          const newCreditsRemaining = Math.max(0, targetPackage.credits_remaining - 1);

          await db.collection("user_credit_packages").doc(targetPackage._id).update({
            credits_remaining: newCreditsRemaining,
            updated_at: nowISO,
          });

          console.log('✅ [recordRecommendationUsageCloudBase] 已扣除加油包次数:', {
            creditPackageId: targetPackage._id,
            packageType: targetPackage.package_type,
            原剩余: targetPackage.credits_remaining,
            新剩余: newCreditsRemaining,
          });

          // 如果加油包用完了，标记为已用完
          if (newCreditsRemaining === 0) {
            await db.collection("user_credit_packages").doc(targetPackage._id).update({
              status: "used_up",
              updated_at: nowISO,
            });
            console.log('✅ [recordRecommendationUsageCloudBase] 加油包已用完:', targetPackage._id);
          }

          // 加油包记录成功，不记录到 recommendation_usage
          return { success: true };
        }
      }
    } catch (creditError) {
      console.error("[recordRecommendationUsageCloudBase] Error deducting credit package:", creditError);
      // 继续处理，记录到 recommendation_usage
    }

    // 没有加油包或加油包已用完，检查订阅额度（包括免费版限额）
    console.log('📊 [recordRecommendationUsageCloudBase] 检查用户订阅额度...');

    // 获取用户计划
    const planType = await getUserPlanCloudBase(userId);
    const features = PLAN_FEATURES[planType];
    const periodLimit = features.recommendationLimit;
    const periodType = features.recommendationPeriod;

    console.log('📋 [recordRecommendationUsageCloudBase] 用户计划信息:', {
      planType,
      periodLimit,
      periodType
    });

    // 如果是无限额度，直接记录使用
    if (periodLimit === -1) {
      console.log('♾️ [recordRecommendationUsageCloudBase] 用户拥有无限额度，直接记录使用');
      const result = await db.collection("recommendation_usage").add({
        user_id: userId,
        metadata: metadata || {},
        created_at: nowISO,
      });

      console.log('✅ [recordRecommendationUsageCloudBase] 成功记录使用:', result.id);
      return { success: true };
    }

    // 检查当前周期的使用次数
    const { start, end } = getPeriodBounds(periodType);
    const _ = db.command;

    let currentUsage = 0;
    try {
      const countResult = await db
        .collection("recommendation_usage")
        .where({
          user_id: userId,
          created_at: _.gte(start.toISOString()).and(_.lte(end.toISOString())),
        })
        .count();

      currentUsage = countResult.total || 0;
    } catch (countError) {
      console.error("[recordRecommendationUsageCloudBase] Error counting usage:", countError);
      // 如果计数失败（可能是集合不存在），假设已用0次
      currentUsage = 0;
    }

    console.log('📊 [recordRecommendationUsageCloudBase] 当前周期使用情况:', {
      currentUsage,
      periodLimit,
      remaining: periodLimit - currentUsage,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString()
    });

    // 检查是否超出限额
    if (currentUsage >= periodLimit) {
      const periodText = periodType === "daily" ? "今天" : "本月";
      const errorMessage = `您${periodText}的 ${periodLimit} 次代码生成额度已用完。请升级到 Pro 或 Enterprise 版本，或购买加油包继续使用。`;
      console.log(`❌ [recordRecommendationUsageCloudBase] 超出${periodText}限额: ${currentUsage}/${periodLimit}`);
      return { success: false, error: errorMessage };
    }

    // 未超出限额，记录使用
    const result = await db.collection("recommendation_usage").add({
      user_id: userId,
      metadata: metadata || {},
      created_at: nowISO,
    });

    console.log('✅ [recordRecommendationUsageCloudBase] 成功记录使用:', result.id);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [recordRecommendationUsageCloudBase] Error recording recommendation usage:", error);
    console.error("❌ [recordRecommendationUsageCloudBase] Error details:", {
      code: error?.code,
      message: error?.message,
      stack: error?.stack
    });
    return { success: false, error: `Failed to record usage: ${error?.message || 'Unknown error'}` };
  }
}

// ==========================================
// 获取推荐历史
// ==========================================

/**
 * 获取用户推荐历史（根据计划限制保留天数）
 */
export async function getUserRecommendationHistory(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
  data: Array<{
    id: string;
    recommendation: unknown;
    created_at: string;
  }>;
  total: number;
  retentionDays: number;
}> {
  if (isChinaDeployment()) {
    return getUserRecommendationHistoryCloudBase(userId, options);
  } else {
    return getUserRecommendationHistorySupabase(userId, options);
  }
}

async function getUserRecommendationHistorySupabase(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
  data: Array<{
    id: string;
    recommendation: unknown;
    created_at: string;
  }>;
  total: number;
  retentionDays: number;
}> {
  const supabase = getSupabaseAdmin();
  const planType = await getUserPlanSupabase(userId);
  const features = PLAN_FEATURES[planType];
  const retentionDays = features.historyRetentionDays;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // 查询 recommendation_history 表
  const { data, error, count } = await supabase
    .from("recommendation_history")
    .select("id, category, title, description, link, link_type, metadata, reason, created_at", { count: "exact" })
    .eq("user_id", userId)
    .gte("created_at", cutoffDate.toISOString())
    .order("created_at", { ascending: false })
    .range(
      options?.offset || 0,
      (options?.offset || 0) + (options?.limit || 20) - 1
    );

  if (error) {
    console.error("[getUserRecommendationHistorySupabase] Error:", error);
  }

  // 转换数据格式
  const formattedData = (data || []).map((item: any) => ({
    id: item.id,
    recommendation: {
      category: item.category,
      title: item.title,
      description: item.description,
      link: item.link,
      linkType: item.link_type,
      metadata: item.metadata,
      reason: item.reason,
      content: item.title,
    },
    created_at: item.created_at,
  }));

  return {
    data: formattedData,
    total: count || 0,
    retentionDays,
  };
}

async function getUserRecommendationHistoryCloudBase(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
  data: Array<{
    id: string;
    recommendation: unknown;
    created_at: string;
  }>;
  total: number;
  retentionDays: number;
}> {
  const db = getCloudBaseDb();
  const planType = await getUserPlanCloudBase(userId);
  const features = PLAN_FEATURES[planType];
  const retentionDays = features.historyRetentionDays;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    const _ = db.command;
    
    // 获取总数
    const countResult = await db
      .collection("recommendation_history")
      .where({
        user_id: userId,
        created_at: _.gte(cutoffDate.toISOString()),
      })
      .count();

    const total = countResult.total || 0;

    // 查询数据
    const result = await db
      .collection("recommendation_history")
      .where({
        user_id: userId,
        created_at: _.gte(cutoffDate.toISOString()),
      })
      .orderBy("created_at", "desc")
      .skip(options?.offset || 0)
      .limit(options?.limit || 20)
      .get();

    // 转换数据格式
    const formattedData = (result.data || []).map((item: any) => ({
      id: item._id || item.id,
      recommendation: {
        category: item.category,
        title: item.title,
        description: item.description,
        link: item.link,
        linkType: item.link_type,
        metadata: item.metadata,
        reason: item.reason,
        content: item.title,
      },
      created_at: item.created_at,
    }));

    return {
      data: formattedData,
      total,
      retentionDays,
    };
  } catch (error) {
    console.error("[getUserRecommendationHistoryCloudBase] Error:", error);
    return {
      data: [],
      total: 0,
      retentionDays,
    };
  }
}

// ==========================================
// 检查导出权限
// ==========================================

/**
 * 检查用户是否可以导出数据
 */
export async function canExportData(userId: string): Promise<{
  allowed: boolean;
  formats: string[];
  reason?: string;
}> {
  const planType = await getUserPlan(userId);
  const features = PLAN_FEATURES[planType];

  if (!features.dataExport) {
    return {
      allowed: false,
      formats: [],
      reason: "Data export is only available for Pro and Enterprise plans.",
    };
  }

  return {
    allowed: true,
    formats: features.exportFormats,
  };
}
