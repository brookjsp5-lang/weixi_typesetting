import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const templateEngineSource = readFileSync(resolve(testDir, "../app/template-engine.ts"), "utf8");
const settingsPaneSource = readFileSync(
  resolve(testDir, "../app/_components/settings-pane.tsx"),
  "utf8",
);
const formatterConstantsSource = readFileSync(
  resolve(testDir, "../app/_lib/formatter-constants.ts"),
  "utf8",
);
const siteConfigSource = readFileSync(resolve(testDir, "../lib/site-config.ts"), "utf8");
const jsonLdSource = readFileSync(resolve(testDir, "../app/json-ld.tsx"), "utf8");
const aboutSectionSource = readFileSync(
  resolve(testDir, "../app/_components/about-section.tsx"),
  "utf8",
);
const readmeSource = readFileSync(resolve(testDir, "../README.md"), "utf8");
const agentsSource = readFileSync(resolve(testDir, "../AGENTS.md"), "utf8");

function getPaletteColors(paletteName) {
  const paletteMatch = templateEngineSource.match(
    new RegExp(`${paletteName}:\\s*\\[([\\s\\S]*?)\\]`),
  );

  assert.ok(paletteMatch, `${paletteName} palette should exist`);
  return paletteMatch[1].match(/#[0-9a-fA-F]{6}/g) || [];
}

test("template catalog includes 12 food-journal and 12 pet-sticker templates", () => {
  assert.equal(getPaletteColors("foodJournal").length, 12);
  assert.equal(getPaletteColors("petSticker").length, 12);

  assert.match(templateEngineSource, /id: "food-journal", name: "好味手帐"/);
  assert.match(templateEngineSource, /id: "pet-sticker", name: "宠物贴贴社"/);
  assert.match(templateEngineSource, /case "food-journal":/);
  assert.match(templateEngineSource, /case "pet-sticker":/);
  assert.match(templateEngineSource, /id: `food-journal-\$\{i\}`/);
  assert.match(templateEngineSource, /id: `pet-sticker-\$\{i\}`/);
});

test("food-journal and pet-sticker use distinct WeChat-safe inline visual language", () => {
  const foodCase =
    templateEngineSource.match(/case "food-journal":[\s\S]*?case "pet-sticker":/)?.[0] || "";
  const petCase = templateEngineSource.match(/case "pet-sticker":[\s\S]*?default:/)?.[0] || "";

  assert.match(foodCase, /backgroundColor: "#fff8ee"/);
  assert.match(foodCase, /border-top: 2px dashed/);
  assert.match(foodCase, /background-color: #fffdf7/);
  assert.match(foodCase, /h1Badge:[\s\S]*TODAY'S MENU/);
  assert.match(petCase, /backgroundColor: "#fffdf7"/);
  assert.match(petCase, /border: 2px solid/);
  assert.match(petCase, /font-weight: 900/);
  assert.match(petCase, /h1Badge:[\s\S]*PAW CLUB/);
  assert.match(templateEngineSource, /template\.h1Badge \? template\.h1Badge : ""/);
});

test("template selector and product copy describe the expanded 96-template catalog", () => {
  assert.match(settingsPaneSource, /"food-journal": "暖食材色和便签分隔/);
  assert.match(settingsPaneSource, /"pet-sticker": "明快贴纸框和小爪标记/);

  for (const source of [
    formatterConstantsSource,
    siteConfigSource,
    jsonLdSource,
    aboutSectionSource,
    readmeSource,
    agentsSource,
  ]) {
    assert.match(source, /96 套/);
    assert.match(source, /8 大(?:类|风格分类)/);
  }
});
