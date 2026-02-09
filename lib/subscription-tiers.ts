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
      ? ['mistral-small']
      : ['qwen-turbo', 'deepseek-coder']
  },
  pro: {
    name: 'Pro',
    nameZh: '专业版',
    limits: {},
    maxRequests: 500,
    maxFiles: -1,
    models: isInternational
      ? ['gpt-3.5-turbo', 'gpt-4o-mini', 'claude-3-haiku', 'claude-3-5-sonnet']
      : ['qwen-turbo', 'qwen-plus', 'deepseek-coder', 'glm-4.6']
  },
  enterprise: {
    name: 'Enterprise',
    nameZh: '企业版',
    limits: {},
    maxRequests: -1,
    maxFiles: -1,
    models: isInternational
      ? ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-5-sonnet', 'claude-3-opus']
      : ['qwen-turbo', 'qwen-plus', 'qwen-max', 'deepseek-coder', 'glm-4.6']
  }
};

/**
 * 可用模型配置
 */
export const AVAILABLE_MODELS: Record<string, any> = isInternational ? {
  // 国际版模型配置
  'mistral-small': {
    id: 'mistral-small',
    name: 'Mistral Small',
    nameZh: 'Mistral Small',
    description: 'Fast and efficient Mistral model',
    descriptionZh: '快速高效的Mistral模型',
    provider: 'mistral',
    contextWindow: 32000,
    maxTokens: 8192,
    pricing: { input: 0.001, output: 0.003 }
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    nameZh: 'GPT-3.5 Turbo',
    description: 'Fast and efficient OpenAI model',
    descriptionZh: '快速高效的OpenAI模型',
    provider: 'openai',
    contextWindow: 16385,
    maxTokens: 4096,
    pricing: { input: 0.0005, output: 0.0015 }
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    nameZh: 'GPT-4o Mini',
    description: 'Affordable and intelligent small model',
    descriptionZh: '经济实惠的智能小模型',
    provider: 'openai',
    contextWindow: 128000,
    maxTokens: 16384,
    pricing: { input: 0.00015, output: 0.0006 }
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    nameZh: 'GPT-4o',
    description: 'Most capable OpenAI model',
    descriptionZh: '最强大的OpenAI模型',
    provider: 'openai',
    contextWindow: 128000,
    maxTokens: 16384,
    pricing: { input: 0.0025, output: 0.01 }
  },
  'claude-3-haiku': {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    nameZh: 'Claude 3 Haiku',
    description: 'Fast and cost-effective Claude model',
    descriptionZh: '快速且经济的Claude模型',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    pricing: { input: 0.00025, output: 0.00125 }
  },
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    nameZh: 'Claude 3.5 Sonnet',
    description: 'Balanced performance and intelligence',
    descriptionZh: '性能与智能的平衡',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 8192,
    pricing: { input: 0.003, output: 0.015 }
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    nameZh: 'Claude 3 Opus',
    description: 'Most capable Claude model for complex tasks',
    descriptionZh: '最强大的Claude模型，适合复杂任务',
    provider: 'anthropic',
    contextWindow: 200000,
    maxTokens: 4096,
    pricing: { input: 0.015, output: 0.075 }
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
