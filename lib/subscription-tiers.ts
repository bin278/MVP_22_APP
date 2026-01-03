/**
 * 订阅层级和模型配置
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

/**
 * 订阅层级配置
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    nameZh: '免费版',
    limits: {},
    maxRequests: 30,
    models: ['deepseek-chat']
  },
  pro: {
    name: 'Pro',
    nameZh: '专业版',
    limits: {},
    maxRequests: 500,
    models: ['deepseek-chat', 'deepseek-coder', 'glm-4.6']
  },
  enterprise: {
    name: 'Enterprise',
    nameZh: '企业版',
    limits: {},
    maxRequests: -1, // 无限
    models: ['deepseek-chat', 'deepseek-coder', 'glm-4.6']
  }
};

/**
 * 可用模型配置
 */
export const AVAILABLE_MODELS = {
  'deepseek-chat': {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    nameZh: 'DeepSeek 对话',
    description: 'General purpose AI assistant',
    descriptionZh: '通用AI助手',
    provider: 'deepseek',
    contextWindow: 32768,
    maxTokens: 4096,
    pricing: { input: 0.001, output: 0.002 }
  },
  'deepseek-coder': {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    nameZh: 'DeepSeek 编程',
    description: 'Specialized for coding tasks',
    descriptionZh: '专为编程任务优化',
    provider: 'deepseek',
    contextWindow: 16384,
    maxTokens: 4096,
    pricing: { input: 0.001, output: 0.002 }
  },
  'glm-4.6': {
    id: 'glm-4.6',
    name: 'GLM-4.6',
    nameZh: '智谱清言4.6',
    description: 'Advanced multimodal AI model by Zhipu AI',
    descriptionZh: '智谱AI多模态高级AI模型',
    provider: 'zhipu',
    contextWindow: 32768,
    maxTokens: 4096,
    pricing: { input: 0.001, output: 0.002 }
  }
};

/**
 * 获取指定订阅层级可用的模型
 */
export function getAvailableModelsForTier(tier: SubscriptionTier) {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  return tierConfig.models.map(modelId => AVAILABLE_MODELS[modelId]).filter(Boolean);
}

/**
 * 检查用户是否可以使用指定的模型
 */
export function canUseModel(tier: SubscriptionTier, modelId: string): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  return tierConfig.models.includes(modelId);
}

/**
 * 获取默认模型
 */
export function getDefaultModel(tier?: SubscriptionTier): string {
  if (tier && SUBSCRIPTION_TIERS[tier]) {
    const tierModels = SUBSCRIPTION_TIERS[tier].models;
    return tierModels[0] || 'deepseek-chat';
  }
  return 'deepseek-chat';
}

/**
 * 获取模型配置
 */
export function getModelConfig(modelId: string) {
  return AVAILABLE_MODELS[modelId];
}

/**
 * 获取所有可用模型的ID列表
 */
export function getAllAvailableModelIds(): string[] {
  return Object.keys(AVAILABLE_MODELS);
}
