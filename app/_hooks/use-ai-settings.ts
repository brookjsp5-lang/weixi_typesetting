import { useEffect, useState } from "react";
import { aiStorageKeys, openRouterConfig } from "../_lib/formatter-constants";
import { getProviderPreset } from "../_lib/workflow-utils";
import type { AiProviderType } from "../_types/formatter";
import type { ShowToast } from "./use-toast";

const isAiProviderType = (value: string | null): value is AiProviderType =>
  value === "openrouter" ||
  value === "deepseek" ||
  value === "volcengine" ||
  value === "dashscope" ||
  value === "qwen" ||
  value === "minimax" ||
  value === "mimo" ||
  value === "moonshot" ||
  value === "zhipu" ||
  value === "openai" ||
  value === "anthropic" ||
  value === "custom";

export function useAiSettings(showToast: ShowToast) {
  const [showAiConfigModal, setShowAiConfigModal] = useState(false);
  const [aiProviderType, setAiProviderType] = useState<AiProviderType>("openrouter");
  const [aiBaseUrl, setAiBaseUrl] = useState<string>(openRouterConfig.baseUrl);
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiImageBaseUrl, setAiImageBaseUrl] = useState("");
  const [aiImageApiKey, setAiImageApiKey] = useState("");
  const [aiImageModel, setAiImageModel] = useState("");

  useEffect(() => {
    const savedProvider = localStorage.getItem(aiStorageKeys.provider);
    if (isAiProviderType(savedProvider)) {
      setAiProviderType(savedProvider);
    }
    const preset = getProviderPreset(
      isAiProviderType(savedProvider) ? savedProvider : "openrouter",
    );
    setAiBaseUrl(
      localStorage.getItem(aiStorageKeys.baseUrl) || preset.baseUrl || openRouterConfig.baseUrl,
    );
    setAiApiKey(localStorage.getItem(aiStorageKeys.apiKey) || "");
    setAiModel(localStorage.getItem(aiStorageKeys.model) || preset.defaultModel || "");
    setAiImageBaseUrl(localStorage.getItem(aiStorageKeys.imageBaseUrl) || "");
    setAiImageApiKey(localStorage.getItem(aiStorageKeys.imageApiKey) || "");
    setAiImageModel(localStorage.getItem(aiStorageKeys.imageModel) || "");
  }, []);

  const saveAiSettings = () => {
    const trimmedBaseUrl = aiBaseUrl.trim();
    const trimmedApiKey = aiApiKey.trim();
    const trimmedModel = aiModel.trim();

    if (!trimmedBaseUrl || !trimmedApiKey || !trimmedModel) {
      showToast("请填写 API 地址、API Key 和模型名称", "error");
      return;
    }

    localStorage.setItem(aiStorageKeys.provider, aiProviderType);
    localStorage.setItem(aiStorageKeys.baseUrl, trimmedBaseUrl);
    localStorage.setItem(aiStorageKeys.apiKey, trimmedApiKey);
    localStorage.setItem(aiStorageKeys.model, trimmedModel);
    localStorage.setItem(aiStorageKeys.imageBaseUrl, aiImageBaseUrl.trim());
    localStorage.setItem(aiStorageKeys.imageApiKey, aiImageApiKey.trim());
    localStorage.setItem(aiStorageKeys.imageModel, aiImageModel.trim());
    setAiBaseUrl(trimmedBaseUrl);
    setAiApiKey(trimmedApiKey);
    setAiModel(trimmedModel);
    setAiImageBaseUrl(aiImageBaseUrl.trim());
    setAiImageApiKey(aiImageApiKey.trim());
    setAiImageModel(aiImageModel.trim());
    setShowAiConfigModal(false);
    showToast("AI 配置已保存");
  };

  const clearAiSettings = () => {
    localStorage.removeItem(aiStorageKeys.provider);
    localStorage.removeItem(aiStorageKeys.baseUrl);
    localStorage.removeItem(aiStorageKeys.apiKey);
    localStorage.removeItem(aiStorageKeys.model);
    localStorage.removeItem(aiStorageKeys.imageBaseUrl);
    localStorage.removeItem(aiStorageKeys.imageApiKey);
    localStorage.removeItem(aiStorageKeys.imageModel);
    setAiProviderType("openrouter");
    setAiBaseUrl(openRouterConfig.baseUrl);
    setAiApiKey("");
    setAiModel("");
    setAiImageBaseUrl("");
    setAiImageApiKey("");
    setAiImageModel("");
    showToast("AI 配置已清空");
  };

  return {
    showAiConfigModal,
    setShowAiConfigModal,
    aiProviderType,
    setAiProviderType,
    aiBaseUrl,
    setAiBaseUrl,
    aiApiKey,
    setAiApiKey,
    aiModel,
    setAiModel,
    aiImageBaseUrl,
    setAiImageBaseUrl,
    aiImageApiKey,
    setAiImageApiKey,
    aiImageModel,
    setAiImageModel,
    saveAiSettings,
    clearAiSettings,
  };
}
