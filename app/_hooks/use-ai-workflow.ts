import { useCallback, useState } from "react";
import { extractJsonObject } from "../_lib/workflow-utils";
import type {
  AiProviderType,
  AiTaskType,
  CoverGenerationResult,
  FormatDraft,
  PromptTemplate,
  PublishOptimizationResult,
  RewriteDraft,
  RunningAiTaskType,
} from "../_types/formatter";
import type { ShowToast } from "./use-toast";

type UseAiWorkflowParams = {
  inputText: string;
  setInputText: (value: string) => void;
  aiProviderType: AiProviderType;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  aiImageModel: string;
  setShowAiConfigModal: (value: boolean) => void;
  showToast: ShowToast;
};

type RequestAiTaskOptions = {
  emptyMessage?: string;
  emptyFallback?: string;
  maxAttempts?: number;
};

const readStreamText = async (body: ReadableStream<Uint8Array>) => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let streamedText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    streamedText += decoder.decode(value, { stream: true });
  }

  streamedText += decoder.decode();
  return streamedText.trim();
};

const normalizeStringArray = (value: unknown, limit: number) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, limit)
    : [];

const normalizePublishOptimization = (value: unknown): NonNullable<PublishOptimizationResult> => {
  const parsed = value as NonNullable<PublishOptimizationResult>;
  return {
    titles: Array.isArray(parsed.titles) ? parsed.titles.slice(0, 5) : [],
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
    recommendedCategory:
      typeof parsed.recommendedCategory === "string" ? parsed.recommendedCategory : undefined,
    recommendedTemplateId:
      typeof parsed.recommendedTemplateId === "string" ? parsed.recommendedTemplateId : undefined,
    recommendedThemeColor:
      typeof parsed.recommendedThemeColor === "string" ? parsed.recommendedThemeColor : undefined,
    suggestions: normalizeStringArray(parsed.suggestions, 6),
  };
};

