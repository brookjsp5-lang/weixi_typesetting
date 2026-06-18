import assert from "node:assert/strict";
import test from "node:test";

import {
  deserializeImageMap,
  extractImageSource,
  htmlToMarkdownDraft,
  serializeImageMap,
} from "../app/_lib/draft-utils.js";
import { createPublishWorkflowSteps } from "../app/_lib/workflow-utils.js";

test("extractImageSource supports Yuque lazy image attributes", () => {
  const element = {
    getAttribute(name) {
      return {
        src: "",
        "data-src": "https://cdn.nlark.com/yuque/image.png",
        "data-original": "https://fallback.example/original.png",
        "data-actualsrc": "https://fallback.example/actual.png",
      }[name];
    },
  };

  assert.equal(extractImageSource(element), "https://cdn.nlark.com/yuque/image.png");
});

test("htmlToMarkdownDraft converts Yuque text and remote images to Markdown", () => {
  const result = htmlToMarkdownDraft(
    `<article>
      <h1>语雀标题</h1>
      <p>第一段 <strong>重点</strong> 和 <a href="https://yuque.com">链接</a></p>
      <img data-src="https://cdn.nlark.com/yuque/0/2026/png/cover.png" alt="封面">
      <blockquote>引用内容</blockquote>
      <ul><li>列表项</li></ul>
    </article>`,
    () => "#img-unused",
  );

  assert.match(result.markdown, /# 语雀标题/);
  assert.match(result.markdown, /第一段 \*\*重点\*\* 和 \[链接\]\(https:\/\/yuque.com\)/);
  assert.match(
    result.markdown,
    /!\[封面\]\(https:\/\/cdn\.nlark\.com\/yuque\/0\/2026\/png\/cover\.png\)/,
  );
  assert.match(result.markdown, /> 引用内容/);
  assert.match(result.markdown, /- 列表项/);
  assert.equal(result.skippedImages, 0);
});

test("htmlToMarkdownDraft stores data images through createImageRef", () => {
  const refs = [];
  const result = htmlToMarkdownDraft(
    `<p>带图段落</p><img src="data:image/png;base64,abc123" alt="截图">`,
    (dataUrl) => {
      refs.push(dataUrl);
      return "#img-1";
    },
  );

  assert.deepEqual(refs, ["data:image/png;base64,abc123"]);
  assert.match(result.markdown, /!\[截图\]\(#img-1\)/);
});

test("image map serialization round trips draft images", () => {
  const imageMap = new Map([
    ["img-1", "data:image/png;base64,one"],
    ["img-2", "data:image/png;base64,two"],
  ]);

  assert.deepEqual(deserializeImageMap(serializeImageMap(imageMap)), imageMap);
});

test("workflow image step is labeled AI 生图", () => {
  const steps = createPublishWorkflowSteps({
    hasContent: true,
    hasRewriteDraft: false,
    hasAppliedRewrite: false,
    hasFormatDraft: false,
    hasAppliedFormat: false,
    hasCoverGenerated: false,
    hasCheckWarnings: false,
    hasPublishOptimization: false,
    hasCopied: false,
  });

  assert.equal(steps.find((step) => step.id === "image")?.label, "AI 生图");
});
