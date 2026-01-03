"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Star, Check } from "lucide-react";
import {
  SUBSCRIPTION_TIERS,
  AVAILABLE_MODELS,
  getAvailableModelsForTier,
  canUseModel,
  getDefaultModel,
  type SubscriptionTier
} from "@/lib/subscription-tiers";

interface ModelSelectorProps {
  currentModel: string;
  userTier: SubscriptionTier;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  language?: "en" | "zh";
}

const translations = {
  en: {
    selectModel: "Select AI Model",
    upgradeRequired: "Upgrade Required",
    upgradeToUse: "Upgrade to use this model",
    currentPlan: "Current Plan",
    availableModels: "Available Models",
    lockedModels: "Locked Models",
    free: "Free",
    basic: "Basic",
    pro: "Pro",
    premium: "Premium",
  },
  zh: {
    selectModel: "选择AI模型",
    upgradeRequired: "需要升级",
    upgradeToUse: "升级以使用此模型",
    currentPlan: "当前套餐",
    availableModels: "可用模型",
    lockedModels: "锁定模型",
    free: "免费版",
    basic: "基础版",
    pro: "专业版",
    premium: "旗舰版",
  },
};

export function ModelSelector({
  currentModel,
  userTier,
  onModelChange,
  disabled = false,
  language = "en"
}: ModelSelectorProps) {
  const t = translations[language];
  const [isOpen, setIsOpen] = useState(false);

  const availableModels = getAvailableModelsForTier(userTier);
  const currentTierConfig = SUBSCRIPTION_TIERS[userTier];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Zap className="h-3 w-3" />;
      case 'basic': return <Check className="h-3 w-3" />;
      case 'pro': return <Crown className="h-3 w-3" />;
      case 'premium': return <Star className="h-3 w-3" />;
      default: return <Zap className="h-3 w-3" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModelTier = (modelId: string): SubscriptionTier => {
    for (const [tierId, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
      if (tier.models.includes(modelId)) {
        return tierId as SubscriptionTier;
      }
    }
    return 'free';
  };

  const currentModelConfig = AVAILABLE_MODELS[currentModel];
  const currentModelTier = getModelTier(currentModel);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.selectModel}
        </label>
        <Badge variant="outline" className={`${getTierColor(userTier)} border-current`}>
          <div className="flex items-center gap-1">
            {getTierIcon(userTier)}
            {t[userTier as keyof typeof t]}
          </div>
        </Badge>
      </div>

      <Select
        value={currentModel}
        onValueChange={onModelChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span>{currentModelConfig?.name || currentModel}</span>
                <Badge variant="secondary" className="text-xs">
                  {t[currentModelTier as keyof typeof t]}
                </Badge>
              </div>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* 可用的模型 */}
          {availableModels.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-green-600">
                {t.availableModels}
              </div>
              {availableModels.map((model) => {
                const modelTier = getModelTier(model.id);
                return (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Badge variant="outline" className={`text-xs ${getTierColor(modelTier)}`}>
                          {t[modelTier as keyof typeof t]}
                        </Badge>
                        {currentModel === model.id && <Check className="h-3 w-3 text-green-500" />}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </>
          )}

          {/* 锁定的模型（需要升级） */}
          {Object.values(AVAILABLE_MODELS).filter(model => !canUseModel(userTier, model.id)).length > 0 && (
            <>
              <div className="border-t my-2" />
              <div className="px-2 py-1 text-xs font-medium text-orange-600">
                {t.lockedModels}
              </div>
              {Object.values(AVAILABLE_MODELS)
                .filter(model => !canUseModel(userTier, model.id))
                .map((model) => {
                  const modelTier = getModelTier(model.id);
                  return (
                    <SelectItem key={model.id} value={model.id} disabled>
                      <div className="flex items-center justify-between w-full opacity-60">
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Badge variant="outline" className={`text-xs ${getTierColor(modelTier)}`}>
                            {t.upgradeRequired}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
            </>
          )}
        </SelectContent>
      </Select>

      {/* 升级提示 */}
      {currentModel && !canUseModel(userTier, currentModel) && (
        <div className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
            <span>{t.upgradeToUse} {AVAILABLE_MODELS[currentModel]?.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}












