import assert from "node:assert/strict";
import test from "node:test";

import {
  createAppliedAiChange,
  createCoverPrompt,
  createDefaultCoverPromptTemplates,
  createDefaultPosterPromptTemplates,
  createDefaultPromptTemplates,
  createPosterPrompt,
  createPublishWorkflowSteps,
  extractJsonObject,
  getCoverGenerationConfigStatus,
  getProviderPreset,
  normalizePosterTextBrief,
  resolveCoverGenerationConfig,
  runPublishChecks,
} from "../app/_lib/workflow-utils.js";

test("provider presets include domestic OpenAI-compatible services", () => {
  assert.equal(getProviderPreset("openrouter").imageBaseUrl, "https://openrouter.ai/api/v1/images");
  assert.equal(getProviderPreset("openrouter").defaultImageModel, "bytedance-seed/seedream-4.5");
  assert.equal(getProviderPreset("deepseek").baseUrl, "https://api.deepseek.com");
  assert.equal(getProviderPreset("volcengine").baseUrl, "https://ark.cn-beijing.volces.com/api/v3");
  assert.equal(
    getProviderPreset("volcengine").imageBaseUrl,
    "https://ark.cn-beijing.volces.com/api/v3/images/generations",
  );
  assert.equal(getProviderPreset("volcengine").defaultImageModel, "doubao-seedream-5-0-lite-260128");
  assert.equal(
    getProviderPreset("dashscope").baseUrl,
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
  );
  assert.equal(
    getProviderPreset("dashscope").imageBaseUrl,
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
  );
  assert.equal(getProviderPreset("dashscope").defaultImageModel, "qwen-image-2.0-pro");
  assert.equal(getProviderPreset("moonshot").baseUrl, "https://api.moonshot.ai/v1");
  assert.equal(getProviderPreset("zhipu").baseUrl, "https://open.bigmodel.cn/api/paas/v4");
  assert.equal(
    getProviderPreset("zhipu").imageBaseUrl,
    "https://open.bigmodel.cn/api/paas/v4/images/generations",
  );
  assert.equal(getProviderPreset("zhipu").defaultImageModel, "glm-image");
  assert.equal(getProviderPreset("minimax").baseUrl, "https://api.minimaxi.com/v1");
  assert.equal(getProviderPreset("minimax").defaultModel, "MiniMax-M3");
  assert.equal(getProviderPreset("minimax").imageBaseUrl, "https://api.minimaxi.com/v1/image_generation");
  assert.equal(getProviderPreset("minimax").defaultImageModel, "image-01");
  assert.match(getProviderPreset("minimax").imageModelHelp || "", /image-01-live/);
  assert.equal(getProviderPreset("qwen").name, "Qwen");
  assert.equal(getProviderPreset("qwen").defaultModel, "qwen-plus");
  assert.equal(
    getProviderPreset("qwen").imageBaseUrl,
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
  );
  assert.equal(getProviderPreset("qwen").defaultImageModel, "qwen-image-2.0-pro");
  assert.equal(getProviderPreset("mimo").baseUrl, "https://api.xiaomimimo.com/v1");
  assert.equal(getProviderPreset("mimo").defaultModel, "mimo-v2.5-pro");
  assert.equal(getProviderPreset("openai").imageBaseUrl, "https://api.openai.com/v1/images/generations");
  assert.equal(getProviderPreset("openai").defaultImageModel, "gpt-image-2");
  assert.equal(getProviderPreset("deepseek").defaultImageModel, undefined);
  assert.equal(getProviderPreset("moonshot").defaultImageModel, undefined);
  assert.equal(getProviderPreset("mimo").defaultImageModel, undefined);
  assert.equal(getProviderPreset("anthropic").defaultImageModel, undefined);
});

