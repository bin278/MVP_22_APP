/**
 * 测试国际版使用次数扣除
 *
 * 用于调试和验证国际版的使用次数扣除逻辑
 *
 * 使用方法：
 * POST /api/test-intl-usage
 * Body: { userId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordRecommendationUsage, getUserUsageStats } from '@/lib/subscription/usage-tracker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('\n' + '='.repeat(80));
    console.log('🧪 测试国际版使用次数扣除');
    console.log('='.repeat(80) + '\n');

    // 1. 获取使用前的统计信息
    console.log('1️⃣ 获取使用前的统计信息...');
    const statsBefore = await getUserUsageStats(userId);
    console.log('✅ 使用前统计:', {
      userId: statsBefore.userId,
      planType: statsBefore.planType,
      currentPeriodUsage: statsBefore.currentPeriodUsage,
      periodLimit: statsBefore.periodLimit,
      remainingUsage: statsBefore.remainingUsage,
      isUnlimited: statsBefore.isUnlimited,
    });

    // 2. 记录一次使用
    console.log('\n2️⃣ 记录一次使用...');
    const result = await recordRecommendationUsage(userId, {
      test: true,
      timestamp: new Date().toISOString(),
    });

    console.log('✅ 记录结果:', result);

    // 3. 获取使用后的统计信息
    console.log('\n3️⃣ 获取使用后的统计信息...');
    const statsAfter = await getUserUsageStats(userId);
    console.log('✅ 使用后统计:', {
      userId: statsAfter.userId,
      planType: statsAfter.planType,
      currentPeriodUsage: statsAfter.currentPeriodUsage,
      periodLimit: statsAfter.periodLimit,
      remainingUsage: statsAfter.remainingUsage,
      isUnlimited: statsAfter.isUnlimited,
    });

    // 4. 对比变化
    console.log('\n4️⃣ 对比变化:');
    const usageDiff = statsAfter.currentPeriodUsage - statsBefore.currentPeriodUsage;
    const remainingDiff = statsAfter.remainingUsage - statsBefore.remainingUsage;
    const limitDiff = statsAfter.periodLimit - statsBefore.periodLimit;

    console.log('📊 变化统计:', {
      usageDiff: `${statsBefore.currentPeriodUsage} → ${statsAfter.currentPeriodUsage} (${usageDiff >= 0 ? '+' : ''}${usageDiff})`,
      remainingDiff: `${statsBefore.remainingUsage} → ${statsAfter.remainingUsage} (${remainingDiff >= 0 ? '+' : ''}${remainingDiff})`,
      limitDiff: `${statsBefore.periodLimit} → ${statsAfter.periodLimit} (${limitDiff >= 0 ? '+' : ''}${limitDiff})`,
    });

    // 5. 分析结果
    console.log('\n5️⃣ 结果分析:');

    if (usageDiff === 1) {
      console.log('✅ 推荐使用次数表 (recommendation_usage) 记录成功');
    } else if (usageDiff === 0) {
      console.log('ℹ️  推荐使用次数表 (recommendation_usage) 没有新增记录');
      console.log('ℹ️  这通常意味着使用次数是从加油包扣除的');
    } else {
      console.log('⚠️  推荐使用次数表 (recommendation_usage) 记录异常');
    }

    if (remainingDiff === -1) {
      console.log('✅ 剩余次数正确减少');
    } else if (remainingDiff === 0) {
      console.log('⚠️  剩余次数没有减少，可能有问题');
    } else if (limitDiff < 0) {
      console.log('✅ 加油包次数已扣除（总限额减少）');
    } else {
      console.log('⚠️  剩余次数变化异常');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ 测试完成');
    console.log('='.repeat(80) + '\n');

    return NextResponse.json({
      success: true,
      result,
      stats: {
        before: statsBefore,
        after: statsAfter,
        diff: {
          usageDiff,
          remainingDiff,
          limitDiff,
        },
      },
    });

  } catch (error: any) {
    console.error('❌ 测试失败:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
