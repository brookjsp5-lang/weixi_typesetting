import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  createMediaSourceExcerpt,
  extractJsonObjectFromAiText,
  normalizeVideoScript,
} from "../../_lib/ai-output-utils";
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

const createPrompt = (markdown: string) => `请根据公众号文章初稿生成一份短视频分镜脚本。

只输出一个 JSON 对象，不要解释，不要 Markdown 代码块，不要 <think>。JSON 结构必须是：
{
  "title": "视频标题",
  "scenes": [
    {
      "shot": "镜头名称",
      "visual": "画面建议",
      "narration": "旁白",
      "subtitle": "字幕要点"
    }
  ],
  "summary": "整体说明"
}

要求：
1. 只基于原文信息，不编造事实。
2. 适合 60-120 秒知识类短视频。
3. scenes 控制在 4-8 个镜头。

文章参考：
${createMediaSourceExcerpt(markdown, 6000)}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { markdown, providerType, baseUrl, apiKey, model } = body as {
      markdown?: string;
      providerType?: AiProviderType;
      baseUrl?: string;
      apiKey?: string;
      model?: string;
    };

    if (!markdown || typeof markdown !== "string" || !markdown.trim()) {
      return Response.json({ error: "请先提供需要生成视频分镜的初稿" }, { status: 400 });
    }

    const trimmedApiKey = apiKey?.trim();
    if (!trimmedApiKey) return Response.json({ error: "请先填写文本模型 API Key" }, { status: 400 });

    const selectedProvider = isKnownProvider(providerType) ? providerType : "openrouter";
    const trimmedBaseUrl =
      baseUrl?.trim() || (selectedProvider === "openrouter" ? openRouterConfig.baseUrl : "");
    if (selectedProvider !== "openrouter" && !trimmedBaseUrl) {
      return Response.json({ error: "请先填写文本模型 API 地址" }, { status: 400 });
    }

    const trimmedModel = model?.trim();
    if (!trimmedModel) {
      return Response.json({ error: "请先填写文本模型名称" }, { status: 400 });
    }

    const languageModel =
      selectedProvider === "anthropic"
        ? createAnthropic({ apiKey: trimmedApiKey, baseURL: trimmedBaseUrl })(trimmedModel)
        : createOpenAI({ apiKey: trimmedApiKey, baseURL: trimmedBaseUrl }).chat(trimmedModel);

    const prompt = createPrompt(markdown);
    const result = await generateText({ model: languageModel, prompt, temperature: 0.5 });

    let parsed: unknown;
    try {
      parsed = extractJsonObjectFromAiText(result.text);
    } catch {
      const repair = await generateText({
        model: languageModel,
        prompt: `${prompt}

上一次输出不是合法 JSON。请只返回 JSON 对象，不要解释，不要 Markdown 代码块，不要 <think>。`,
        temperature: 0.2,
      });
      parsed = extractJsonObjectFromAiText(repair.text);
    }

    return Response.json({
      result: {
        ...normalizeVideoScript(parsed),
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error("AI video script error:", err);
    const message = err instanceof Error ? err.message : "";
    if (/auth|api key|unauthorized|401/i.test(message)) {
      return Response.json({ error: "文本模型 API Key 无效或没有权限" }, { status: 401 });
    }
    if (/quota|credit|billing|insufficient|payment|429/i.test(message)) {
      return Response.json({ error: "文本模型额度不足或请求过于频繁" }, { status: 429 });
    }
    if (/JSON|解析|parse/i.test(message)) {
      return Response.json({ error: "AI 视频分镜结果解析失败，请重试" }, { status: 502 });
    }
    return Response.json({ error: message || "AI 视频分镜生成失败，请稍后重试" }, { status: 500 });
  }
}
