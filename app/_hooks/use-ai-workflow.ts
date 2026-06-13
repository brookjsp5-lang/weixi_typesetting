import { useCallback, useState } from "react";
import { extractJsonObject } from "../_lib/workflow-utils";
import type {
  AiProviderType,
  AiTaskType,
  FormatDraft,
  ImageAssistResult,
  PromptTemplate,
  PublishOptimizationResult,
  RewriteDraft,
} from "../_types/formatter";
import type { ShowToast } from "./use-toast";

type UseAiWorkflowParams = {
  inputText: string;
  setInputText: (value: string) => void;
  aiProviderType: AiProviderType;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  setShowAiConfigModal: (value: boolean) => void;
  showToast: ShowToast;
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

export function useAiWorkflow({
  inputText,
  setInputText,
  aiProviderType,
  aiBaseUrl,
  aiApiKey,
  aiModel,
  setShowAiConfigModal,
  showToast,
}: UseAiWorkflowParams) {
  const [runningTask, setRunningTask] = useState<AiTaskType | null>(null);
  const [formatDraft, setFormatDraft] = useState<FormatDraft>(null);
  const [hasAppliedFormat, setHasAppliedFormat] = useState(false);
  const [rewriteDraft, setRewriteDraft] = useState<RewriteDraft>(null);
  const [hasAppliedRewrite, setHasAppliedRewrite] = useState(false);
  const [publishOptimization, setPublishOptimization] = useState<PublishOptimizationResult>(null);
  const [imageAssistResult, setImageAssistResult] = useState<ImageAssistResult>(null);
  const [isPreparingPublish, setIsPreparingPublish] = useState(false);
  const [publishPreparationMessage, setPublishPreparationMessage] = useState("");

  const requestAiTask = useCallback(
    async (taskType: AiTaskType, rewritePrompt = "") => {
      if (!inputText.trim() || runningTask) return null;

      const trimmedBaseUrl = aiBaseUrl.trim();
      const trimmedApiKey = aiApiKey.trim();
      const trimmedModel = aiModel.trim();
      if (!trimmedBaseUrl || !trimmedApiKey || !trimmedModel) {
        setShowAiConfigModal(true);
        showToast("请先配置 AI 服务地址、API Key 和模型", "error");
        return null;
      }

      setRunningTask(taskType);
      try {
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
        if (!result) {
          showToast("AI 返回内容为空，请重试", "error");
          return null;
        }
        return result;
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
        const parsed = extractJsonObject(result) as NonNullable<PublishOptimizationResult>;
        setPublishOptimization({
          titles: Array.isArray(parsed.titles) ? parsed.titles.slice(0, 5) : [],
          summary: typeof parsed.summary === "string" ? parsed.summary : "",
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
          recommendedCategory:
            typeof parsed.recommendedCategory === "string" ? parsed.recommendedCategory : undefined,
          recommendedTemplateId:
            typeof parsed.recommendedTemplateId === "string"
              ? parsed.recommendedTemplateId
              : undefined,
          recommendedThemeColor:
            typeof parsed.recommendedThemeColor === "string"
              ? parsed.recommendedThemeColor
              : undefined,
          suggestions: normalizeStringArray(parsed.suggestions, 6),
        });
        showToast("发布优化建议已生成");
        return true;
      } catch {
        showToast("AI 发布优化结果解析失败，请重试", "error");
        return false;
      }
    },
    [showToast],
  );

  const runPublishOptimize = useCallback(async () => {
    const result = await requestAiTask("publishOptimize");
    if (!result) return;
    applyPublishOptimizationResult(result);
  }, [applyPublishOptimizationResult, requestAiTask]);

  const applyImageAssistResult = useCallback(
    (result: string) => {
      try {
        const parsed = extractJsonObject(result) as NonNullable<ImageAssistResult>;
        setImageAssistResult({
          coverPrompt: typeof parsed.coverPrompt === "string" ? parsed.coverPrompt : "",
          articleImagePrompts: normalizeStringArray(parsed.articleImagePrompts, 4),
          imageDescriptions: normalizeStringArray(parsed.imageDescriptions, 4),
          insertSuggestions: normalizeStringArray(parsed.insertSuggestions, 4),
        });
        showToast("配图建议已生成");
        return true;
      } catch {
        showToast("AI 配图建议解析失败，请重试", "error");
        return false;
      }
    },
    [showToast],
  );

  const runImageAssist = useCallback(async () => {
    const result = await requestAiTask("imageAssist");
    if (!result) return;
    applyImageAssistResult(result);
  }, [applyImageAssistResult, requestAiTask]);

  const runPublishPreparation = useCallback(async () => {
    if (!inputText.trim()) {
      showToast("请先填写初稿内容", "error");
      return;
    }

    if (isPreparingPublish || runningTask) return;

    setIsPreparingPublish(true);
    setPublishPreparationMessage("正在准备发布材料...");

    try {
      let hasGenerated = false;

      if (!formatDraft && !hasAppliedFormat) {
        setPublishPreparationMessage("正在生成排版稿...");
        const formatResult = await requestAiTask("format");
        if (!formatResult) {
          setPublishPreparationMessage("发布准备未完成，请检查 AI 配置后重试。");
          return;
        }
        setFormatDraft({
          original: inputText,
          formatted: formatResult,
        });
        setHasAppliedFormat(false);
        hasGenerated = true;
      }

      if (!imageAssistResult) {
        setPublishPreparationMessage("正在生成配图建议...");
        const imageResult = await requestAiTask("imageAssist");
        if (!imageResult) {
          setPublishPreparationMessage("发布准备未完成，请检查 AI 配置后重试。");
          return;
        }
        if (!applyImageAssistResult(imageResult)) {
          setPublishPreparationMessage("配图建议解析失败，请单独重试。");
          return;
        }
        hasGenerated = true;
      }

      if (!publishOptimization) {
        setPublishPreparationMessage("正在生成发布物料...");
        const publishResult = await requestAiTask("publishOptimize");
        if (!publishResult) {
          setPublishPreparationMessage("发布准备未完成，请检查 AI 配置后重试。");
          return;
        }
        if (!applyPublishOptimizationResult(publishResult)) {
          setPublishPreparationMessage("发布物料解析失败，请单独重试。");
          return;
        }
        hasGenerated = true;
      }

      setPublishPreparationMessage(
        hasGenerated
          ? "发布准备已生成，请逐项确认后复制发布。"
          : "已有发布准备内容，无需重复生成。",
      );
      showToast(hasGenerated ? "发布准备已生成" : "发布准备内容已存在");
    } finally {
      setIsPreparingPublish(false);
    }
  }, [
    inputText,
    isPreparingPublish,
    runningTask,
    formatDraft,
    hasAppliedFormat,
    imageAssistResult,
    publishOptimization,
    requestAiTask,
    applyImageAssistResult,
    applyPublishOptimizationResult,
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
    imageAssistResult,
    setImageAssistResult,
    hasGeneratedImageAssist: Boolean(imageAssistResult),
    isPreparingPublish,
    publishPreparationMessage,
    runFormat,
    applyFormatDraft,
    discardFormatDraft,
    runRewrite,
    applyRewriteDraft,
    runPublishOptimize,
    runImageAssist,
    runPublishPreparation,
  };
}
