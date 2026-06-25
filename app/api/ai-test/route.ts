import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { openRouterConfig } from "../../_lib/formatter-constants";
import type { AiProviderType } from "../../_types/formatter";

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

const createErrorResponse = (err: unknown) => {
  const message = err instanceof Error ? err.message : "";

  if (/auth|api key|unauthorized|401/i.test(message)) {
    return Response.json({ error: "API Key 无效或没有权限，请检查后重试" }, { status: 401 });
  }

  if (/model|not found|404/i.test(message)) {
    return Response.json({ error: "模型不可用，请检查模型名称是否正确" }, { status: 400 });
  }

  if (/quota|credit|billing|insufficient|payment|429/i.test(message)) {
    return Response.json(
      { error: "模型服务额度不足或请求过于频繁，请检查服务商账户状态" },
      { status: 429 },
    );
  }

  if (/network|fetch|timeout|ECONN|ENOTFOUND|ETIMEDOUT/i.test(message)) {
    return Response.json({ error: "无法连接到模型服务，请检查 API 地址" }, { status: 502 });
  }

  return Response.json({ error: "模型测试失败，请检查配置后重试" }, { status: 500 });
};

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const body = await req.json();
    const { providerType, baseUrl, apiKey, model } = body as {
      providerType?: AiProviderType;
      baseUrl?: string;
      apiKey?: string;
      model?: string;
    };

    const trimmedApiKey = apiKey?.trim();
    if (!trimmedApiKey) {
      return Response.json({ error: "请先填写 API Key" }, { status: 400 });
    }

    const selectedProvider = isKnownProvider(providerType) ? providerType : "openrouter";
    const rawBaseUrl = baseUrl?.trim();
    const trimmedBaseUrl =
      rawBaseUrl || (selectedProvider === "openrouter" ? openRouterConfig.baseUrl : "");
    if (selectedProvider !== "openrouter" && !trimmedBaseUrl) {
      return Response.json({ error: "请先填写 API 地址" }, { status: 400 });
    }

    const trimmedModel = model?.trim();
    if (!trimmedModel) {
      return Response.json({ error: "请先填写 AI 模型名称" }, { status: 400 });
    }

    const languageModel =
      selectedProvider === "anthropic"
        ? createAnthropic({
            apiKey: trimmedApiKey,
            baseURL: trimmedBaseUrl,
          })(trimmedModel)
        : createOpenAI({
            apiKey: trimmedApiKey,
            baseURL: trimmedBaseUrl,
          }).chat(trimmedModel);

    await generateText({
      model: languageModel,
      system: "你是一个模型连通性测试助手。只回复 OK。",
      prompt: "请回复 OK",
      maxOutputTokens: 8,
      temperature: 0,
    });

    return Response.json({
      ok: true,
      message: `模型可用，测试耗时 ${((Date.now() - startedAt) / 1000).toFixed(1)} 秒`,
    });
  } catch (err: unknown) {
    console.error("AI model test error:", err instanceof Error ? err.message : err);
    return createErrorResponse(err);
  }
}
