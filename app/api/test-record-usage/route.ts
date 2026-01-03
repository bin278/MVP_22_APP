// app/api/test-record-usage/route.ts - 测试记录使用功能
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/auth";
import { recordRecommendationUsage, getUserUsageStats } from "@/lib/subscription/usage-tracker";

export async function POST(request: NextRequest) {
  console.log('🧪 [test-record-usage] 开始测试记录使用功能');

  try {
    // 验证用户认证
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      console.log('❌ [test-record-usage] 认证失败:', authResult.error);
      return NextResponse.json(
        { success: false, error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { user } = authResult;
    console.log('✅ [test-record-usage] 用户认证成功:', user.id);

    // 1. 先查看当前使用统计
    console.log('📊 [test-record-usage] 查询当前使用统计...');
    const statsBefore = await getUserUsageStats(user.id);
    console.log('📊 [test-record-usage] 记录前的统计:', {
      current: statsBefore.currentPeriodUsage,
      limit: statsBefore.periodLimit,
      remaining: statsBefore.remainingUsage,
      period: statsBefore.periodType
    });

    // 2. 记录一次使用
    console.log('📝 [test-record-usage] 尝试记录使用...');
    const recordResult = await recordRecommendationUsage(user.id, {
      test: true,
      timestamp: new Date().toISOString()
    });

    console.log('📝 [test-record-usage] 记录结果:', recordResult);

    if (!recordResult.success) {
      return NextResponse.json({
        success: false,
        error: recordResult.error,
        statsBefore: {
          current: statsBefore.currentPeriodUsage,
          limit: statsBefore.periodLimit,
          remaining: statsBefore.remainingUsage
        }
      });
    }

    // 3. 再次查询使用统计
    console.log('📊 [test-record-usage] 查询记录后的使用统计...');
    const statsAfter = await getUserUsageStats(user.id);
    console.log('📊 [test-record-usage] 记录后的统计:', {
      current: statsAfter.currentPeriodUsage,
      limit: statsAfter.periodLimit,
      remaining: statsAfter.remainingUsage
    });

    return NextResponse.json({
      success: true,
      message: '测试成功！使用次数已记录',
      statsBefore: {
        current: statsBefore.currentPeriodUsage,
        limit: statsBefore.periodLimit,
        remaining: statsBefore.remainingUsage,
        period: statsBefore.periodType
      },
      statsAfter: {
        current: statsAfter.currentPeriodUsage,
        limit: statsAfter.periodLimit,
        remaining: statsAfter.remainingUsage
      },
      recorded: statsAfter.currentPeriodUsage - statsBefore.currentPeriodUsage
    });

  } catch (error: any) {
    console.error('❌ [test-record-usage] 测试失败:', error);
    console.error('❌ [test-record-usage] 错误详情:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unknown error',
        details: error?.stack
      },
      { status: 500 }
    );
  }
}

// 同时支持 GET 请求查看当前统计
export async function GET(request: NextRequest) {
  console.log('🧪 [test-record-usage] GET 请求 - 查看当前统计');

  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const { user } = authResult;
    const stats = await getUserUsageStats(user.id);

    return NextResponse.json({
      success: true,
      stats: {
        userId: stats.userId,
        planType: stats.planType,
        current: stats.currentPeriodUsage,
        limit: stats.periodLimit,
        remaining: stats.remainingUsage,
        isUnlimited: stats.isUnlimited,
        period: stats.periodType,
        periodStart: stats.periodStart,
        periodEnd: stats.periodEnd
      }
    });

  } catch (error: any) {
    console.error('❌ [test-record-usage] GET 请求失败:', error);
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}
