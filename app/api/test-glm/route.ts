import { NextResponse } from 'next/server';
import { SUBSCRIPTION_TIERS, AVAILABLE_MODELS, getAvailableModelsForTier, canUseModel } from '@/lib/subscription-tiers';

export async function GET() {
  const testResults = {
    glm46InProTier: SUBSCRIPTION_TIERS.pro.models.includes('glm-4.6'),
    glm46InEnterpriseTier: SUBSCRIPTION_TIERS.enterprise.models.includes('glm-4.6'),
    glm46ModelConfig: AVAILABLE_MODELS['glm-4.6'],
    proTierModels: getAvailableModelsForTier('pro').map(m => ({ id: m.id, name: m.name })),
    canProUseGlm46: canUseModel('pro', 'glm-4.6'),
    canFreeUseGlm46: canUseModel('free', 'glm-4.6'),
    envVars: {
      GLM_API_KEY: process.env.GLM_API_KEY ? '已配置' : '未配置',
      GLM_BASE_URL: process.env.GLM_BASE_URL || '使用默认',
      GLM_MODEL: process.env.GLM_MODEL || '使用默认 (glm-4-6)'
    }
  };

  return NextResponse.json({
    message: 'GLM-4.6 配置测试结果',
    results: testResults,
    status: testResults.glm46InProTier && testResults.canProUseGlm46 ? '配置正确' : '配置有误'
  });
}













