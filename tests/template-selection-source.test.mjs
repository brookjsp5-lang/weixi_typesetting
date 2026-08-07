import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(resolve(testDir, "../app/page.tsx"), "utf8");
const settingsPaneSource = readFileSync(
  resolve(testDir, "../app/_components/settings-pane.tsx"),
  "utf8",
);
const templateEngineSource = readFileSync(resolve(testDir, "../app/template-engine.ts"), "utf8");

test("default format tweaks let templates use their own theme colors", () => {
  const defaultTweaksMatch = pageSource.match(
    /const DEFAULT_FORMAT_TWEAKS[\s\S]*?};/,
  );

  assert.ok(defaultTweaksMatch, "DEFAULT_FORMAT_TWEAKS should exist");
  assert.doesNotMatch(defaultTweaksMatch[0], /themeColor:\s*"#[0-9a-fA-F]{6}"/);
});

test("selecting a template clears the custom theme color override", () => {
  assert.match(settingsPaneSource, /onSelectTemplate\(template\)/);
  assert.match(pageSource, /setCurrentTemplateId\(template\.id\)/);
  assert.match(pageSource, /themeColor:\s*undefined/);
  assert.doesNotMatch(
    pageSource,
    /themeColor:\s*template\.themeColor/,
  );
});

test("selecting a template category also applies its first template", () => {
  assert.match(settingsPaneSource, /const firstTemplate = cat\.templates\.at\(0\)/);
  assert.match(settingsPaneSource, /if \(firstTemplate\) onSelectTemplate\(firstTemplate\)/);
});

test("selecting a template converts imported WeChat html to Markdown before applying the template", () => {
  assert.match(pageSource, /htmlToMarkdownDraft/);
  assert.match(pageSource, /const handleSelectTemplate = useCallback/);
  assert.match(pageSource, /isWechatImportedHtmlDraft\(inputText\)/);
  assert.match(pageSource, /htmlToMarkdownDraft\(\s*makeImportedHtmlDraftVisible\(inputText\),/);
  assert.match(pageSource, /setNormalizedInputText\(markdown\)/);
});

test("theme template copy explains the category design intent", () => {
  for (const copy of [
    "清爽留白",
    "报告结构",
    "书页质感",
    "浅科技模块",
    "强对比标题",
    "暖色活动感",
  ]) {
    assert.match(settingsPaneSource, new RegExp(copy));
  }
});

test("settings pane tells users why plain drafts may show subtle template differences", () => {
  assert.match(settingsPaneSource, /当前文章结构较少/);
  assert.match(settingsPaneSource, /AI 排版整理标题和重点/);
});

test("template buttons keep repeated descriptions out of visible labels", () => {
  const templateGridMatch = settingsPaneSource.match(
    /<div className="grid grid-cols-3[\s\S]*?\{\/\* 调色板工具 \*\//,
  );

  assert.ok(templateGridMatch, "template button grid should exist");
  assert.doesNotMatch(templateGridMatch[0], /title=\{template\.desc\}/);
  assert.doesNotMatch(templateGridMatch[0], /\{template\.desc\}/);
  assert.match(settingsPaneSource, /currentCategoryDescription/);
});

test("tech theme uses a light article surface while keeping dark terminal code blocks", () => {
  const techCase = templateEngineSource.match(/case "tech":[\s\S]*?default:/)?.[0] ?? "";

  assert.match(techCase, /backgroundColor:\s*"#f8fafc"/);
  assert.match(techCase, /containerStyle:\s*`padding: 20px; background-color: #f8fafc;/);
  assert.match(techCase, /codeContainerStyle:[\s\S]*background-color: #0f172a/);
  assert.doesNotMatch(techCase, /baseStyle:[\s\S]*color:\s*"#e5e7eb"/);
});
