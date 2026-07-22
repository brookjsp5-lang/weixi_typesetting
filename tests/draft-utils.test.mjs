import assert from "node:assert/strict";
import test from "node:test";

import {
  deserializeImageMap,
  extractImageSource,
  htmlToMarkdownDraft,
  localizeRemoteHtmlImages,
  localizeRemoteMarkdownImages,
  normalizeConsecutiveImageBlocks,
  serializeAutosaveImageMap,
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

test("normalizeConsecutiveImageBlocks separates adjacent image lines", () => {
  assert.equal(
    normalizeConsecutiveImageBlocks("before\n\n![one](#img-1)\n![two](#img-2)\n\nnext"),
    "before\n\n![one](#img-1)\n\n![two](#img-2)\n\nnext",
  );
});

test("normalizeConsecutiveImageBlocks separates same-line image groups", () => {
  assert.equal(
    normalizeConsecutiveImageBlocks(
      "![one](#img-1) ![two](https://example.com/two.png) ![three](data:image/png;base64,abc)",
    ),
    "![one](#img-1)\n\n![two](https://example.com/two.png)\n\n![three](data:image/png;base64,abc)",
  );
});

test("normalizeConsecutiveImageBlocks keeps inline text-image content unchanged", () => {
  const markdown = "intro ![one](#img-1) ![two](#img-2)";
  assert.equal(normalizeConsecutiveImageBlocks(markdown), markdown);
});

test("normalizeConsecutiveImageBlocks skips fenced code blocks", () => {
  const markdown =
    "```markdown\n![one](#img-1) ![two](#img-2)\n```\n\n![three](#img-3)\n![four](#img-4)";

  assert.equal(
    normalizeConsecutiveImageBlocks(markdown),
    "```markdown\n![one](#img-1) ![two](#img-2)\n```\n\n![three](#img-3)\n\n![four](#img-4)",
  );
});

test("htmlToMarkdownDraft normalizes image-only HTML paragraphs", () => {
  const result = htmlToMarkdownDraft(
    `<article><p><img src="https://example.com/one.png" alt="one"><img src="https://example.com/two.png" alt="two"></p></article>`,
    () => "#img-unused",
  );

  assert.equal(
    result.markdown,
    "![one](https://example.com/one.png)\n\n![two](https://example.com/two.png)",
  );
});

test("image map serialization round trips draft images", () => {
  const imageMap = new Map([
    ["img-1", "data:image/png;base64,one"],
    ["img-2", "data:image/png;base64,two"],
  ]);

  assert.deepEqual(deserializeImageMap(serializeImageMap(imageMap)), imageMap);
});

test("serializeAutosaveImageMap only keeps images referenced by markdown", () => {
  const imageMap = new Map([
    ["img-1", "data:image/png;base64,one"],
    ["img-2", "data:image/png;base64,two"],
    ["img-3", "data:image/png;base64,three"],
  ]);

  assert.deepEqual(serializeAutosaveImageMap(imageMap, "![one](#img-1)\n\n![three](#img-3)"), [
    { id: "img-1", dataUrl: "data:image/png;base64,one" },
    { id: "img-3", dataUrl: "data:image/png;base64,three" },
  ]);
});

test("serializeAutosaveImageMap keeps images referenced by imported raw html", () => {
  const imageMap = new Map([
    ["img-1", "data:image/png;base64,one"],
    ["img-2", "data:image/png;base64,two"],
  ]);

  assert.deepEqual(
    serializeAutosaveImageMap(
      imageMap,
      '<section><img src="#img-1"><img data-src="#img-2"></section>',
    ),
    [
      { id: "img-1", dataUrl: "data:image/png;base64,one" },
      { id: "img-2", dataUrl: "data:image/png;base64,two" },
    ],
  );
});

test("serializeAutosaveImageMap drops oversized images instead of exceeding the save budget", () => {
  const imageMap = new Map([
    ["img-1", `data:image/png;base64,${"a".repeat(80)}`],
    ["img-2", `data:image/png;base64,${"b".repeat(80)}`],
  ]);

  const result = serializeAutosaveImageMap(imageMap, "![one](#img-1)\n\n![two](#img-2)", {
    maxTotalBytes: 120,
  });

  assert.deepEqual(result.map((item) => item.id), ["img-1"]);
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

test("localizeRemoteMarkdownImages converts remote images to local refs", async () => {
  const imported = [];
  const localized = await localizeRemoteMarkdownImages(
    "![图片](https://cdn.nlark.com/yuque/image.png)\n\n正文",
    async (url) => {
      imported.push(url);
      return "data:image/png;base64,abc123";
    },
    (dataUrl) => {
      assert.equal(dataUrl, "data:image/png;base64,abc123");
      return "#img-7";
    },
  );

  assert.deepEqual(imported, ["https://cdn.nlark.com/yuque/image.png"]);
  assert.equal(localized.markdown, "![图片](#img-7)\n\n正文");
  assert.equal(localized.localizedCount, 1);
  assert.equal(localized.failedCount, 0);
});

test("localizeRemoteMarkdownImages normalizes adjacent localized images", async () => {
  const localized = await localizeRemoteMarkdownImages(
    "![one](https://cdn.nlark.com/one.png) ![two](https://cdn.nlark.com/two.png)",
    async (url) => `data:image/png;base64,${url.endsWith("one.png") ? "one" : "two"}`,
    (dataUrl) => (dataUrl.endsWith("one") ? "#img-1" : "#img-2"),
  );

  assert.equal(localized.markdown, "![one](#img-1)\n\n![two](#img-2)");
  assert.equal(localized.localizedCount, 2);
  assert.equal(localized.failedCount, 0);
});

test("localizeRemoteMarkdownImages keeps original image when import fails", async () => {
  const localized = await localizeRemoteMarkdownImages(
    "![图片](https://cdn.nlark.com/yuque/image.png)",
    async () => "",
    () => "#img-unused",
  );

  assert.equal(localized.markdown, "![图片](https://cdn.nlark.com/yuque/image.png)");
  assert.equal(localized.localizedCount, 0);
  assert.equal(localized.failedCount, 1);
});

test("localizeRemoteHtmlImages preserves html layout while localizing image sources", async () => {
  const localized = await localizeRemoteHtmlImages(
    '<section style="background-color:#f7f4ef;text-align:center"><p><strong>原文重点</strong></p><img data-src="https://mmbiz.qpic.cn/demo.png" style="width:120px" alt="书"></section>',
    async (url) => {
      assert.equal(url, "https://mmbiz.qpic.cn/demo.png");
      return "data:image/png;base64,abc123";
    },
    (dataUrl) => {
      assert.equal(dataUrl, "data:image/png;base64,abc123");
      return "#img-9";
    },
  );

  assert.match(localized.html, /background-color:#f7f4ef/);
  assert.match(localized.html, /<strong>原文重点<\/strong>/);
  assert.match(localized.html, /src="#img-9"/);
  assert.match(localized.html, /style="width:120px"/);
  assert.equal(localized.localizedCount, 1);
  assert.equal(localized.failedCount, 0);
});
