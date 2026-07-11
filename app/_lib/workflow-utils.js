import { createMediaSourceExcerpt, extractJsonObjectFromAiText } from "./ai-output-utils.js";

export const providerPresets = [
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "",
    apiKeyUrl: "https://openrouter.ai/keys",
    modelHelp: "选择下方模型，或手动输入 OpenRouter 模型 ID",
    imageBaseUrl: "https://openrouter.ai/api/v1/images",
    defaultImageModel: "bytedance-seed/seedream-4.5",
    imageModelHelp: "bytedance-seed/seedream-4.5 或其他 OpenRouter 生图模型",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    modelHelp: "deepseek-chat 或 deepseek-reasoner",
  },
  {
    id: "volcengine",
    name: "火山方舟",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModel: "",
    apiKeyUrl: "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
    modelHelp: "填写火山方舟 Endpoint ID 或模型 ID",
    imageBaseUrl: "https://ark.cn-beijing.volces.com/api/v3/images/generations",
    defaultImageModel: "doubao-seedream-5-0-lite-260128",
    imageModelHelp: "doubao-seedream-5-0-lite-260128 或你的火山方舟生图模型 ID",
  },
  {
    id: "dashscope",
    name: "阿里百炼/千问",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
    apiKeyUrl: "https://bailian.console.aliyun.com/?tab=model#/api-key",
    modelHelp: "qwen-plus、qwen-max 或其他兼容模型",
    imageBaseUrl:
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
    defaultImageModel: "qwen-image-2.0-pro",
    imageModelHelp: "qwen-image-2.0-pro 或其他阿里百炼生图模型",
  },
  {
    id: "qwen",
    name: "Qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
    apiKeyUrl: "https://bailian.console.aliyun.com/?tab=model#/api-key",
    modelHelp: "qwen-plus、qwen-max 或其他 Qwen 兼容模型",
    imageBaseUrl:
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
    defaultImageModel: "qwen-image-2.0-pro",
    imageModelHelp: "qwen-image-2.0-pro 或其他 Qwen 生图模型",
  },
  {
    id: "minimax",
    name: "MiniMax",
    baseUrl: "https://api.minimaxi.com/v1",
    defaultModel: "MiniMax-M3",
    apiKeyUrl: "https://platform.minimaxi.com/console/access",
    modelHelp: "MiniMax-M3、MiniMax-M2.7 或其他 MiniMax OpenAI 兼容模型",
    imageBaseUrl: "https://api.minimaxi.com/v1/image_generation",
    defaultImageModel: "image-01",
    imageModelHelp: "image-01、image-01-live；image-01-live 适合手绘、卡通等风格增强",
  },
  {
    id: "mimo",
    name: "小米 MiMo",
    baseUrl: "https://api.xiaomimimo.com/v1",
    defaultModel: "mimo-v2.5-pro",
    apiKeyUrl: "https://platform.xiaomimimo.com/console/api-keys",
    modelHelp: "mimo-v2.5-pro 或其他 MiMo OpenAI 兼容模型",
  },
  {
    id: "moonshot",
    name: "Kimi",
    baseUrl: "https://api.moonshot.ai/v1",
    defaultModel: "moonshot-v1-8k",
    apiKeyUrl: "https://platform.kimi.ai/console/api-keys",
    modelHelp: "moonshot-v1-8k、moonshot-v1-32k 或 moonshot-v1-128k",
  },
  {
    id: "zhipu",
    name: "智谱 GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4-flash",
    apiKeyUrl: "https://bigmodel.cn/usercenter/proj-mgmt/apikeys",
    modelHelp: "glm-4-flash、glm-4-plus 或其他 GLM 模型",
    imageBaseUrl: "https://open.bigmodel.cn/api/paas/v4/images/generations",
    defaultImageModel: "glm-image",
    imageModelHelp: "glm-image 或其他智谱官方生图模型",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    modelHelp: "gpt-4o 或自定义模型名称",
    imageBaseUrl: "https://api.openai.com/v1/images/generations",
    defaultImageModel: "gpt-image-2",
    imageModelHelp: "gpt-image-2 或其他 OpenAI 生图模型",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-5",
    apiKeyUrl: "https://platform.claude.com/settings/keys",
    modelHelp: "claude-sonnet-4-5 或其他 Claude 模型",
  },
  {
    id: "custom",
    name: "自定义兼容服务",
    baseUrl: "",
    defaultModel: "",
    apiKeyUrl: "",
    modelHelp: "填写 OpenAI 兼容模型名称",
  },
];

