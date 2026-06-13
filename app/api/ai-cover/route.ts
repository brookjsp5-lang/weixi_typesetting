import { openRouterConfig } from "../../_lib/formatter-constants";
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

    const trimmedApiKey = apiKey?.trim();
    if (!trimmedApiKey) {
      return Response.json({ error: "请先填写 API Key" }, { status: 400 });
    }

    const selectedProvider = isKnownProvider(providerType) ? providerType : "openrouter";
    if (selectedProvider === "anthropic") {
      return createImageError("Anthropic 当前配置不支持图片生成，请更换支持生图的接口或模型。");
    }

    const rawBaseUrl = baseUrl?.trim();
    const trimmedBaseUrl =
      rawBaseUrl || (selectedProvider === "openrouter" ? openRouterConfig.baseUrl : "");
    if (!trimmedBaseUrl) {
      return Response.json({ error: "请先填写 API 地址" }, { status: 400 });
    }

    const trimmedModel = model?.trim();
    if (!trimmedModel) {
      return Response.json({ error: "请先填写生图模型名称" }, { status: 400 });
    }

    const prompt = createCoverPrompt({
      markdown,
      title: title.trim(),
      summary: summary.trim(),
      keywords: Array.isArray(keywords) ? keywords.filter((item) => typeof item === "string") : [],
    });
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
      return createImageError(
        /not found|unsupported|model|image|404|400/i.test(rawMessage)
          ? "当前模型不支持图片生成，请更换支持图片生成的模型或接口。"
          : rawMessage || "封面图生成失败，请检查接口、模型和额度。",
        imageResponse.status,
      );
    }

    const image = data?.data?.[0];
    const imageUrl = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url || "";

    if (!imageUrl) {
      return createImageError("图片接口未返回可用图片，请更换模型或稍后重试。", 502);
    }

    return Response.json({
      result: {
        imageUrl,
        prompt,
        titleHint: title.trim(),
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error("AI cover error:", err instanceof Error ? err.message : err);
    return createImageError("封面图生成失败，请检查模型接口后重试。", 500);
  }
}
