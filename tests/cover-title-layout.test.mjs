import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  COVER_FIXED_LABEL_TEXT,
  createCoverTitleLayout,
  selectCoverTitle,
} from "../app/_lib/cover-title-layout.js";

const measureText = (text, fontSize) =>
  Array.from(String(text || "")).reduce((width, char) => {
    if (/\s/.test(char)) return width + fontSize * 0.28;
    if (char.charCodeAt(0) <= 0x7f) return width + fontSize * 0.56;
    return width + fontSize;
  }, 0);

test("selectCoverTitle defaults to the first title candidate", () => {
  assert.equal(
    selectCoverTitle({
      selectedTitle: "",
      titles: ["第一个标题", "第二个标题", "第三个标题"],
      fallback: "备用标题",
    }),
    "第一个标题",
  );
});

test("selectCoverTitle keeps the user selected cover title", () => {
  assert.equal(
    selectCoverTitle({
      selectedTitle: "用户选择的标题",
      titles: ["第一个标题", "第二个标题", "第三个标题"],
      fallback: "备用标题",
    }),
    "用户选择的标题",
  );
});

test("createCoverTitleLayout preserves long mixed titles without ellipsis", () => {
  const title = "Codex 全新 Record&Replay 功能实测：从搭建到真实运行完整指南";
  const layout = createCoverTitleLayout({ title, measureText });

  assert.equal(layout.lines.join("").replace(/\s+/g, ""), title.replace(/\s+/g, ""));
  assert.ok(layout.fontSize >= 46);
  assert.ok(layout.lines.length > 1);
  assert.ok(!layout.lines.some((line) => /…|\.\.\./.test(line)));
});

test("cover canvas no longer draws a fixed label", () => {
  assert.equal(COVER_FIXED_LABEL_TEXT, "");

  const source = readFileSync(new URL("../app/_hooks/use-ai-workflow.ts", import.meta.url), "utf8");
  assert.ok(!source.includes('ctx.fillText("公众号封面"'));
  assert.ok(!source.includes("fillRoundedRect(ctx, 58, 132, 560, 392"));
});