export function useAiWorkflow({
  inputText,
  setInputText,
  aiProviderType,
  aiBaseUrl,
  aiApiKey,
  aiModel,
  aiImageModel,
  setShowAiConfigModal,
  showToast,
}: UseAiWorkflowParams) {
  const [runningTask, setRunningTask] = useState<RunningAiTaskType | null>(null);
  const [formatDraft, setFormatDraft] = useState<FormatDraft>(null);
  const [hasAppliedFormat, setHasAppliedFormat] = useState(false);
  const [rewriteDraft, setRewriteDraft] = useState<RewriteDraft>(null);
  const [hasAppliedRewrite, setHasAppliedRewrite] = useState(false);
  const [publishOptimization, setPublishOptimization] = useState<PublishOptimizationResult>(null);
  const [coverGenerationResult, setCoverGenerationResult] = useState<CoverGenerationResult>(null);

  const requestAiTask = useCallback(
    async (taskType: AiTaskType, rewritePrompt = "", options: RequestAiTaskOptions = {}) => {
      if (!inputText.trim() || runningTask) return null;

      const trimmedBaseUrl = aiBaseUrl.trim();
      const trimmedApiKey = aiApiKey.trim();
      const trimmedModel = aiModel.trim();
      if (!trimmedBaseUrl || !trimmedApiKey || !trimmedModel) {
        setShowAiConfigModal(true);
        showToast("请先配置 AI 服务地址、API Key 和模型", "error");
        return null;
      }

      const maxAttempts = Math.max(1, options.maxAttempts || 2);
      setRunningTask(taskType);
      try {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const res = await fetch("/api/ai-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              markdown: inputText,
              providerType: aiProviderType,
              baseUrl: trimmedBaseUrl,
              apiKey: trimmedApiKey,
              model: trimmedModel,
              taskType,
              rewritePrompt,
            }),
          });

          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            showToast(data?.error || "AI 任务失败，请重试", "error");
            return null;
          }

          if (!res.body) {
            showToast("AI 服务未返回内容，请重试", "error");
            return null;
          }

          const result = await readStreamText(res.body);
          if (result) return result;

          if (attempt < maxAttempts) continue;

          if (typeof options.emptyFallback === "string") {
            showToast(options.emptyMessage || "AI 返回内容为空，已使用当前内容继续处理");
            return options.emptyFallback;
          }

          showToast(options.emptyMessage || "AI 返回内容为空，请重试", "error");
          return null;
        }

        return null;
      } catch {
        showToast("网络错误，请稍后重试", "error");
        return null;
      } finally {
        setRunningTask(null);
      }
    },
    [
      inputText,
      runningTask,
      aiBaseUrl,
      aiApiKey,
      aiModel,
      setShowAiConfigModal,
      showToast,
      aiProviderType,
    ],
  );

  const runFormat = useCallback(async () => {
    const result = await requestAiTask("format");
    if (!result) return;
    setFormatDraft({
      original: inputText,
      formatted: result,
    });
    setHasAppliedFormat(false);
    showToast("排版稿已生成，请确认后应用");
  }, [inputText, requestAiTask, showToast]);

  const applyFormatDraft = useCallback(() => {
    if (!formatDraft) return;
    setInputText(formatDraft.formatted);
    setFormatDraft(null);
    setHasAppliedFormat(true);
    showToast("已应用 AI 排版");
  }, [formatDraft, setInputText, showToast]);

  const discardFormatDraft = useCallback(() => {
    setFormatDraft(null);
    showToast("已取消 AI 排版稿");
  }, [showToast]);

  const runRewrite = useCallback(
    async (promptTemplate?: PromptTemplate) => {
      if (!promptTemplate?.prompt.trim()) {
        showToast("请先选择提示词", "error");
        return;
      }
      const result = await requestAiTask("rewrite", promptTemplate.prompt);
      if (!result) return;
      setRewriteDraft({
        original: inputText,
        rewritten: result,
        promptName: promptTemplate.name,
      });
      setHasAppliedRewrite(false);
      showToast("改写稿已生成，请确认后应用");
    },
    [inputText, requestAiTask, showToast],
  );

  const applyRewriteDraft = useCallback(() => {
    if (!rewriteDraft) return;
    setInputText(rewriteDraft.rewritten);
    setRewriteDraft(null);
    setHasAppliedRewrite(true);
    showToast("已应用改写稿");
  }, [rewriteDraft, setInputText, showToast]);

  const applyPublishOptimizationResult = useCallback(
    (result: string) => {
      try {
        const optimization = normalizePublishOptimization(extractJsonObject(result));
        setPublishOptimization(optimization);
        showToast("发布优化建议已生成");
        return optimization;
      } catch {
        showToast("AI 发布优化结果解析失败，请重试", "error");
        return null;
      }
    },
    [showToast],
  );

  const runPublishOptimize = useCallback(async () => {
    const result = await requestAiTask("publishOptimize");
    if (!result) return;
    applyPublishOptimizationResult(result);
  }, [applyPublishOptimizationResult, requestAiTask]);

  const requestCoverGeneration = useCallback(
    async (optimization: NonNullable<PublishOptimizationResult>) => {
      const trimmedBaseUrl = aiBaseUrl.trim();
      const trimmedApiKey = aiApiKey.trim();
      const imageModel = aiImageModel.trim() || aiModel.trim();

      if (!trimmedBaseUrl || !trimmedApiKey || !imageModel) {
        setShowAiConfigModal(true);
        showToast("请先配置 AI 服务地址、API Key 和生图模型", "error");
        return null;
      }

      setRunningTask("cover");
      try {
        const res = await fetch("/api/ai-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            markdown: inputText,
            providerType: aiProviderType,
            baseUrl: trimmedBaseUrl,
            apiKey: trimmedApiKey,
            model: imageModel,
            title: optimization.titles[0] || "",
            summary: optimization.summary,
            keywords: optimization.keywords,
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          result?: NonNullable<CoverGenerationResult>;
          error?: string;
        } | null;

        if (!res.ok || !data?.result) {
          showToast(
            data?.error || "当前模型不支持图片生成，请更换支持图片生成的模型或接口",
            "error",
          );
          return null;
        }

        setCoverGenerationResult(data.result);
        showToast("封面图已生成");
        return data.result;
      } catch {
        showToast("封面图生成失败，请检查模型接口后重试", "error");
        return null;
      } finally {
        setRunningTask(null);
      }
    },
    [
      aiBaseUrl,
      aiApiKey,
      aiImageModel,
      aiModel,
      setShowAiConfigModal,
      showToast,
      inputText,
      aiProviderType,
    ],
  );

  const runCoverGeneration = useCallback(async () => {
    if (!inputText.trim()) {
      showToast("请先填写初稿内容", "error");
      return;
    }

    if (runningTask) return;

    let optimization = publishOptimization;
    if (!optimization) {
      const result = await requestAiTask("publishOptimize");
      if (!result) return;
      optimization = applyPublishOptimizationResult(result);
      if (!optimization) return;
    }

    await requestCoverGeneration(optimization);
  }, [
    inputText,
    runningTask,
    publishOptimization,
    requestAiTask,
    applyPublishOptimizationResult,
    requestCoverGeneration,
    showToast,
  ]);

  return {
    runningTask,
    isAiFormatting: runningTask === "format",
    formatDraft,
    setFormatDraft,
    hasAppliedFormat,
    rewriteDraft,
    setRewriteDraft,
    hasAppliedRewrite,
    publishOptimization,
    setPublishOptimization,
    coverGenerationResult,
    setCoverGenerationResult,
    hasGeneratedCover: Boolean(coverGenerationResult),
    runFormat,
    applyFormatDraft,
    discardFormatDraft,
    runRewrite,
    applyRewriteDraft,
    runPublishOptimize,
    runCoverGeneration,
  };
}
