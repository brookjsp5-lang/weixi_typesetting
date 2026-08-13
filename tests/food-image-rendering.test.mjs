import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, "..");
const formatTweaks = {
  fontSize: 16,
  lineHeight: 1.8,
  paragraphSpacing: 16,
  firstLineIndent: false,
  pagePaddingTop: 16,
  pagePaddingRight: 16,
  pagePaddingBottom: 16,
  pagePaddingLeft: 16,
  letterSpacing: 0,
  imageRadius: 8,
  h1Layout: "center",
  h2Layout: "left",
};

function render(templateId, markdown) {
  const program = `
    import { allTemplates, renderArticle } from "./app/template-engine.ts";
    const template = allTemplates.find((candidate) => candidate.id === ${JSON.stringify(templateId)});
    if (!template) throw new Error("Missing template: ${templateId}");
    process.stdout.write(JSON.stringify(renderArticle(${JSON.stringify(markdown)}, template, ${JSON.stringify(formatTweaks)})));
  `;

  return JSON.parse(execFileSync(process.execPath, [
    "--experimental-transform-types",
    "--input-type=module",
    "--eval",
    program,
  ], {
    cwd: projectRoot,
    encoding: "utf8",
  }));
}

test("food single-image paragraphs add the menu label without block content inside p", () => {
  const html = render("food-0", "![单图](https://example.com/one.jpg)");

  assert.match(html, /MENU_IMAGE · 主厨推荐/);
  assert.match(html, /background-color: #fff9f4/);
  assert.match(html, /max-width: 100%/);
  assert.match(html, /border-radius: 8px/);
  assert.doesNotMatch(html, /<p[^>]*>\s*<section/i);
});

test("food multi-image paragraphs keep one label per image in the inline-block row", () => {
  const html = render(
    "food-0",
    "![第一张](https://example.com/one.jpg)\n![第二张](https://example.com/two.jpg)",
  );

  assert.equal((html.match(/MENU_IMAGE · 主厨推荐/g) ?? []).length, 2);
  assert.equal((html.match(/display: inline-block; width: 48\.5%/g) ?? []).length, 2);
  assert.match(html, /background-color: #fff9f4/);
  assert.match(html, /border-radius: 8px/);
  assert.doesNotMatch(html, /<p[^>]*>\s*<section/i);
});

test("non-food images do not emit food menu image labels", () => {
  const html = render("minimalist-0", "![对照](https://example.com/control.jpg)");

  assert.doesNotMatch(html, /MENU_IMAGE/);
});