test("provider presets point to current official API key pages", () => {
  assert.equal(getProviderPreset("openrouter").apiKeyUrl, "https://openrouter.ai/keys");
  assert.equal(getProviderPreset("openai").apiKeyUrl, "https://platform.openai.com/api-keys");
  assert.equal(getProviderPreset("minimax").apiKeyUrl, "https://platform.minimaxi.com/console/access");
  assert.equal(
    getProviderPreset("mimo").apiKeyUrl,
    "https://platform.xiaomimimo.com/console/api-keys",
  );
  assert.equal(
    getProviderPreset("moonshot").apiKeyUrl,
    "https://platform.kimi.ai/console/api-keys",
  );
  assert.equal(
    getProviderPreset("anthropic").apiKeyUrl,
    "https://platform.claude.com/settings/keys",
  );
});

test("default prompt templates are reusable and user-editable", () => {
  const templates = createDefaultPromptTemplates();

  assert.ok(templates.length >= 3);
  assert.ok(templates.every((template) => template.id));
  assert.ok(templates.every((template) => template.name));
  assert.ok(templates.every((template) => template.prompt.includes("保留")));
});

test("default cover prompt templates are separate from rewrite prompts", () => {
  const templates = createDefaultCoverPromptTemplates();
  const rewriteTemplates = createDefaultPromptTemplates();

  assert.deepEqual(
    templates.map((template) => template.name),
    ["公众号封面通用", "极简商务风", "活泼醒目风"],
  );
  assert.ok(templates.every((template) => template.id.startsWith("cover-")));
  assert.ok(templates.every((template) => template.prompt.includes("封面")));
  assert.ok(!rewriteTemplates.some((template) => template.id.startsWith("cover-")));
});

test("default poster prompt templates are separate from cover prompts", () => {
  const templates = createDefaultPosterPromptTemplates();
  const coverTemplates = createDefaultCoverPromptTemplates();

  assert.ok(templates.length >= 3);
  assert.ok(templates.every((template) => template.id.startsWith("poster-")));
  assert.ok(templates.every((template) => template.prompt.includes("贴图")));
  assert.ok(!coverTemplates.some((template) => template.id.startsWith("poster-")));
});

test("createCoverPrompt combines article context with selected cover prompt", () => {
  const prompt = createCoverPrompt({
    markdown: "# 用 WX 整理公众号文章\n\n正文内容",
    title: "用 WX 整理公众号文章",
    summary: "把初稿、排版、封面和发布物料整理到可发布状态。",
    keywords: ["公众号", "排版"],
    coverPrompt: "极简商务风，浅色背景，清晰标题区，不使用真实人物。",
  });

  assert.match(prompt, /文章标题方向：用 WX 整理公众号文章/);
  assert.match(prompt, /文章摘要：把初稿、排版、封面和发布物料整理到可发布状态。/);
  assert.match(prompt, /关键词：公众号、排版/);
  assert.match(prompt, /封面风格要求：极简商务风，浅色背景，清晰标题区，不使用真实人物。/);
});

test("createCoverPrompt defaults to background-only canvas text mode", () => {
  const prompt = createCoverPrompt({
    markdown: "# Codex CLI 教程\n\n配置代理和模型。",
    title: "Codex CLI 子代理保姆级教程",
    summary: "配置代理、模型和工作流。",
    keywords: ["Codex", "CLI"],
    coverPrompt: "左侧大面积留白放标题，右侧科技元素。",
  });

  assert.match(prompt, /不要在画面中生成任何中文或英文文字/);
  assert.match(prompt, /左侧保留大面积干净留白/);
  assert.match(prompt, /后续由 WX 工具叠加中文标题/);
  assert.doesNotMatch(prompt, /必须完整显示中文标题/);
});

test("createCoverPrompt model text mode asks image model to render the exact title", () => {
  const prompt = createCoverPrompt({
    markdown: "# Codex CLI 教程\n\n配置代理和模型。",
    title: "Codex CLI 子代理保姆级教程",
    summary: "配置代理、模型和工作流。",
    keywords: ["Codex", "CLI"],
    coverPrompt: "左侧大面积留白放标题，右侧科技元素。",
    textMode: "model",
  });

  assert.match(prompt, /必须在左侧完整显示中文标题：《Codex CLI 子代理保姆级教程》/);
  assert.match(prompt, /不要改字，不要漏字，不要生成乱码/);
  assert.doesNotMatch(prompt, /后续由 WX 工具叠加中文标题/);
});

