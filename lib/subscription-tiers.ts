/**
 * 订阅层级和模型配置
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// 检测是否为国际版
const isInternational = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase';

/**
 * 订阅层级配置
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    nameZh: '免费版',
    limits: {},
    maxRequests: 30,
    maxFiles: 5,
    models: isInternational
      ? ['codestral-latest']
      : ['qwen-turbo', 'deepseek-coder']
  },
  pro: {
    name: 'Pro',
    nameZh: '专业版',
    limits: {},
    maxRequests: 500,
    maxFiles: -1,
    models: isInternational
      ? ['codestral-latest', 'mistral-medium-latest']
      : ['qwen-turbo', 'qwen-plus', 'deepseek-coder', 'glm-4.6']
  },
  enterprise: {
    name: 'Enterprise',
    nameZh: '企业版',
    limits: {},
    maxRequests: -1,
    maxFiles: -1,
    models: isInternational
      ? ['codestral-latest', 'mistral-medium-latest', 'mistral-large-latest']
      : ['qwen-turbo', 'qwen-plus', 'qwen-max', 'deepseek-coder', 'glm-4.6']
  }
};

/**
 * 可用模型配置
 */
export const AVAILABLE_MODELS: Record<string, any> = isInternational ? {
  // 国际版模型配置 - 仅 Mistral 模型
  'codestral-latest': {
    id: 'codestral-latest',
    name: 'Codestral',
    nameZh: 'Codestral',
    description: 'Specialized for code generation',
    descriptionZh: '专为代码生成优化',
    provider: 'mistral',
    contextWindow: 32000,
    maxTokens: 8192,
    pricing: { input: 0.001, output: 0.003 }
  },
  'mistral-medium-latest': {
    id: 'mistral-medium-latest',
    name: 'Mistral Medium',
    nameZh: 'Mistral Medium',
    description: 'Balanced performance and cost',
    descriptionZh: '性能与成本的平衡',
    provider: 'mistral',
    contextWindow: 32000,
    maxTokens: 8192,
    pricing: { input: 0.0027, output: 0.0081 }
  },
  'mistral-large-latest': {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    nameZh: 'Mistral Large',
    description: 'Most capable Mistral model',
    descriptionZh: '最强大的Mistral模型',
    provider: 'mistral',
    contextWindow: 128000,
    maxTokens: 8192,
    pricing: { input: 0.004, output: 0.012 }
  }
} : {
  // 国内版模型配置
  'deepseek-coder': {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    nameZh: 'DeepSeek 编程',
    description: 'Specialized for coding tasks',
    descriptionZh: '专为编程任务优化',
    provider: 'deepseek',
    contextWindow: 16384,
    maxTokens: 16384,
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
  },
  'qwen-turbo': {
    id: 'qwen-turbo',
    name: 'Qwen Turbo',
    nameZh: '通义千问 Turbo',
    description: 'Fast and efficient AI model',
    descriptionZh: '快速高效的AI模型',
    provider: 'dashscope',
    contextWindow: 8192,
    maxTokens: 8192,
    pricing: { input: 0.0008, output: 0.002 }
  },
  'qwen-plus': {
    id: 'qwen-plus',
    name: 'Qwen Plus',
    nameZh: '通义千问 Plus',
    description: 'Balanced performance and quality',
    descriptionZh: '性能与质量平衡',
    provider: 'dashscope',
    contextWindow: 32768,
    maxTokens: 16384,
    pricing: { input: 0.004, output: 0.012 }
  },
  'qwen-max': {
    id: 'qwen-max',
    name: 'Qwen Max',
    nameZh: '通义千问 Max',
    description: 'Most capable model for complex tasks',
    descriptionZh: '最强大的模型,适合复杂任务',
    provider: 'dashscope',
    contextWindow: 32768,
    maxTokens: 8192,
    pricing: { input: 0.02, output: 0.06 }
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
    return tierModels[0] || (isInternational ? 'mistral-small' : 'qwen-turbo');
  }
  return isInternational ? 'mistral-small' : 'qwen-turbo';
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

/**
 * 获取订阅层级的最大文件数限制
 */
export function getMaxFiles(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier].maxFiles;
}

/**
 * 检查文件数是否超过限制
 */
export function canGenerateFiles(tier: SubscriptionTier, fileCount: number): boolean {
  const maxFiles = getMaxFiles(tier);
  if (maxFiles === -1) return true;
  return fileCount <= maxFiles;
}
