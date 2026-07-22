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

test("default format tweaks let templates use their own theme colors", () => {
  const defaultTweaksMatch = pageSource.match(
    /const DEFAULT_FORMAT_TWEAKS[\s\S]*?};/,
  );

  assert.ok(defaultTweaksMatch, "DEFAULT_FORMAT_TWEAKS should exist");
  assert.doesNotMatch(defaultTweaksMatch[0], /themeColor:\s*"#[0-9a-fA-F]{6}"/);
});

test("selecting a template clears the custom theme color override", () => {
  assert.match(settingsPaneSource, /setCurrentTemplateId\(template\.id\)/);
  assert.match(settingsPaneSource, /updateFormatTweaks\("themeColor",\s*undefined\)/);
  assert.doesNotMatch(
    settingsPaneSource,
    /updateFormatTweaks\("themeColor",\s*template\.themeColor\)/,
  );
});
