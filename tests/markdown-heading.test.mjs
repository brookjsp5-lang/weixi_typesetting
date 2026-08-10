import assert from "node:assert/strict";
import test from "node:test";

const headingUtils = await import("../app/_lib/markdown-heading.js").catch(() => null);

function setHeadingLevel(markdown, selectionStart, selectionEnd, level) {
  assert.ok(headingUtils, "heading selection utility should be available");
  return headingUtils.setMarkdownHeadingLevel(markdown, selectionStart, selectionEnd, level);
}

test("setMarkdownHeadingLevel replaces an existing heading marker instead of stacking markers", () => {
  const result = setHeadingLevel("# 一级标题\n\n正文", 0, 6, 2);

  assert.deepEqual(result, {
    markdown: "## 一级标题\n\n正文",
    selectionStart: 0,
    selectionEnd: 7,
  });
});

test("setMarkdownHeadingLevel applies the requested level to every selected non-empty line", () => {
  const result = setHeadingLevel("# 第一节\n\n## 第二节\n正文", 1, 14, 3);

  assert.deepEqual(result, {
    markdown: "### 第一节\n\n### 第二节\n正文",
    selectionStart: 0,
    selectionEnd: 16,
  });
});

test("setMarkdownHeadingLevel keeps an empty current line ready for a new heading", () => {
  const result = setHeadingLevel("正文\n\n结尾", 3, 3, 1);

  assert.deepEqual(result, {
    markdown: "正文\n# 标题\n结尾",
    selectionStart: 3,
    selectionEnd: 7,
  });
});
