import {
  createImageGenerationErrorMessage,
  remoteImageToDataUrl,
  requestImageGeneration,
} from "../../_lib/cover-image-api";
import { openRouterConfig } from "../../_lib/formatter-constants";
import { createPosterPrompt, normalizePosterTextBrief } from "../../_lib/workflow-utils";
import type { AiProviderType, PosterTextBrief } from "../../_types/formatter";

const isKnownProvider = (providerType: unknown): providerType is AiProviderType =>
  providerType === "openrouter" ||
  providerType === "deepseek" ||
  providerType === "volcengine" ||
  providerType === "dashscope" ||
  providerType === "qwen" ||
  providerType === "minimax" ||
  providerType === "mimo" ||
  providerType === "moonshot" ||
  providerType === "zhipu" ||
  providerType === "openai" ||
  providerType === "anthropic" ||
  providerType === "custom";

const createImageError = (message: string, status = 400) =>
  Response.json(
    {
      error: message || "贴图背景生成失败，请检查接口、模型和额度。",
    },
    { status },
  );

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      markdown,
      providerType,
      baseUrl,
      apiKey,
      model,
      brief,
      posterPrompt = "",
    } = body as {
      markdown?: string;
      providerType?: AiProviderType;
      baseUrl?: string;
      apiKey?: string;
      model?: string;
      brief?: PosterTextBrief;
      posterPrompt?: string;
    };

    if (!markdown || typeof markdown !== "string" || !markdown.trim()) {
      return Response.json({ error: "请提供需要生成贴图的 Markdown 内容" }, { status: 400 });
    }

    const selectedProvider = isKnownProvider(providerType) ? providerType : "openrouter";
    const rawBaseUrl = baseUrl?.trim();
    const trimmedBaseUrl =
      rawBaseUrl || (selectedProvider === "openrouter" ? openRouterConfig.baseUrl : "");
    const trimmedModel = model?.trim();
    const posterBrief = normalizePosterTextBrief(brief);
    const prompt = createPosterPrompt({
      markdown,
      brief: posterBrief,
      posterPrompt,
    });

    if (!trimmedModel) {
      return createImageError("未配置生图模型，请在 AI 配置中填写支持生图的模型。");
    }

    const trimmedApiKey = apiKey?.trim();
    if (!trimmedApiKey) {
      return createImageError("未配置生图 API Key，请填写后重试。");
    }

    if (!trimmedBaseUrl) {
      return createImageError("未配置生图 API 地址，请填写后重试。");
    }

    if (selectedProvider === "anthropic") {
      return createImageError("Anthropic 当前配置不支持真实图片生成，请更换生图接口。");
    }

    const result = await requestImageGeneration({
      baseUrl: trimmedBaseUrl,
      apiKey: trimmedApiKey,
      model: trimmedModel,
      prompt,
      providerType: selectedProvider,
    });

    if (!result.response?.ok) {
      return createImageError(
        createImageGenerationErrorMessage(
          result.data,
          result.response?.status || 502,
          "贴图背景生成失败，请检查接口、模型和额度。",
        ),
        result.response?.status || 502,
      );
    }

    const imageUrl = result.imageUrl;
    if (!imageUrl) {
      return createImageError(
        createImageGenerationErrorMessage(
          result.data,
          result.response?.status || 502,
          "图片接口未返回可用贴图背景，请更换生图模型后重试。",
        ),
        502,
      );
    }

    let backgroundImageUrl = imageUrl;
    try {
      backgroundImageUrl = await remoteImageToDataUrl(imageUrl);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      return createImageError(
        detail
          ? `生图链接不可访问：${detail}`
          : "生图链接不可访问，请重新生成或更换生图模型接口。",
        502,
      );
    }

    return Response.json({
      result: {
        backgroundImageUrl,
        rawBackgroundImageUrl: imageUrl,
        prompt,
        brief: posterBrief,
        createdAt: new Date().toISOString(),
        source: "ai",
      },
    });
  } catch (err: unknown) {
    console.error("AI poster error:", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "";
    if (/AI 贴图文案结果解析失败/i.test(message)) {
      return createImageError("贴图文案不完整，请重新生成贴图文案后再试。", 400);
    }
    return createImageError("贴图背景生成失败，请检查模型接口后重试。", 500);
  }
}
