import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { sanitizeAiTextOutput } from "../../_lib/ai-output-utils";
import { openRouterConfig } from "../../_lib/formatter-constants";
import type { AiProviderType, AiTaskType } from "../../_types/formatter";

const MAX_INPUT_LENGTH = 15000;

const FORMAT_PROMPT = `你是一个微信公众号 Markdown 排版专家。你的任务是优化用户提供的 Markdown 文本的排版结构，使其更适合微信公众号阅读体验。

规则：
1. 绝不改写原文内容，不修改语义，不增减事实，不润色措辞。
2. 绝不删除任何内容，所有段落、图片、链接、代码块、表格都必须完整保留。
3. 只调整 Markdown 排版结构：标题层级、空行、列表、引用、重点加粗、分隔线。
4. 保持图片、链接、代码块、表格语法原样可用。
5. 只输出最终 Markdown，不要解释，不要用代码块包裹整体输出。
6. 不要输出思考过程、推理过程、<think> 标签或任何前置说明。`;

const createRewritePrompt = (
  rewritePrompt: string,
) => `你是公众号编辑。请根据用户提供的改写提示词处理 Markdown 文章。

改写提示词：
${rewritePrompt}

硬性规则：
1. 保留用户明确要求保留的事实、观点、链接、图片、代码块和表格。
2. 不编造事实，不补充未经原文支持的数据、案例或结论。
3. 输出完整 Markdown 正文，不要解释，不要用代码块包裹整体输出。
4. 不要输出思考过程、推理过程、<think> 标签或任何前置说明。`;

const POSTER_TEXT_PROMPT = (
  requirement: string,
) => `你是公众号贴图文案编辑。请根据用户提供的处理要求处理当前 Markdown 初稿，输出一版可直接放入公众号贴图的文字内容。

用户处理要求：
${requirement}

硬性规则：
1. 只输出最终可放入贴图的纯文本，不要输出解释、标题前缀、改写说明、处理过程或建议。
2. 不要使用 Markdown 代码块，不要输出 JSON，不要用表格。
3. 可以输出多行、编号列表、短段落或要点，具体格式服从用户处理要求。
4. 不编造原文没有的信息，不补充未经原文支持的数据、案例或结论。
5. 不强制截短；如果用户要求较多内容，可以完整输出，前端会提示长文本可能影响贴图可读性。
6. 不要输出思考过程、推理过程、<think> 标签或任何前置说明。`;

const REVERSE_PROMPT_PROMPT = (
  requirement: string,
) => `你是公众号工作流提示词工程师。请根据用户提供的逆向要求和文章内容，逆向生成一条可复用提示词。

逆向提示词要求：
${requirement}

目标类型说明：
- 正文改写提示词：输出用于处理公众号正文的提示词，重点描述处理目标、保留边界、输出格式和禁止事项。
- AI 生图提示词：输出用于公众号封面生图的视觉风格提示词，重点描述画面主体、构图、色彩、氛围、留白和禁用元素。
- 公众号贴图提示词：输出用于公众号贴图的视觉风格提示词，重点描述竖版画面、背景、信息承载空间、氛围和禁用元素。

硬性规则：
1. 只输出提示词正文，不要输出解释、标题、前后缀、处理过程或建议。
2. 不要使用 Markdown 代码块，不要输出 JSON，不要用表格。
3. 不要复述原文章全文，只抽象出可复用的写法、结构、风格、约束和输出要求。
4. 提示词必须能直接保存到对应提示词库中复用。
5. 不要输出思考过程、推理过程、<think> 标签或任何前置说明。`;

const PUBLISH_OPTIMIZE_PROMPT = `你是微信公众号发布编辑。请分析用户提供的 Markdown 文章，生成发布前优化素材。

只输出一个 JSON 对象，不要解释，不要使用 Markdown 代码块，不要输出思考过程或 <think> 标签。JSON 结构必须是：
{
  "titles": ["标题候选1", "标题候选2", "标题候选3"],
  "summary": "80字以内公众号摘要",
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "suggestions": ["发布建议1", "发布建议2", "发布建议3"]
}

要求：
1. 不改写正文，不输出正文。
2. 标题候选要准确、克制、适合公众号。
3. 摘要和关键词不得编造原文没有的信息。
4. 发布建议只给发布前需要确认的事项，不推荐模板。`;

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

const isTaskType = (taskType: unknown): taskType is AiTaskType =>
  taskType === "format" ||
  taskType === "rewrite" ||
  taskType === "publishOptimize" ||
  taskType === "posterText" ||
  taskType === "reversePrompt";

const getSystemPrompt = (taskType: AiTaskType, rewritePrompt: string) => {
  if (taskType === "rewrite") return createRewritePrompt(rewritePrompt);
  if (taskType === "posterText") return POSTER_TEXT_PROMPT(rewritePrompt);
  if (taskType === "reversePrompt") return REVERSE_PROMPT_PROMPT(rewritePrompt);
  if (taskType === "publishOptimize") return PUBLISH_OPTIMIZE_PROMPT;
  return FORMAT_PROMPT;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { markdown, providerType, baseUrl, apiKey, model, taskType, rewritePrompt } = body as {
      markdown?: string;
      providerType?: AiProviderType;
      baseUrl?: string;
      apiKey?: string;
      model?: string;
      taskType?: AiTaskType;
      rewritePrompt?: string;
    };

    if (!markdown || typeof markdown !== "string" || !markdown.trim()) {
      return Response.json({ error: "请提供需要处理的 Markdown 内容" }, { status: 400 });
    }

    if (markdown.length > MAX_INPUT_LENGTH) {
      return Response.json(
        { error: `内容过长（${markdown.length} 字符），请控制在 ${MAX_INPUT_LENGTH} 字符以内` },
        { status: 400 },
      );
    }

    const selectedTask = isTaskType(taskType) ? taskType : "format";
    const trimmedRewritePrompt = rewritePrompt?.trim() || "";
    if (selectedTask === "rewrite" && !trimmedRewritePrompt) {
      return Response.json({ error: "请先选择或填写改写提示词" }, { status: 400 });
    }
    if (selectedTask === "posterText" && !trimmedRewritePrompt) {
      return Response.json({ error: "请先填写处理要求" }, { status: 400 });
    }
    if (selectedTask === "reversePrompt" && !trimmedRewritePrompt) {
      return Response.json({ error: "请先填写逆向提示词要求" }, { status: 400 });
    }

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

    const result = await generateText({
      model: languageModel,
      system: getSystemPrompt(selectedTask, trimmedRewritePrompt),
      prompt: markdown,
      temperature: selectedTask === "format" ? 0.3 : 0.5,
    });

    return new Response(sanitizeAiTextOutput(result.text), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: unknown) {
    console.error("AI task error:", err);

    const message = err instanceof Error ? err.message : "";
    if (/auth|api key|unauthorized|401/i.test(message)) {
      return Response.json({ error: "API Key 无效或无权限，请检查后重试" }, { status: 401 });
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

    return Response.json({ error: message || "AI 服务异常，请稍后重试" }, { status: 500 });
  }
}
