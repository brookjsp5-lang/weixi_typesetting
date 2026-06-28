import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { extractJsonObjectFromAiText } from "../../_lib/ai-output-utils";
import { openRouterConfig } from "../../_lib/formatter-constants";
import {
  createPosterBriefPrompt,
  normalizePosterTextBrief,
} from "../../_lib/workflow-utils";
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      markdown,
      providerType,
      baseUrl,
      apiKey,
      model,
      posterPrompt = "",
    } = body as {
      markdown?: string;
      providerType?: AiProviderType;
      baseUrl?: string;
      apiKey?: string;
      model?: string;
      posterPrompt?: string;
    };

    if (!markdown || typeof markdown !== "string" || !markdown.trim()) {
      return Response.json({ error: "请提供需要生成贴图的 Markdown 内容" }, { status: 400 });
    }

    const trimmedApiKey = apiKey?.trim();
    if (!trimmedApiKey) {
      return Response.json({ error: "请先填写文本模型 API Key" }, { status: 400 });
    }

    const selectedProvider = isKnownProvider(providerType) ? providerType : "openrouter";
    const rawBaseUrl = baseUrl?.trim();
    const trimmedBaseUrl =
      rawBaseUrl || (selectedProvider === "openrouter" ? openRouterConfig.baseUrl : "");
    if (selectedProvider !== "openrouter" && !trimmedBaseUrl) {
      return Response.json({ error: "请先填写文本模型 API 地址" }, { status: 400 });
    }

    const trimmedModel = model?.trim();
    if (!trimmedModel) {
      return Response.json({ error: "请先填写文本模型名称" }, { status: 400 });
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

    const prompt = createPosterBriefPrompt({ markdown, posterPrompt });
    const result = await generateText({
      model: languageModel,
      prompt,
      temperature: 0.5,
    });

    let parsedBrief: unknown;
    try {
      parsedBrief = extractJsonObjectFromAiText(result.text);
    } catch {
      const repair = await generateText({
        model: languageModel,
        prompt: `${prompt}

上一次输出不是合法 JSON。请只返回一个 JSON 对象，不要解释，不要 Markdown 代码块，不要 <think>。`,
        temperature: 0.2,
      });
      parsedBrief = extractJsonObjectFromAiText(repair.text);
    }

    const brief = normalizePosterTextBrief(parsedBrief);
    return Response.json({ result: brief });
  } catch (err: unknown) {
    console.error("AI poster brief error:", err);
    const message = err instanceof Error ? err.message : "";
    if (/AI 贴图文案结果解析失败|JSON|parse/i.test(message)) {
      return Response.json({ error: "AI 贴图文案结果解析失败，请重试" }, { status: 502 });
    }
    if (/auth|api key|unauthorized|401/i.test(message)) {
      return Response.json({ error: "文本模型 API Key 无效或无权限" }, { status: 401 });
    }
    if (/quota|credit|billing|insufficient|payment|429/i.test(message)) {
      return Response.json({ error: "文本模型额度不足或请求过于频繁" }, { status: 429 });
    }
    return Response.json({ error: message || "贴图文案生成失败，请稍后重试" }, { status: 500 });
  }
}
