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
const siteConfigSource = readFileSync(resolve(testDir, "../lib/site-config.ts"), "utf8");
const formatterConstantsSource = readFileSync(
  resolve(testDir, "../app/_lib/formatter-constants.ts"),
  "utf8",
);

function getFoodPaletteValues(source) {
  const paletteMatch = source.match(/food:\s*\[([\s\S]*?)\],\s*\n};/);
  assert.ok(paletteMatch, "food palette should exist");
  return paletteMatch[1].match(/#[0-9a-fA-F]{6}/g) ?? [];
}

function getFoodNameValues(source) {
  const namesMatch = source.match(/const foodNames = \[([\s\S]*?)\];/);
  assert.ok(namesMatch, "food template names should exist");
  return [...namesMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function getFoodTextColors(source) {
  const colorMapMatch = source.match(/const foodTextColors: Record<string, string> = \{([\s\S]*?)\};/);
  assert.ok(colorMapMatch, "food text color map should exist");
  return [...colorMapMatch[1].matchAll(/"#[0-9a-fA-F]{6}":\s*"(#[0-9a-fA-F]{6})"/g)]
    .map((match) => match[1]);
}

function getCategoryIds(source) {
  const categoriesMatch = source.match(/const categoriesList = \[([\s\S]*?)\];/);
  assert.ok(categoriesMatch, "template categories should exist");
  return [...categoriesMatch[1].matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
}

function getGeneratedCategoryBlock(source, category) {
  const generationMatch = source.match(
    new RegExp(`colorPalettes\\.${category}\\.forEach\\(\\(color, i\\) => \\{([\\s\\S]*?)\\n  \\}\\);`),
  );
  assert.ok(generationMatch, `${category} template generation should exist`);
  return generationMatch[1];
}

function getContrastRatio(foreground, background) {
  const toRgb = (hex) => [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset + 1, offset + 3), 16) / 255);
  const toLuminance = (hex) => toRgb(hex)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const [lighter, darker] = [toLuminance(foreground), toLuminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

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

test("food templates register twelve recipe-focused styles", () => {
  assert.match(templateEngineSource, /\{ id: "food", name: "\u7f8e\u98df\u98ce" \}/);
  assert.match(templateEngineSource, /colorPalettes\.food\.forEach/);
  assert.match(templateEngineSource, /case "food":/);
  assert.match(templateEngineSource, /String\(num\)\.padStart\(2, "0"\)/);
  assert.equal(getFoodPaletteValues(templateEngineSource).length, 12);
  assert.deepEqual(getFoodNameValues(templateEngineSource), [
    "番茄", "黄油", "抹茶", "海盐", "香辣", "菌菇",
    "蜜桃", "柚子", "焦糖", "柠檬", "蓝莓", "芝麻",
  ]);
  const foodGeneration = getGeneratedCategoryBlock(templateEngineSource, "food");
  assert.match(foodGeneration, /result\.push\(\{/);
  assert.match(foodGeneration, /id: `food-\$\{i\}`/);
  assert.match(foodGeneration, /name: foodNames\[i\]/);
  assert.match(foodGeneration, /category: "food"/);
  assert.match(settingsPaneSource, /food: "\u6696\u98df\u914d\u8272\u4e0e\u6e05\u6670\u6b65\u9aa4/);
});

test("template generation remains seven categories and eighty-four templates", () => {
  const categoryIds = getCategoryIds(templateEngineSource);
  const paletteKeys = ["neoBrutalism", "minimalist", "business", "literary", "tech", "festive", "food"];

  assert.deepEqual(categoryIds, [
    "neo-brutalism", "minimalist", "business", "literary", "tech", "festive", "food",
  ]);
  assert.equal(paletteKeys.reduce((total, key) => {
    const paletteMatch = templateEngineSource.match(
      new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\],`),
    );
    assert.ok(paletteMatch, `${key} palette should exist`);
    return total + (paletteMatch[1].match(/#[0-9a-fA-F]{6}/g) ?? []).length;
  }, 0), 84);
  assert.equal(categoryIds.length, 7);
});

test("food text accents remain readable on the warm recipe surface", () => {
  const textColors = getFoodTextColors(templateEngineSource);

  assert.equal(textColors.length, 12);
  assert.ok(textColors.every((color) => getContrastRatio(color, "#fff9f4") >= 4.5));
  assert.match(templateEngineSource, /blockquoteInnerBefore:[\s\S]*color: \$\{foodTextColor\}/);
  assert.match(templateEngineSource, /emStyle: `font-style: normal; color: \$\{foodTextColor\};`/);
  assert.match(templateEngineSource, /linkStyle: `color: \$\{foodTextColor\};/);
  assert.match(templateEngineSource, /color: \$\{foodTextColor\}; font-size: 12px; font-weight: 800/);
});

test("public template copy describes seven categories and eighty-four templates", () => {
  assert.match(siteConfigSource, /84 \u5957/);
  assert.match(siteConfigSource, /7 \u5927\u7c7b/);
  assert.match(formatterConstantsSource, /84 \u5957\u516c\u4f17\u53f7\u6a21\u677f/);
});
