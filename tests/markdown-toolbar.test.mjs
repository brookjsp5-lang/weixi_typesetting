import assert from "node:assert/strict";
import test from "node:test";

const inlineUtils = await import("../app/_lib/markdown-inline.js").catch(() => null);
const shortcutUtils = await import("../app/_lib/markdown-shortcut.js").catch(() => null);

function insertInline(markdown, selectionStart, selectionEnd, prefix, suffix, placeholder) {
  assert.ok(inlineUtils, "inline formatting utility should be available");
  return inlineUtils.insertInlineMarkdown(
    markdown,
    selectionStart,
    selectionEnd,
    prefix,
    suffix,
    placeholder,
  );
}

function getShortcutAction(event) {
  assert.ok(shortcutUtils, "markdown shortcut utility should be available");
  return shortcutUtils.getMarkdownShortcutAction(event);
}

test("inline toolbar formatting preserves the selected text after adding markers", () => {
  assert.deepEqual(insertInline("一段文本", 0, 4, "**", "**", "加粗"), {
    markdown: "**一段文本**",
    selectionStart: 2,
    selectionEnd: 6,
  });
});

test("inline toolbar formatting selects its placeholder for immediate replacement", () => {
  assert.deepEqual(insertInline("", 0, 0, "*", "*", "斜体"), {
    markdown: "*斜体*",
    selectionStart: 1,
    selectionEnd: 3,
  });
});

test("markdown toolbar recognises Ctrl or Command shortcuts for bold and italic only", () => {
  assert.equal(getShortcutAction({ ctrlKey: true, metaKey: false, altKey: false, key: "b" }), "bold");
  assert.equal(getShortcutAction({ ctrlKey: false, metaKey: true, altKey: false, key: "I" }), "italic");
  assert.equal(getShortcutAction({ ctrlKey: true, metaKey: false, altKey: true, key: "b" }), null);
  assert.equal(getShortcutAction({ ctrlKey: false, metaKey: false, altKey: false, key: "b" }), null);
});
