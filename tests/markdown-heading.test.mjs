import assert from "node:assert/strict";
import test from "node:test";

const headingUtils = await import("../app/_lib/markdown-heading.js").catch(() => null);
const listUtils = await import("../app/_lib/markdown-list.js").catch(() => null);
const quoteUtils = await import("../app/_lib/markdown-quote.js").catch(() => null);

function setHeadingLevel(markdown, selectionStart, selectionEnd, level) {
  assert.ok(headingUtils, "heading selection utility should be available");
  return headingUtils.setMarkdownHeadingLevel(markdown, selectionStart, selectionEnd, level);
}

function setListType(markdown, selectionStart, selectionEnd, type) {
  assert.ok(listUtils, "list selection utility should be available");
  return listUtils.setMarkdownListType(markdown, selectionStart, selectionEnd, type);
}

function setQuote(markdown, selectionStart, selectionEnd) {
  assert.ok(quoteUtils, "quote selection utility should be available");
  return quoteUtils.setMarkdownQuote(markdown, selectionStart, selectionEnd);
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

test("setMarkdownListType creates continuous ordered markers for every selected line", () => {
  const markdown = "黑芝麻酱\n加生抽\n食材搅熟\n淋酱汁";
  const expected = "1. 黑芝麻酱\n2. 加生抽\n3. 食材搅熟\n4. 淋酱汁";
  const result = setListType(markdown, 0, markdown.length, "ol");

  assert.deepEqual(result, {
    markdown: expected,
    selectionStart: 0,
    selectionEnd: expected.length,
  });
});

test("setMarkdownListType replaces existing unordered markers while keeping blank lines", () => {
  const markdown = "- 芝麻酱\n- 加生抽\n\n- 淋酱汁";
  const expected = "1. 芝麻酱\n2. 加生抽\n\n3. 淋酱汁";
  const result = setListType(markdown, 0, markdown.length, "ol");

  assert.deepEqual(result, {
    markdown: expected,
    selectionStart: 0,
    selectionEnd: expected.length,
  });
});

test("setMarkdownQuote prefixes every selected non-empty line", () => {
  const markdown = "第一条\n第二条\n\n第三条";
  const expected = "> 第一条\n> 第二条\n\n> 第三条";
  const result = setQuote(markdown, 0, markdown.length);

  assert.deepEqual(result, {
    markdown: expected,
    selectionStart: 0,
    selectionEnd: expected.length,
  });
});

test("setMarkdownQuote replaces existing quote markers instead of duplicating them", () => {
  const markdown = "> 第一条\n> 第二条";
  const result = setQuote(markdown, 0, markdown.length);

  assert.deepEqual(result, {
    markdown,
    selectionStart: 0,
    selectionEnd: markdown.length,
  });
});
