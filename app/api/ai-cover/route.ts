import { openRouterConfig } from "../../_lib/formatter-constants";
import { createCoverPrompt } from "../../_lib/workflow-utils";
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

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const createImageError = (message: string, status = 400) =>
  Response.json(
    {
      error: message || "当前模型不支持图片生成，请更换支持图片生成的模型或接口",
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
      title = "",
      summary = "",
      keywords = [],
      coverPrompt = "",
    } = body as {
      markdown?: string;
      providerType?: AiProviderType;
      baseUrl?: string;
      apiKey?: string;
      model?: string;
      title?: string;
      summary?: string;
      keywords?: string[];
      coverPrompt?: string;
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
      coverPrompt,
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
      const message = /not found|unsupported|model|image|404|400/i.test(rawMessage)
        ? "当前模型或接口不支持真实图片生成，请更换支持生图的模型或接口。"
        : rawMessage
          ? `真实图片生成失败：${rawMessage}`
          : "真实图片生成失败，请检查接口、模型和额度。";
      return createImageError(message, imageResponse.status || 502);
    }

    const image = data?.data?.[0];
    const imageUrl = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url || "";

    if (!imageUrl) {
      return createImageError("图片接口未返回可用图片，请更换生图模型后重试。", 502);
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
    return createImageError("封面图生成失败，请检查模型接口后重试。", 500);
  }
}