test("createPosterPrompt keeps text overlay out of image model prompt", () => {
  const prompt = createPosterPrompt({
    markdown: "# 做内容要先抓住重点\n公众号写作要把观点提炼成一句可传播的话。",
    brief: {
      title: "先抓住重点",
      quote: "好内容不是写得更多，而是让读者更快记住。",
      note: "适合内容创作者收藏",
      backgroundPrompt: "安静的书桌、便签和柔和光线",
    },
    posterPrompt: "知识类公众号贴图，克制高级，竖版构图。",
  });

  assert.match(prompt, /公众号贴图背景/);
  assert.match(prompt, /竖版 3:4/);
  assert.match(prompt, /不要在画面中生成任何中文或英文文字/);
  assert.match(prompt, /安静的书桌、便签和柔和光线/);
  assert.match(prompt, /知识类公众号贴图/);
});

test("normalizePosterTextBrief rejects invalid generated poster brief", () => {
  assert.throws(
    () => normalizePosterTextBrief({ title: "", quote: "", backgroundPrompt: "" }),
    /AI 贴图文案结果解析失败/,
  );
});

test("normalizePosterTextBrief accepts common AI field aliases", () => {
  const brief = normalizePosterTextBrief({
    headline: "内容重点",
    sentence: "好内容要让读者更快记住",
    subtitle: "适合公众号传播",
    imagePrompt: "安静书桌与柔和光线",
  });

  assert.deepEqual(brief, {
    title: "内容重点",
    quote: "好内容要让读者更快记住",
    note: "适合公众号传播",
    backgroundPrompt: "安静书桌与柔和光线",
  });
});

test("extractJsonObject accepts model responses wrapped in prose or fences", () => {
  const json = extractJsonObject(
    `这里是结果：\n\`\`\`json\n{"titles":["A"],"keywords":["B"]}\n\`\`\``,
  );

  assert.deepEqual(json, {
    titles: ["A"],
    keywords: ["B"],
  });
});

test("createAppliedAiChange records enough information to restore the draft", () => {
  const change = createAppliedAiChange({
    taskType: "rewrite",
    original: "原来的初稿",
    applied: "AI 改写后的初稿",
    label: "公众号温和润色",
  });

  assert.equal(change.taskType, "rewrite");
  assert.equal(change.original, "原来的初稿");
  assert.equal(change.applied, "AI 改写后的初稿");
  assert.equal(change.label, "公众号温和润色");
  assert.ok(change.appliedAt);
});

test("resolveCoverGenerationConfig separates image model from text model", () => {
  const config = resolveCoverGenerationConfig({
    textBaseUrl: "https://text.example/v1",
    textApiKey: "text-key",
    imageBaseUrl: "",
    imageApiKey: "",
    imageModel: "",
  });

  assert.equal(config.baseUrl, "https://text.example/v1");
  assert.equal(config.apiKey, "text-key");
  assert.equal(config.model, "");
  assert.equal(config.hasImageModel, false);

  const imageConfig = resolveCoverGenerationConfig({
    textBaseUrl: "https://text.example/v1",
    textApiKey: "text-key",
    imageBaseUrl: "https://image.example/v1",
    imageApiKey: "image-key",
    imageModel: "gpt-image-1",
  });

  assert.equal(imageConfig.baseUrl, "https://image.example/v1");
  assert.equal(imageConfig.apiKey, "image-key");
  assert.equal(imageConfig.model, "gpt-image-1");
  assert.equal(imageConfig.hasImageModel, true);
});

