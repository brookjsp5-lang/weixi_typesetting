import { Check, ExternalLink, Loader2, Search } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { openRouterConfig } from "../_lib/formatter-constants";
import { getProviderPreset, providerPresets } from "../_lib/workflow-utils";
import type { AiProviderType, OpenRouterModel } from "../_types/formatter";

let cachedModels: OpenRouterModel[] | null = null;
let pendingModelsRequest: Promise<OpenRouterModel[]> | null = null;

const loadOpenRouterModels = async () => {
  if (cachedModels) return cachedModels;

  pendingModelsRequest ??= fetch("/api/openrouter-models").then(async (res) => {
    const data = (await res.json().catch(() => null)) as {
      models?: OpenRouterModel[];
      error?: string;
    } | null;

    if (!res.ok) {
      throw new Error(data?.error || "模型列表加载失败");
    }

    cachedModels = data?.models || [];
    return cachedModels;
  });

  try {
    return await pendingModelsRequest;
  } finally {
    pendingModelsRequest = null;
  }
};

const formatContextLength = (contextLength: number) => {
  if (!contextLength) return "未知";
  if (contextLength >= 1000000) return `${(contextLength / 1000000).toFixed(1)}M`;
  if (contextLength >= 1000) return `${Math.round(contextLength / 1000)}K`;

  return `${contextLength}`;
};

const formatModelPrice = (model: OpenRouterModel) => {
  if (model.isFree) return "免费";

  const promptPrice = Number(model.promptPrice) * 1000000;
  const completionPrice = Number(model.completionPrice) * 1000000;
  if (
    !Number.isFinite(promptPrice) ||
    !Number.isFinite(completionPrice) ||
    promptPrice <= 0 ||
    completionPrice <= 0
  ) {
    return "价格见 OpenRouter";
  }

  return `$${promptPrice.toFixed(3)} / $${completionPrice.toFixed(3)} 每 1M tokens`;
};

type ProviderDraft = {
  baseUrl: string;
  apiKey: string;
  model: string;
  imageBaseUrl: string;
  imageApiKey: string;
  imageModel: string;
};

type ModelTestState = {
  status: "idle" | "testing" | "success" | "error";
  message: string;
};

const emptyDraft: ProviderDraft = {
  baseUrl: "",
  apiKey: "",
  model: "",
  imageBaseUrl: "",
  imageApiKey: "",
  imageModel: "",
};

const createEmptyProviderDrafts = (): Record<AiProviderType, ProviderDraft> => ({
  openrouter: {
    ...emptyDraft,
    baseUrl: openRouterConfig.baseUrl,
  },
  deepseek: { ...emptyDraft, baseUrl: getProviderPreset("deepseek").baseUrl },
  volcengine: { ...emptyDraft, baseUrl: getProviderPreset("volcengine").baseUrl },
  dashscope: { ...emptyDraft, baseUrl: getProviderPreset("dashscope").baseUrl },
  qwen: { ...emptyDraft, baseUrl: getProviderPreset("qwen").baseUrl },
  minimax: { ...emptyDraft, baseUrl: getProviderPreset("minimax").baseUrl },
  mimo: { ...emptyDraft, baseUrl: getProviderPreset("mimo").baseUrl },
  moonshot: { ...emptyDraft, baseUrl: getProviderPreset("moonshot").baseUrl },
  zhipu: { ...emptyDraft, baseUrl: getProviderPreset("zhipu").baseUrl },
  openai: { ...emptyDraft },
  anthropic: { ...emptyDraft },
  custom: { ...emptyDraft },
});

type AiConfigModalProps = {
  open: boolean;
  aiProviderType: AiProviderType;
  setAiProviderType: React.Dispatch<React.SetStateAction<AiProviderType>>;
  aiBaseUrl: string;
  setAiBaseUrl: React.Dispatch<React.SetStateAction<string>>;
  aiApiKey: string;
  setAiApiKey: React.Dispatch<React.SetStateAction<string>>;
  aiModel: string;
  setAiModel: React.Dispatch<React.SetStateAction<string>>;
  aiImageBaseUrl: string;
  setAiImageBaseUrl: React.Dispatch<React.SetStateAction<string>>;
  aiImageApiKey: string;
  setAiImageApiKey: React.Dispatch<React.SetStateAction<string>>;
  aiImageModel: string;
  setAiImageModel: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onSave: () => void;
  onClear: () => void;
};

