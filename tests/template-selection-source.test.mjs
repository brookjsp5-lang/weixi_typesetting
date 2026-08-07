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

test("theme templates use layout variants instead of color-only variants", () => {
  assert.match(templateEngineSource, /variant:\s*number/);
  assert.equal((templateEngineSource.match(/variant:\s*i % 3/g) || []).length, 6);
  assert.match(
    templateEngineSource,
    /getStylesByCategory\(\s*baseTemplate\.category,\s*formatTweaks\.themeColor,\s*baseTemplate\.variant,?\s*\)/,
  );
});

test("non-festive themes expose distinctive visual treatment markers", () => {
  for (const marker of [
    "brutalParagraphStyle",
    "minimalistParagraphStyle",
    "businessParagraphStyle",
    "literaryParagraphStyle",
    "techParagraphStyle",
  ]) {
    assert.match(templateEngineSource, new RegExp(marker));
  }
});