export function getProviderPreset(providerId) {
  return providerPresets.find((preset) => preset.id === providerId) || providerPresets[0];
}

export function createDefaultPromptTemplates() {
  const now = new Date().toISOString();
  return [
    {
      id: "polish-wechat",
      name: "公众号温和润色",
      prompt:
        "请在保留原文事实、观点和段落大意的前提下，优化表达流畅度，删减口语化冗余，让文章更适合微信公众号阅读。",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "story-opening",
      name: "增强开头吸引力",
      prompt:
        "请保留原文事实和核心观点，重点优化开头 3 段，让开头更有场景感、悬念感和继续阅读的动力。",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "concise-summary",
      name: "压缩精简版",
      prompt:
        "请保留原文核心信息和关键事实，把文章压缩得更简洁，删除重复表达，让每段只保留一个明确重点。",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createDefaultCoverPromptTemplates() {
  const now = new Date().toISOString();
  return [
    {
      id: "cover-general",
      name: "公众号封面通用",
      prompt:
        "适合微信公众号封面首图，横版构图，标题区域清晰，画面简洁有编辑感，不包含二维码、品牌水印或真实人物肖像。",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cover-minimal-business",
      name: "极简商务风",
      prompt:
        "极简商务风格，浅色背景，留白充足，使用克制的几何元素和清晰层次，适合知识、效率、职场和商业分析类文章封面。",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cover-bright-editorial",
      name: "活泼醒目风",
      prompt:
        "活泼醒目的编辑风格，高对比色块，视觉中心明确，适合观点表达、运营干货和新媒体内容封面，但不要杂乱或过度卡通。",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createDefaultPosterPromptTemplates() {
  const now = new Date().toISOString();
  return [
    {
      id: "poster-quote-card",
      name: "金句传播贴图",
      prompt:
        "公众号贴图背景，竖版 3:4 构图，背景简洁高级，下半部分留出干净叠字空间，适合朋友圈和公众号文末传播。",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "poster-summary-card",
      name: "总结要点贴图",
      prompt:
        "公众号贴图背景，适合知识类、教程类、干货类内容，画面有层次但不出现文字排版，预留清晰叠字区域。",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "poster-editorial-card",
      name: "观点编辑贴图",
      prompt:
        "公众号贴图背景，编辑感强，适合观点表达和深度文章，画面克制、有留白、有主题氛围，但不要杂乱。",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createCoverPrompt({
  markdown,
  title,
  summary,
  keywords = [],
  coverPrompt = "",
  textMode = "canvas",
}) {
  const excerpt = createMediaSourceExcerpt(markdown, 1000);
  const cleanKeywords = Array.isArray(keywords) ? keywords.filter(Boolean) : [];
  const cleanCoverPrompt = String(coverPrompt || "").trim();
  const cleanTitle = String(title || "").trim();
  const isModelTextMode = textMode === "model";
  const styleSection = cleanCoverPrompt
    ? `\n封面风格要求：${cleanCoverPrompt}`
    : "\n封面风格要求：适合微信公众号首图，横版构图，留出安全的标题空间，视觉清晰、有编辑感。";
  const titleInstruction = isModelTextMode
    ? `必须在左侧完整显示中文标题：《${cleanTitle || "根据正文提炼一个克制清晰的主题"}》。标题文字必须清晰可读，不要改字，不要漏字，不要生成乱码。`
    : "左侧保留大面积干净留白，后续由 WX 工具叠加中文标题；不要在画面中生成任何中文或英文文字、字母、数字、Logo、水印。";

  return `为微信公众号文章生成一张专业封面图。画面需要适合中文公众号首图，横版 16:9 构图，视觉清晰、有编辑感，不要包含二维码、品牌水印或真实人物肖像。

标题处理要求：${titleInstruction}

文章标题方向：${cleanTitle || "根据正文提炼一个克制清晰的主题"}
文章摘要：${summary || "根据正文主题生成封面氛围"}
关键词：${cleanKeywords.join("、") || "公众号、内容创作、排版"}${styleSection}
正文参考：${excerpt}`;
}

const trimBriefValue = (value, maxLength) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const posterCanvasFallbackPrompt =
  "无文字抽象背景，竖版 3:4 构图，留白充足，干净背景层次，适合后续叠加中文标题、金句和说明。";

const posterCanvasBlockedPattern =
  /文字|字母|数字|标题|主标题|副标题|金句|总结|要点|信息层次|信息图|卡片|UI|界面|按钮|图标|icon|logo|水印|二维码|小字|说明|排版|清单|列表|表格|截图|功能/i;

const sanitizePosterCanvasPrompt = (value, fallback = posterCanvasFallbackPrompt) => {
  const text = String(value || "").trim();
  if (!text) return fallback;

  const safeParts = text
    .split(/[，。；;、,.!?！？\n]+/)
    .map((part) => part.trim())
    .filter((part) => part && !posterCanvasBlockedPattern.test(part));

  const safePrompt = safeParts.join("，").trim();
  return safePrompt || fallback;
};

export function normalizePosterTextBrief(value) {
  const parsed = value || {};
  const brief = {
    title: trimBriefValue(parsed.title || parsed.headline || parsed.mainTitle, 24),
    quote: trimBriefValue(parsed.quote || parsed.sentence || parsed.slogan || parsed.summary, 48),
    note: trimBriefValue(parsed.note || parsed.subtitle || parsed.description, 36),
    backgroundPrompt: trimBriefValue(
      parsed.backgroundPrompt || parsed.background_prompt || parsed.imagePrompt || parsed.visualPrompt || parsed.prompt,
      160,
    ),
  };

  if (!brief.title || !brief.quote || !brief.backgroundPrompt) {
    throw new Error("AI 贴图文案结果解析失败");
  }

  return brief;
}

export function createPosterBriefPrompt({ markdown, posterPrompt = "" }) {
  const excerpt = createMediaSourceExcerpt(markdown, 3500);
  const cleanPosterPrompt = sanitizePosterCanvasPrompt(posterPrompt);

  return `请根据公众号文章初稿，提炼一张可独立传播的公众号贴图文案。

只输出一个 JSON 对象，不要解释，不要使用 Markdown 代码块。JSON 结构必须是：
{
  "title": "12字以内主标题",
  "quote": "28字以内金句或总结句",
  "note": "18字以内辅助说明",
  "backgroundPrompt": "用于生成无文字背景图的画面提示词"
}

要求：
1. title、quote、note 必须来自原文主题，不编造事实。
2. quote 要适合做金句图或总结图，清楚、有传播感，但不要夸张标题党。
3. backgroundPrompt 只描述画面、氛围、色彩、构图，不要要求模型生成中文或英文文字。
4. 贴图提示词要求：${cleanPosterPrompt || "公众号贴图，竖版 3:4，清晰留白，适合叠加中文文案。"}

正文参考：${excerpt}`;
}

export function createPosterPrompt({ brief, posterPrompt = "", textMode = "canvas" }) {
  const normalizedBrief = normalizePosterTextBrief(brief);
  const cleanPosterPrompt = String(posterPrompt || "").trim();
  const stylePrompt = cleanPosterPrompt || "公众号贴图背景，克制高级，留白充足。";

  if (textMode === "model") {
    return `生成一张完整的公众号贴图，竖版 3:4 构图，适合朋友圈和公众号文末传播。

文字处理要求：
必须完整显示主标题：《${normalizedBrief.title}》
必须完整显示金句：《${normalizedBrief.quote}》
必须完整显示辅助说明：《${normalizedBrief.note || "公众号贴图"}》
标题、金句和辅助说明必须清晰可读，不要改字，不要漏字，不要生成乱码。

画面主题：${normalizedBrief.backgroundPrompt}
贴图风格要求：${stylePrompt}

重要限制：不要生成二维码、品牌水印、真实人物肖像或复杂小字。`;
  }

  const safeBackgroundPrompt = sanitizePosterCanvasPrompt(
    normalizedBrief.backgroundPrompt,
    "无文字抽象背景，依据文章主题生成克制、干净、有留白的视觉氛围。",
  );
  const safeStylePrompt = sanitizePosterCanvasPrompt(stylePrompt);

  return `生成一张公众号贴图背景图，竖版 3:4 构图，后续由 TypeZen 工具叠加中文标题、金句和说明。

画面主题：${safeBackgroundPrompt}
贴图风格要求：${safeStylePrompt}

重要限制：只生成无文字抽象背景或安静场景背景；不要在画面中生成任何中文或英文文字、字母或数字；不要生成信息图、界面组件、按钮网格、应用截图、二维码、品牌水印、真实人物肖像或复杂小字。`;
}

export function extractJsonObject(text) {
  return extractJsonObjectFromAiText(text);
}

export function createAppliedAiChange({ taskType, original, applied, label }) {
  return {
    taskType,
    original,
    applied,
    label,
    appliedAt: new Date().toISOString(),
  };
}

export function resolveCoverGenerationConfig({
  textBaseUrl,
  textApiKey,
  imageBaseUrl,
  imageApiKey,
  imageModel,
}) {
  const model = String(imageModel || "").trim();
  return {
    baseUrl: String(imageBaseUrl || textBaseUrl || "").trim(),
    apiKey: String(imageApiKey || textApiKey || "").trim(),
    model,
    hasImageModel: Boolean(model),
  };
}

export function getCoverGenerationConfigStatus(config) {
  const resolved = resolveCoverGenerationConfig(config);
  const missingItems = [];
  if (!resolved.model) missingItems.push("封面生图模型");
  if (!resolved.apiKey) missingItems.push("API Key");
  if (!resolved.baseUrl) missingItems.push("API 地址");

  if (missingItems.length === 0) {
    return {
      isConfigured: true,
      message: "封面生图配置已就绪。",
    };
  }

  const missingText =
    missingItems.length === 1
      ? missingItems[0]
      : `${missingItems.slice(0, -1).join("、")} 和 ${missingItems[missingItems.length - 1]}`;

  return {
    isConfigured: false,
    message: `请先在 AI 服务配置中填写${missingText}。`,
  };
}

export function createPublishWorkflowSteps({
  hasContent,
  hasRewriteDraft,
  hasAppliedRewrite,
  hasFormatDraft,
  hasAppliedFormat,
  hasCoverGenerated,
  hasPosterGenerated,
  hasCheckWarnings,
  hasPublishOptimization,
  hasCopied,
}) {
  return [
    {
      id: "draft",
      label: "初稿",
      status: hasContent ? "done" : "pending",
      description: hasContent ? "已有正文" : "等待正文",
    },
    {
      id: "rewrite",
      label: "AI 改写",
      status: !hasContent
        ? "pending"
        : hasRewriteDraft
          ? "active"
          : hasAppliedRewrite
            ? "done"
            : "pending",
      description: !hasContent
        ? "等待初稿"
        : hasRewriteDraft
          ? "改写稿待确认"
          : hasAppliedRewrite
            ? "已应用改写"
            : "可选改写",
    },
    {
      id: "format",
      label: "AI 排版",
      status: !hasContent
        ? "pending"
        : hasFormatDraft
          ? "active"
          : hasAppliedFormat
            ? "done"
            : "pending",
      description: !hasContent
        ? "等待初稿"
        : hasFormatDraft
          ? "排版稿待确认"
          : hasAppliedFormat
            ? "已应用排版"
            : "可 AI 排版",
    },
    {
      id: "image",
      label: "AI 生图",
      status: !hasContent
        ? "pending"
        : hasCoverGenerated || hasPosterGenerated
          ? "done"
          : "pending",
      description: !hasContent
        ? "等待初稿"
        : hasCoverGenerated || hasPosterGenerated
          ? "已生成图片"
          : "等待生成图片",
    },
    {
      id: "check",
      label: "发布物料",
      status: !hasContent ? "pending" : hasPublishOptimization ? "done" : "pending",
      description: !hasContent
        ? "等待初稿"
        : hasPublishOptimization
          ? "物料已生成"
          : "等待生成物料",
    },
    {
      id: "publish",
      label: "复制发布",
      status: hasCopied ? "done" : "pending",
      description: hasCopied ? "已复制正文" : "等待复制正文",
    },
  ];
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

export function runPublishChecks(markdown, options = {}) {
  const trimmed = markdown.trim();
  const hasCoverImage = Boolean(options.hasCoverImage);
  const headings = countMatches(trimmed, /^#{1,6}\s+.+$/gm);
  const longParagraphs = trimmed
    .split(/\n{2,}/)
    .filter((block) => !/^\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>|```|!\[|\[)/.test(block))
    .filter((block) => block.replace(/\s/g, "").length > 240).length;
  const images = countMatches(trimmed, /!\[[^\]]*]\([^)]+\)/g);
  const localImages = countMatches(trimmed, /!\[[^\]]*]\(#img-\d+\)/g);
  const links = countMatches(trimmed, /\[[^\]]+]\([^)]+\)/g) - images;
  const placeholderLinks = countMatches(trimmed, /\[[^\]]+]\((url|#|)\)/gi);
  const codeBlocks = countMatches(trimmed, /```[\s\S]*?```/g);
  const tables = countMatches(trimmed, /^\|.+\|$/gm);

  return [
    {
      id: "headings",
      label: "标题层级",
      status: headings > 0 ? "success" : "warning",
      message:
        headings > 0
          ? `检测到 ${headings} 个标题。`
          : "建议至少保留一个主标题，便于读者快速判断主题。",
    },
    {
      id: "paragraph-length",
      label: "段落长度",
      status: longParagraphs > 0 ? "warning" : "success",
      message:
        longParagraphs > 0
          ? `有 ${longParagraphs} 个段落偏长，建议拆分或用列表承接。`
          : "段落长度适合手机阅读。",
    },
    {
      id: "images",
      label: "图片发布",
      status: localImages > 0 ? "warning" : "success",
      message:
        images === 0
          ? hasCoverImage
            ? "已生成封面图，正文未检测到图片。"
            : "未检测到图片。"
          : localImages > 0
            ? "检测到本地粘贴图片，发布前建议确认公众号后台能正常识别。"
            : hasCoverImage
              ? `已生成封面图，正文检测到 ${images} 张在线图片。`
              : `检测到 ${images} 张在线图片。`,
    },
    {
      id: "links",
      label: "链接检查",
      status: placeholderLinks > 0 ? "warning" : "success",
      message:
        placeholderLinks > 0
          ? "检测到占位链接，请发布前替换为真实地址。"
          : links > 0
            ? `检测到 ${links} 个链接。`
            : "未检测到正文链接。",
    },
    {
      id: "code",
      label: "代码块",
      status: codeBlocks > 0 ? "success" : "neutral",
      message:
        codeBlocks > 0 ? `检测到 ${codeBlocks} 个代码块，已按模板样式渲染。` : "未检测到代码块。",
    },
    {
      id: "tables",
      label: "表格",
      status: tables > 0 ? "warning" : "neutral",
      message:
        tables > 0 ? "检测到表格，公众号移动端可能较挤，建议预览后再发布。" : "未检测到表格。",
    },
  ];
}
