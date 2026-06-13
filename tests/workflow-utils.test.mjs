import assert from "node:assert/strict";
import test from "node:test";

import {
  createAppliedAiChange,
  createDefaultPromptTemplates,
  createFallbackCoverImage,
  createPublishWorkflowSteps,
  extractJsonObject,
  getProviderPreset,
  resolveCoverGenerationConfig,
  runPublishChecks,
} from "../app/_lib/workflow-utils.js";

test("provider presets include domestic OpenAI-compatible services", () => {
  assert.equal(getProviderPreset("deepseek").baseUrl, "https://api.deepseek.com");
  assert.equal(getProviderPreset("volcengine").baseUrl, "https://ark.cn-beijing.volces.com/api/v3");
  assert.equal(
    getProviderPreset("dashscope").baseUrl,
    "https://dashscope.aliyuncs.com/compatible-mode/v1",
  );
  assert.equal(getProviderPreset("moonshot").baseUrl, "https://api.moonshot.ai/v1");
  assert.equal(getProviderPreset("zhipu").baseUrl, "https://open.bigmodel.cn/api/paas/v4");
});

test("default prompt templates are reusable and user-editable", () => {
  const templates = createDefaultPromptTemplates();

  assert.ok(templates.length >= 3);
  assert.ok(templates.every((template) => template.id));
  assert.ok(templates.every((template) => template.name));
  assert.ok(templates.every((template) => template.prompt.includes("保留")));
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

test("createFallbackCoverImage returns a usable svg data url with title and keywords", () => {
  const imageUrl = createFallbackCoverImage({
    title: "用 WX 整理公众号文章",
    summary: "把初稿、排版、封面和发布物料整理到可发布状态。",
    keywords: ["公众号", "排版"],
  });

  assert.ok(imageUrl.startsWith("data:image/svg+xml;charset=utf-8,"));
  const decoded = decodeURIComponent(imageUrl.split(",")[1]);
  assert.match(decoded, /用 WX 整理公众号文章/);
  assert.match(decoded, /公众号/);
  assert.match(decoded, /排版/);
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