test("getCoverGenerationConfigStatus explains missing cover image configuration", () => {
  assert.deepEqual(
    getCoverGenerationConfigStatus({
      textBaseUrl: "",
      textApiKey: "",
      imageBaseUrl: "",
      imageApiKey: "",
      imageModel: "",
    }),
    {
      isConfigured: false,
      message: "请先在 AI 服务配置中填写封面生图模型、API Key 和 API 地址。",
    },
  );

  assert.deepEqual(
    getCoverGenerationConfigStatus({
      textBaseUrl: "https://api.example.com/v1",
      textApiKey: "text-key",
      imageBaseUrl: "",
      imageApiKey: "",
      imageModel: "",
    }),
    {
      isConfigured: false,
      message: "请先在 AI 服务配置中填写封面生图模型。",
    },
  );

  assert.deepEqual(
    getCoverGenerationConfigStatus({
      textBaseUrl: "https://api.example.com/v1",
      textApiKey: "text-key",
      imageBaseUrl: "",
      imageApiKey: "",
      imageModel: "gpt-image-1",
    }),
    {
      isConfigured: true,
      message: "封面生图配置已就绪。",
    },
  );
});

test("publish checks flag long paragraphs, missing images, links, and headings", () => {
  const checks = runPublishChecks(
    "# 主标题\n\n" +
      "这是一段很长的正文".repeat(35) +
      "\n\n" +
      "![图片](#img-1)\n\n" +
      "[阅读原文](url)\n\n" +
      "```js\nconsole.log('ok')\n```",
  );

  assert.equal(checks.find((item) => item.id === "headings")?.status, "success");
  assert.equal(checks.find((item) => item.id === "paragraph-length")?.status, "warning");
  assert.equal(checks.find((item) => item.id === "images")?.status, "warning");
  assert.equal(checks.find((item) => item.id === "links")?.status, "warning");
  assert.equal(checks.find((item) => item.id === "code")?.status, "success");
});

test("publish checks account for generated cover image", () => {
  const checks = runPublishChecks("# 主标题\n\n正文内容", { hasCoverImage: true });
  const imageCheck = checks.find((item) => item.id === "images");

  assert.equal(imageCheck?.status, "success");
  assert.equal(imageCheck?.message, "已生成封面图，正文未检测到图片。");
});

test("publish workflow steps reflect draft, rewrite, format, image, check, and publish progress", () => {
  const pending = createPublishWorkflowSteps({
    hasContent: false,
    hasRewriteDraft: false,
    hasAppliedRewrite: false,
    hasFormatDraft: false,
    hasAppliedFormat: false,
    hasCoverGenerated: false,
    hasCheckWarnings: false,
    hasPublishOptimization: false,
    hasCopied: false,
  });

  assert.deepEqual(
    pending.map((step) => step.status),
    ["pending", "pending", "pending", "pending", "pending", "pending"],
  );

  const withFormatDraft = createPublishWorkflowSteps({
    hasContent: true,
    hasRewriteDraft: true,
    hasAppliedRewrite: false,
    hasFormatDraft: true,
    hasAppliedFormat: false,
    hasCoverGenerated: true,
    hasCheckWarnings: true,
    hasPublishOptimization: true,
    hasCopied: false,
  });

  assert.deepEqual(
    withFormatDraft.map((step) => step.status),
    ["done", "active", "active", "done", "done", "pending"],
  );

  const complete = createPublishWorkflowSteps({
    hasContent: true,
    hasRewriteDraft: false,
    hasAppliedRewrite: true,
    hasFormatDraft: false,
    hasAppliedFormat: true,
    hasCoverGenerated: true,
    hasCheckWarnings: false,
    hasPublishOptimization: true,
    hasCopied: true,
  });

  assert.deepEqual(
    complete.map((step) => step.status),
    ["done", "done", "done", "done", "done", "done"],
  );

  assert.deepEqual(
    complete.map((step) => step.id),
    ["draft", "rewrite", "format", "image", "check", "publish"],
  );
});
