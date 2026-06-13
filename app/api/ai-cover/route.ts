import { openRouterConfig } from "../../_lib/formatter-constants";
import { createFallbackCoverImage } from "../../_lib/workflow-utils";
import type { AiProviderType } from "../../_types/formatter";

const MAX_INPUT_LENGTH = 15000;

const isKnownProvider = (providerType: unknown): providerType is AiProviderType =>
  providerType === "openrouter" ||
  providerType === "deepseek" ||
  providerType === "volcengine" ||
  providerType === "dashscope" ||
  providerType === "moonshot" ||
  providerType === "zhipu" ||
  providerType === "openai" ||
  providerType === "anthropic" ||
  providerType === "custom";

const createCoverPrompt = ({
  markdown,
  title,
  summary,
  keywords,
}: {
  markdown: string;
  title: string;
  summary: string;
  keywords: string[];
}) => {
  const excerpt = markdown.replace(/\s+/g, " ").slice(0, 1000);
  return `为微信公众号文章生成一张专业封面图。画面需要适合中文公众号首图，横版构图，留出安全的标题空间，视觉清晰、有编辑感，不要包含二维码、品牌水印或真实人物肖像。

文章标题方向：${title || "根据正文提炼一个克制清晰的主题"}
文章摘要：${summary || "根据正文主题生成封面氛围"}
关键词：${keywords.join("、") || "公众号、内容创作、排版"}
正文参考：${excerpt}`;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const createImageError = (message: string, status = 400) =>
  Response.json(
    {
      error: message || "当前模型不支持图片生成，请更换支持图片生成的模型或接口",
    },
    { status },
  );

const createFallbackCoverResult = ({
  prompt,
  title,
  summary,
  keywords,
  warning,
}: {
  prompt: string;
  title: string;
  summary: string;
  keywords: string[];
  warning: string;
}) =>
  Response.json({
    result: {
      imageUrl: createFallbackCoverImage({ title, summary, keywords }),
      prompt,
      titleHint: title,
      createdAt: new Date().toISOString(),
      source: "fallback",
      warning,
    },
  });

export async function POST(req: Request) {
  let fallbackPrompt = "";
  let fallbackTitle = "";
  let fallbackSummary = "";
  let fallbackKeywords: string[] = [];

  try {
    const body = await req.json();
    const {
      markdown,
      providerType,
      baseUrl,
      apiKey,
      model,
      title = "",
      summary = "",
      keywords = [],
    } = body as {
      markdown?: string;
      providerType?: AiProviderType;
      baseUrl?: string;
      apiKey?: string;
      model?: string;
      title?: string;
      summary?: string;
      keywords?: string[];
    };

    if (!markdown || typeof markdown !== "string" || !markdown.trim()) {
      return Response.json({ error: "请提供需要生成封面的 Markdown 内容" }, { status: 400 });
    }

    if (markdown.length > MAX_INPUT_LENGTH) {
      return Response.json(
        { error: `内容过长（${markdown.length} 字符），请控制在 ${MAX_INPUT_LENGTH} 字符以内` },
        { status: 400 },
      );
    }

    const selectedProvider = isKnownProvider(providerType) ? providerType : "openrouter";
    const rawBaseUrl = baseUrl?.trim();
    const trimmedBaseUrl =
      rawBaseUrl || (selectedProvider === "openrouter" ? openRouterConfig.baseUrl : "");
    const trimmedModel = model?.trim();
    const prompt = createCoverPrompt({
      markdown,
      title: title.trim(),
      summary: summary.trim(),
      keywords: Array.isArray(keywords) ? keywords.filter((item) => typeof item === "string") : [],
    });
    fallbackPrompt = prompt;
    fallbackTitle = title.trim();
    fallbackSummary = summary.trim();
    fallbackKeywords = Array.isArray(keywords)
      ? keywords.filter((item) => typeof item === "string")
      : [];

    if (!trimmedModel) {
      return createFallbackCoverResult({
        prompt,
        title: fallbackTitle,
        summary: fallbackSummary,
        keywords: fallbackKeywords,
        warning:
          "未配置生图模型，已生成备用封面草图。需要真实生图时，请在 AI 配置中填写封面生图模型。",
      });
    }

    const trimmedApiKey = apiKey?.trim();
    if (!trimmedApiKey) {
      return createFallbackCoverResult({
        prompt,
        title: fallbackTitle,
        summary: fallbackSummary,
        keywords: fallbackKeywords,
        warning: "未配置生图 API Key，已生成备用封面草图。",
      });
    }

    if (!trimmedBaseUrl) {
      return createFallbackCoverResult({
        prompt,
        title: fallbackTitle,
        summary: fallbackSummary,
        keywords: fallbackKeywords,
        warning: "未配置生图 API 地址，已生成备用封面草图。",
      });
    }

    if (selectedProvider === "anthropic") {
      return createFallbackCoverResult({
        prompt,
        title: fallbackTitle,
        summary: fallbackSummary,
        keywords: fallbackKeywords,
        warning: "Anthropic 当前配置不支持真实图片生成，已生成备用封面草图。",
      });
    }

    const endpoint = `${normalizeBaseUrl(trimmedBaseUrl)}/images/generations`;
    const requestBody = {
      model: trimmedModel,
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    };

    let imageResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trimmedApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!imageResponse.ok && imageResponse.status === 400) {
      imageResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trimmedApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: trimmedModel,
          prompt,
          n: 1,
          size: "1024x1024",
        }),
      });
    }

    const data = (await imageResponse.json().catch(() => null)) as {
      data?: Array<{ b64_json?: string; url?: string }>;
      error?: { message?: string } | string;
    } | null;

    if (!imageResponse.ok) {
      const rawMessage = typeof data?.error === "string" ? data.error : data?.error?.message || "";
      const warning = /not found|unsupported|model|image|404|400/i.test(rawMessage)
        ? "当前模型或接口不支持真实图片生成，已先生成备用封面草图。"
        : rawMessage
          ? `真实图片生成失败：${rawMessage}。已先生成备用封面草图。`
          : "真实图片生成失败，请检查接口、模型和额度。已先生成备用封面草图。";
      return createFallbackCoverResult({
        prompt,
        title: title.trim(),
        summary: summary.trim(),
        keywords: Array.isArray(keywords)
          ? keywords.filter((item) => typeof item === "string")
          : [],
        warning,
      });
    }

    const image = data?.data?.[0];
    const imageUrl = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url || "";

    if (!imageUrl) {
      return createFallbackCoverResult({
        prompt,
        title: title.trim(),
        summary: summary.trim(),
        keywords: Array.isArray(keywords)
          ? keywords.filter((item) => typeof item === "string")
          : [],
        warning: "图片接口未返回可用图片，已先生成备用封面草图。",
      });
    }

    return Response.json({
      result: {
        imageUrl,
        prompt,
        titleHint: title.trim(),
        createdAt: new Date().toISOString(),
        source: "ai",
      },
    });
  } catch (err: unknown) {
    console.error("AI cover error:", err instanceof Error ? err.message : err);
    if (fallbackPrompt) {
      return createFallbackCoverResult({
        prompt: fallbackPrompt,
        title: fallbackTitle,
        summary: fallbackSummary,
        keywords: fallbackKeywords,
        warning: "真实图片生成接口请求失败，已先生成备用封面草图。",
      });
    }
    return createImageError("封面图生成失败，请检查模型接口后重试。", 500);
  }
}
