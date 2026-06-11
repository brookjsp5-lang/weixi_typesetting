import { useCallback, useState } from "react";
import { extractJsonObject } from "../_lib/workflow-utils";
import type {
  AiProviderType,
  AiTaskType,
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
  const [rewriteDraft, setRewriteDraft] = useState<RewriteDraft>(null);
  const [publishOptimization, setPublishOptimization] =
    useState<PublishOptimizationResult>(null);

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
    const originalText = inputText;
    const result = await requestAiTask("format");
    if (!result) return;
    setInputText(result || originalText);
    showToast("AI 一键排版完成");
  }, [inputText, requestAiTask, setInputText, showToast]);

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
      showToast("改写稿已生成，请确认后应用");
    },
    [inputText, requestAiTask, showToast],
  );

  const applyRewriteDraft = useCallback(() => {
    if (!rewriteDraft) return;
    setInputText(rewriteDraft.rewritten);
    setRewriteDraft(null);
    showToast("已应用改写稿");
  }, [rewriteDraft, setInputText, showToast]);

  const runPublishOptimize = useCallback(async () => {
    const result = await requestAiTask("publishOptimize");
    if (!result) return;

    try {
      const parsed = extractJsonObject(result) as NonNullable<PublishOptimizationResult>;
      setPublishOptimization({
        titles: Array.isArray(parsed.titles) ? parsed.titles.slice(0, 5) : [],
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
        recommendedCategory:
          typeof parsed.recommendedCategory === "string" ? parsed.recommendedCategory : undefined,
        recommendedTemplateId:
          typeof parsed.recommendedTemplateId === "string" ? parsed.recommendedTemplateId : undefined,
        recommendedThemeColor:
          typeof parsed.recommendedThemeColor === "string"
            ? parsed.recommendedThemeColor
            : undefined,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 6) : [],
      });
      showToast("发布优化建议已生成");
    } catch {
      showToast("AI 发布优化结果解析失败，请重试", "error");
    }
  }, [requestAiTask, showToast]);

  return {
    runningTask,
    isAiFormatting: runningTask === "format",
    rewriteDraft,
    setRewriteDraft,
    publishOptimization,
    setPublishOptimization,
    runFormat,
    runRewrite,
    applyRewriteDraft,
    runPublishOptimize,
  };
}
