import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultPromptTemplates,
  createPublishWorkflowSteps,
  extractJsonObject,
  getProviderPreset,
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
    hasImageAssist: false,
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
    hasImageAssist: true,
    hasCheckWarnings: true,
    hasPublishOptimization: true,
    hasCopied: false,
  });

  assert.deepEqual(
    withFormatDraft.map((step) => step.status),
    ["done", "active", "active", "done", "warning", "pending"],
  );

  const complete = createPublishWorkflowSteps({
    hasContent: true,
    hasRewriteDraft: false,
    hasAppliedRewrite: true,
    hasFormatDraft: false,
    hasAppliedFormat: true,
    hasImageAssist: true,
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