export function AiConfigModal({
  open,
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
  onClose,
  onSave,
  onClear,
}: AiConfigModalProps) {
  const [models, setModels] = useState<OpenRouterModel[]>(cachedModels || []);
  const [modelQuery, setModelQuery] = useState("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [modelTest, setModelTest] = useState<ModelTestState>({
    status: "idle",
    message: "",
  });
  const [imageModelTest, setImageModelTest] = useState<ModelTestState>({
    status: "idle",
    message: "",
  });
  const isOpenRouter = aiProviderType === "openrouter";
  const [providerDrafts, setProviderDrafts] = useState<Record<AiProviderType, ProviderDraft>>(() =>
    createEmptyProviderDrafts(),
  );
  const currentPreset = getProviderPreset(aiProviderType);

  useEffect(() => {
    if (!open) return;

    setProviderDrafts((prev) => ({
      ...prev,
      [aiProviderType]: {
        baseUrl: aiBaseUrl,
        apiKey: aiApiKey,
        model: aiModel,
        imageBaseUrl: aiImageBaseUrl,
        imageApiKey: aiImageApiKey,
        imageModel: aiImageModel,
      },
    }));
  }, [
    open,
    aiProviderType,
    aiBaseUrl,
    aiApiKey,
    aiModel,
    aiImageBaseUrl,
    aiImageApiKey,
    aiImageModel,
  ]);

  useEffect(() => {
    if (!open || !isOpenRouter || cachedModels) return;

    let cancelled = false;
    setIsLoadingModels(true);
    setModelsError("");

    loadOpenRouterModels()
      .then((loadedModels) => {
        if (!cancelled) setModels(loadedModels);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setModelsError(err instanceof Error ? err.message : "模型列表加载失败");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, isOpenRouter]);

  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLowerCase();
    if (!query) return models.slice(0, 80);

    return models
      .filter((model) => {
        return model.name.toLowerCase().includes(query) || model.id.toLowerCase().includes(query);
      })
      .slice(0, 80);
  }, [models, modelQuery]);

  const handleClear = () => {
    setModelQuery("");
    setModelTest({ status: "idle", message: "" });
    setImageModelTest({ status: "idle", message: "" });
    setProviderDrafts(createEmptyProviderDrafts());
    onClear();
  };

  const syncCurrentDraft = (patch: Partial<ProviderDraft>) => {
    setProviderDrafts((prev) => ({
      ...prev,
      [aiProviderType]: {
        ...prev[aiProviderType],
        ...patch,
      },
    }));
  };

  const handleBaseUrlChange = (value: string) => {
    setModelTest({ status: "idle", message: "" });
    setAiBaseUrl(value);
    syncCurrentDraft({ baseUrl: value });
  };

  const handleApiKeyChange = (value: string) => {
    setModelTest({ status: "idle", message: "" });
    setAiApiKey(value);
    syncCurrentDraft({ apiKey: value });
  };

  const handleModelChange = (value: string) => {
    setModelTest({ status: "idle", message: "" });
    setAiModel(value);
    syncCurrentDraft({ model: value });
  };

  const handleImageModelChange = (value: string) => {
    setImageModelTest({ status: "idle", message: "" });
    setAiImageModel(value);
    syncCurrentDraft({ imageModel: value });
  };

  const handleImageBaseUrlChange = (value: string) => {
    setImageModelTest({ status: "idle", message: "" });
    setAiImageBaseUrl(value);
    syncCurrentDraft({ imageBaseUrl: value });
  };

  const handleImageApiKeyChange = (value: string) => {
    setImageModelTest({ status: "idle", message: "" });
    setAiImageApiKey(value);
    syncCurrentDraft({ imageApiKey: value });
  };

  const handleProviderChange = (provider: AiProviderType) => {
    if (provider === aiProviderType) return;

    const nextDrafts = {
      ...providerDrafts,
      [aiProviderType]: {
        baseUrl: aiBaseUrl,
        apiKey: aiApiKey,
        model: aiModel,
        imageBaseUrl: aiImageBaseUrl,
        imageApiKey: aiImageApiKey,
        imageModel: aiImageModel,
      },
    };
    const targetDraft = nextDrafts[provider];
    const preset = getProviderPreset(provider);
    const targetBaseUrl = targetDraft.baseUrl || preset.baseUrl;
    const targetModel = targetDraft.model || preset.defaultModel;

    setProviderDrafts(nextDrafts);
    setModelTest({ status: "idle", message: "" });
    setImageModelTest({ status: "idle", message: "" });
    setAiProviderType(provider);
    setAiBaseUrl(targetBaseUrl);
    setAiApiKey(targetDraft.apiKey);
    setAiModel(targetModel);
    setAiImageBaseUrl(targetDraft.imageBaseUrl);
    setAiImageApiKey(targetDraft.imageApiKey);
    setAiImageModel(targetDraft.imageModel);
  };

  const handleTestModel = async () => {
    if (modelTest.status === "testing") return;

    setModelTest({ status: "testing", message: "正在测试模型连通性..." });

    try {
      const res = await fetch("/api/ai-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerType: aiProviderType,
          baseUrl: aiBaseUrl,
          apiKey: aiApiKey,
          model: aiModel,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;

      if (!res.ok) {
        setModelTest({
          status: "error",
          message: data?.error || "模型测试失败，请检查配置后重试",
        });
        return;
      }

      setModelTest({
        status: "success",
        message: data?.message || "模型可用",
      });
    } catch {
      setModelTest({
        status: "error",
        message: "模型测试失败，请检查网络或稍后重试",
      });
    }
  };

  const handleTestImageModel = async () => {
    if (imageModelTest.status === "testing") return;

    setImageModelTest({ status: "testing", message: "正在测试生图配置..." });

    try {
      const res = await fetch("/api/ai-cover-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: aiImageBaseUrl.trim() || aiBaseUrl,
          apiKey: aiImageApiKey.trim() || aiApiKey,
          model: aiImageModel,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;

      if (!res.ok) {
        setImageModelTest({
          status: "error",
          message: data?.error || "真实生图测试失败，请检查模型、接口、Key 或额度",
        });
        return;
      }

      setImageModelTest({
        status: "success",
        message: data?.message || "生图配置可用",
      });
    } catch {
      setImageModelTest({
        status: "error",
        message: "生图测试失败，请检查接口、模型和额度",
      });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center neo-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="neo-modal flex flex-col max-w-2xl w-full mx-4 transform transition-all max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center p-6 pb-4 shrink-0 border-b-[3px] border-(--neo-ink)">
          <h3 className="text-xl font-black text-(--neo-ink) mb-2 uppercase">AI 服务配置</h3>
          <p className="text-sm neo-text-muted font-bold">
            支持 OpenRouter、国内大模型与 OpenAI 兼容 API 接口
          </p>
        </div>

        <div className="flex-1 overflow-y-auto neo-scrollbar p-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-black text-(--neo-ink) mb-2">服务商</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-(--neo-cyan) border-[3px] border-(--neo-ink) p-2">
              {providerPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleProviderChange(preset.id)}
                  className={`py-2 px-2 text-xs sm:text-sm flex items-center justify-center gap-2 ${
                    aiProviderType === preset.id ? "neo-tab neo-tab-active" : "neo-tab"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <section className="rounded-xl border-[3px] border-(--neo-ink) bg-white p-4 space-y-3">
            <div>
              <h4 className="text-sm font-black text-(--neo-ink)">文本模型</h4>
              <p className="text-xs neo-text-muted font-bold">
                用于 AI 改写、AI 排版、标题摘要关键词。
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-1">
                <label className="block text-sm font-black text-(--neo-ink)">API 地址</label>
                {isOpenRouter && (
                  <button
                    type="button"
                    onClick={() => handleBaseUrlChange(openRouterConfig.baseUrl)}
                    className="text-xs font-black underline text-(--neo-ink)"
                  >
                    恢复默认
                  </button>
                )}
                {!isOpenRouter && currentPreset.baseUrl && aiBaseUrl !== currentPreset.baseUrl && (
                  <button
                    type="button"
                    onClick={() => handleBaseUrlChange(currentPreset.baseUrl)}
                    className="text-xs font-black underline text-(--neo-ink)"
                  >
                    使用预设
                  </button>
                )}
              </div>
              <input
                type="text"
                value={aiBaseUrl}
                readOnly={isOpenRouter}
                onChange={(e) => handleBaseUrlChange(e.target.value)}
                className={`neo-input w-full px-3 py-2 ${isOpenRouter ? "bg-(--neo-surface)" : ""}`}
                placeholder={currentPreset.baseUrl || "https://example.com/v1"}
                autoComplete="off"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-1">
                <label className="block text-sm font-black text-(--neo-ink)">API Key</label>
                {currentPreset.apiKeyUrl && (
                  <a
                    href={currentPreset.apiKeyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-black underline text-(--neo-ink) inline-flex items-center gap-1"
                  >
                    获取 API Key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="password"
                value={aiApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="neo-input w-full px-3 py-2"
                placeholder="粘贴你的 API Key"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-(--neo-ink) mb-1">
                {isOpenRouter ? "已选文本模型" : "文本模型名称"}
              </label>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="neo-input w-full px-3 py-2"
                placeholder={
                  isOpenRouter
                    ? "选择下方模型，或手动输入 OpenRouter 模型 ID"
                    : currentPreset.modelHelp
                }
                autoComplete="off"
              />
            </div>

            <div className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-black text-(--neo-ink)">文本模型测试</h4>
                  <p className="text-xs neo-text-muted font-bold">
                    发送一次极短请求，检查 API Key、地址和模型名是否可用。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestModel}
                  disabled={modelTest.status === "testing"}
                  className="neo-button neo-button-secondary shrink-0 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {modelTest.status === "testing" ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      测试中
                    </span>
                  ) : (
                    "测试文本模型"
                  )}
                </button>
              </div>
              {modelTest.status !== "idle" && (
                <div
                  className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                    modelTest.status === "success"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : modelTest.status === "error"
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-(--neo-line) bg-white text-(--neo-ink)"
                  }`}
                >
                  {modelTest.message}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-(--neo-ink)">封面生图</h4>
                <p className="text-xs neo-text-muted font-bold leading-relaxed">
                  高级可选。只有填写支持生图的模型后，AI 生图才会生成封面图。
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-(--neo-line) bg-white px-2 py-1 text-[10px] font-black neo-text-muted">
                可选
              </span>
            </div>

            <div>
              <label className="block text-sm font-black text-(--neo-ink) mb-1">
                生图 API 地址
              </label>
              <input
                type="text"
                value={aiImageBaseUrl}
                onChange={(e) => handleImageBaseUrlChange(e.target.value)}
                className="neo-input w-full px-3 py-2"
                placeholder="可填 base URL 或完整 /images/generations 地址"
                autoComplete="off"
              />
              <p className="mt-1 text-xs neo-text-muted font-bold leading-relaxed">
                例如 https://ark.cn-beijing.volces.com/api/v3 或
                https://ark.cn-beijing.volces.com/api/v3/images/generations。
              </p>
            </div>

            <div>
              <label className="block text-sm font-black text-(--neo-ink) mb-1">生图 API Key</label>
              <input
                type="password"
                value={aiImageApiKey}
                onChange={(e) => handleImageApiKeyChange(e.target.value)}
                className="neo-input w-full px-3 py-2"
                placeholder="留空则复用文本 API Key"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-(--neo-ink) mb-1">生图模型</label>
              <input
                type="text"
                value={aiImageModel}
                onChange={(e) => handleImageModelChange(e.target.value)}
                className="neo-input w-full px-3 py-2"
                placeholder="例如 gpt-image-1 或 doubao-seedream-4-5-251128"
                autoComplete="off"
              />
              <p className="mt-1 text-xs neo-text-muted font-bold leading-relaxed">
                火山方舟请确认模型 ID、API Key 权限、额度和接口区域一致。
              </p>
            </div>

            <div className="rounded-xl border border-(--neo-line) bg-white p-3 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-black text-(--neo-ink)">生图配置测试</h4>
                  <p className="text-xs neo-text-muted font-bold">
                    测试真实生图是否可用；失败时请更换模型或接口。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestImageModel}
                  disabled={imageModelTest.status === "testing"}
                  className="neo-button neo-button-secondary shrink-0 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {imageModelTest.status === "testing" ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      测试中
                    </span>
                  ) : (
                    "测试生图"
                  )}
                </button>
              </div>
              {imageModelTest.status !== "idle" && (
                <div
                  className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                    imageModelTest.status === "success"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : imageModelTest.status === "error"
                        ? "border-amber-300 bg-amber-50 text-amber-800"
                        : "border-(--neo-line) bg-white text-(--neo-ink)"
                  }`}
                >
                  {imageModelTest.message}
                </div>
              )}
            </div>
          </section>

          {isOpenRouter && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-black text-(--neo-ink)">搜索模型</label>
                <a
                  href={openRouterConfig.modelsPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-black underline text-(--neo-ink) inline-flex items-center gap-1"
                >
                  浏览模型库
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--neo-ink)" />
                <input
                  type="text"
                  value={modelQuery}
                  onChange={(e) => setModelQuery(e.target.value)}
                  className="neo-input w-full pl-9 pr-3 py-2"
                  placeholder="输入模型名称或 ID，例如 qwen、gemini、:free"
                  autoComplete="off"
                />
              </div>

              <div className="border-[3px] border-(--neo-ink) bg-(--neo-surface) max-h-64 overflow-y-auto custom-scrollbar">
                {isLoadingModels && (
                  <div className="p-4 text-sm font-black text-(--neo-ink) flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    正在加载 OpenRouter 模型列表
                  </div>
                )}

                {!isLoadingModels && modelsError && (
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-black text-(--neo-ink)">{modelsError}</p>
                    <p className="text-xs neo-text-muted font-bold">
                      你仍然可以在“已选模型”里手动输入模型 ID。
                    </p>
                  </div>
                )}

                {!isLoadingModels && !modelsError && filteredModels.length === 0 && (
                  <div className="p-4 text-sm font-black text-(--neo-ink)">
                    没有匹配的模型，可以手动输入模型 ID。
                  </div>
                )}

                {!isLoadingModels &&
                  !modelsError &&
                  filteredModels.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleModelChange(model.id)}
                      className={`w-full text-left p-3 border-b-2 border-(--neo-ink) last:border-b-0 hover:bg-(--neo-cyan) ${
                        aiModel === model.id ? "bg-(--neo-yellow)" : ""
                      }`}
                      title={model.description}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-(--neo-ink) truncate">
                              {model.name}
                            </span>
                            {aiModel === model.id && (
                              <Check className="w-4 h-4 shrink-0 text-(--neo-ink)" />
                            )}
                          </div>
                          <p className="text-xs neo-text-muted font-bold break-all">{model.id}</p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <span
                            className={`inline-block border-2 border-(--neo-ink) px-1.5 py-0.5 text-[10px] font-black ${
                              model.isFree
                                ? "bg-(--neo-green) text-[#111111]"
                                : "bg-(--neo-surface) text-(--neo-ink)"
                            }`}
                          >
                            {model.isFree ? "免费" : "付费"}
                          </span>
                          <p className="text-[10px] neo-text-muted font-bold">
                            {formatContextLength(model.contextLength)} ctx
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] neo-text-muted font-bold mt-1">
                        {formatModelPrice(model)}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <p className="text-xs leading-relaxed neo-text-muted font-bold">
            配置只保存在当前浏览器本地，排版时会临时发送到服务端调用你选择的模型服务。
            {isOpenRouter && " 模型列表来自 OpenRouter，免费模型会优先展示。"}
          </p>
        </div>

        <div className="flex gap-3 p-6 pt-4 shrink-0 border-t-[3px] border-(--neo-ink)">
          <button onClick={onSave} className="neo-button neo-button-primary flex-1 py-2.5">
            保存配置
          </button>
          <button onClick={handleClear} className="neo-button neo-button-secondary px-4 py-2.5">
            清空
          </button>
          <button onClick={onClose} className="neo-button neo-button-ghost px-4 py-2.5">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
