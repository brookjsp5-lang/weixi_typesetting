export const providerPresets = [
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "",
    apiKeyUrl: "https://openrouter.ai/settings/keys",
    modelHelp: "选择下方模型，或手动输入 OpenRouter 模型 ID",
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
  },
  {
    id: "dashscope",
    name: "阿里百炼/千问",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
    apiKeyUrl: "https://bailian.console.aliyun.com/?tab=model#/api-key",
    modelHelp: "qwen-plus、qwen-max 或其他兼容模型",
  },
  {
    id: "moonshot",
    name: "Kimi",
    baseUrl: "https://api.moonshot.ai/v1",
    defaultModel: "moonshot-v1-8k",
    apiKeyUrl: "https://platform.moonshot.cn/console/api-keys",
    modelHelp: "moonshot-v1-8k、moonshot-v1-32k 或 moonshot-v1-128k",
  },
  {
    id: "zhipu",
    name: "智谱 GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4-flash",
    apiKeyUrl: "https://bigmodel.cn/usercenter/proj-mgmt/apikeys",
    modelHelp: "glm-4-flash、glm-4-plus 或其他 GLM 模型",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    modelHelp: "gpt-4o 或自定义模型名称",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-5",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
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

export function extractJsonObject(text) {
  const withoutFence = text
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 未返回可解析的 JSON 结果");
  }

  return JSON.parse(withoutFence.slice(start, end + 1));
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

export function createPublishWorkflowSteps({
  hasContent,
  hasRewriteDraft,
  hasAppliedRewrite,
  hasFormatDraft,
  hasAppliedFormat,
  hasCoverGenerated,
  hasCheckWarnings,
  hasPublishOptimization,
  hasCopied,
}) {
  return [
    {
      id: "draft",
      label: "初稿",
      status: hasContent ? "done" : "pending",
      description: hasContent ? "已输入正文" : "等待输入正文",
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
            : "可选提示词改写",
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
            : "可选 AI 整理结构",
    },
    {
      id: "image",
      label: "AI 生成",
      status: !hasContent ? "pending" : hasCoverGenerated ? "done" : "pending",
      description: !hasContent ? "等待初稿" : hasCoverGenerated ? "已生成封面图" : "可生成封面图",
    },
    {
      id: "check",
      label: "发布物料",
      status: !hasContent ? "pending" : hasPublishOptimization ? "done" : "pending",
      description: !hasContent
        ? "等待正文"
        : hasPublishOptimization
          ? "发布物料已生成"
          : "等待生成发布物料",
    },
    {
      id: "publish",
      label: "复制发布",
      status: hasCopied ? "done" : "pending",
      description: hasCopied ? "已复制到剪贴板" : "等待复制发布",
    },
  ];
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

export function runPublishChecks(markdown) {
  const trimmed = markdown.trim();
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
          ? "未检测到图片。"
          : localImages > 0
            ? "检测到本地粘贴图片，发布前建议确认公众号后台能正常识别。"
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
