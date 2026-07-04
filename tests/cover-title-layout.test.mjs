import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  COVER_FIXED_LABEL_TEXT,
  DEFAULT_COVER_TITLE_STYLE,
  createCoverTitleArea,
  createCoverTitleLayout,
  isCoverTitleOverlayEnabled,
  normalizeCoverTitleStyle,
  selectCoverTitle,
} from "../app/_lib/cover-title-layout.js";

const measureText = (text, fontSize) =>
  Array.from(String(text || "")).reduce((width, char) => {
    if (/\s/.test(char)) return width + fontSize * 0.28;
    if (char.charCodeAt(0) <= 0x7f) return width + fontSize * 0.56;
    return width + fontSize;
  }, 0);

const firstTitle = "\u7b2c\u4e00\u4e2a\u6807\u9898";
const secondTitle = "\u7b2c\u4e8c\u4e2a\u6807\u9898";
const thirdTitle = "\u7b2c\u4e09\u4e2a\u6807\u9898";
const fallbackTitle = "\u5907\u7528\u6807\u9898";
const selectedTitle = "\u7528\u6237\u9009\u62e9\u7684\u6807\u9898";

test("selectCoverTitle defaults to the first title candidate", () => {
  assert.equal(
    selectCoverTitle({
      selectedTitle: "",
      titles: [firstTitle, secondTitle, thirdTitle],
      fallback: fallbackTitle,
    }),
    firstTitle,
  );
});

test("selectCoverTitle keeps the user selected cover title", () => {
  assert.equal(
    selectCoverTitle({
      selectedTitle,
      titles: [firstTitle, secondTitle, thirdTitle],
      fallback: fallbackTitle,
    }),
    selectedTitle,
  );
});

test("createCoverTitleLayout preserves long mixed titles without ellipsis", () => {
  const title =
    "Codex \u5168\u65b0 Record&Replay \u529f\u80fd\u5b9e\u6d4b\uff1a\u4ece\u642d\u5efa\u5230\u771f\u5b9e\u8fd0\u884c\u5b8c\u6574\u6307\u5357";
  const layout = createCoverTitleLayout({ title, measureText });

  assert.equal(layout.lines.join("").replace(/\s+/g, ""), title.replace(/\s+/g, ""));
  assert.ok(layout.fontSize >= 46);
  assert.ok(layout.lines.length > 1);
  assert.ok(!layout.lines.some((line) => /\u2026|\.\.\./.test(line)));
});

test("createCoverTitleLayout balances medium Chinese titles and avoids leading punctuation", () => {
  const title =
    "\u6211\u7528 Codex \u5f55\u5236\u56de\u653e\uff0c\u628a\u6bcf\u5468\u91cd\u590d\u5de5\u4f5c\u5168\u81ea\u52a8\u5316\u4e86";
  const layout = createCoverTitleLayout({ title, measureText });

  assert.deepEqual(layout.lines, [
    "\u6211\u7528 Codex \u5f55\u5236\u56de\u653e\uff0c",
    "\u628a\u6bcf\u5468\u91cd\u590d\u5de5\u4f5c\u5168\u81ea\u52a8\u5316\u4e86",
  ]);
  assert.ok(layout.fontSize <= 60);
  assert.ok(!layout.lines.some((line) => /^[\uFF0C\u3002\uFF01\uFF1F\u3001\uFF1B\uFF1A,.!?:;]/.test(line)));
});

test("createCoverTitleArea converts style percentages into canvas title area", () => {
  const style = normalizeCoverTitleStyle({
    xPercent: 12,
    yPercent: 20,
    widthPercent: 45,
    textColor: "#123abc",
    strokeColor: "#f8fafc",
  });
  const area = createCoverTitleArea(style);
  const layout = createCoverTitleLayout({
    title: "\u81ea\u5b9a\u4e49\u6807\u9898\u4f4d\u7f6e",
    measureText,
    area,
  });

  assert.equal(area.x, 144);
  assert.equal(area.y, 135);
  assert.equal(area.width, 540);
  assert.equal(layout.x, 144);
  assert.ok(layout.y > 132);
});

test("normalizeCoverTitleStyle falls back to safe defaults", () => {
  assert.deepEqual(
    normalizeCoverTitleStyle({
      xPercent: -20,
      yPercent: 120,
      widthPercent: 5,
      textColor: "red",
      strokeColor: "#fff",
      titleEnabled: "no",
    }),
    {
      ...DEFAULT_COVER_TITLE_STYLE,
      xPercent: 0,
      yPercent: 70,
      widthPercent: 30,
    },
  );
});

test("normalizeCoverTitleStyle keeps the title overlay enabled by default", () => {
  assert.equal(DEFAULT_COVER_TITLE_STYLE.titleEnabled, true);
  assert.equal(normalizeCoverTitleStyle({}).titleEnabled, true);
});

test("normalizeCoverTitleStyle can disable the title overlay", () => {
  assert.equal(normalizeCoverTitleStyle({ titleEnabled: false }).titleEnabled, false);
  assert.equal(isCoverTitleOverlayEnabled({ titleEnabled: false }), false);
  assert.equal(isCoverTitleOverlayEnabled({}), true);
});

test("cover canvas no longer draws a fixed label", () => {
  assert.equal(COVER_FIXED_LABEL_TEXT, "");

  const source = readFileSync(new URL("../app/_hooks/use-ai-workflow.ts", import.meta.url), "utf8");
  assert.ok(!source.includes('ctx.fillText("\u516c\u4f17\u53f7\u5c01\u9762"'));
  assert.ok(!source.includes("fillRoundedRect(ctx, 58, 132, 560, 392"));
});
