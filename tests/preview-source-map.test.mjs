import assert from "node:assert/strict";
import test from "node:test";

const sourceMap = await import("../app/_lib/preview-source-map.js").catch(() => null);

function annotate(markdown) {
  assert.ok(sourceMap, "preview source mapper should be available");
  return sourceMap.annotateMarkdownWithSourceAnchors(markdown);
}

function attach(html) {
  assert.ok(sourceMap, "preview source mapper should be available");
  return sourceMap.attachSourceAnchorsToPreviewHtml(html);
}

test("annotateMarkdownWithSourceAnchors maps headings, paragraphs, and lists to their source starts", () => {
  const result = annotate("# 标题\n\n正文\n\n- 项目\n- 第二项");

  assert.equal(
    result,
    "<!--typezen-source:0-->\n# 标题\n\n<!--typezen-source:6-->\n正文\n\n<!--typezen-source:10-->\n- 项目\n- 第二项",
  );
});

test("annotateMarkdownWithSourceAnchors keeps fenced code together as one hover target", () => {
  const result = annotate("```md\n# 代码标题\n```\n\n正文");

  assert.deepEqual(result.match(/<!--typezen-source:\d+-->/g), [
    "<!--typezen-source:0-->",
    "<!--typezen-source:18-->",
  ]);
  assert.doesNotMatch(result, /<!--typezen-source:6-->/);
});

test("attachSourceAnchorsToPreviewHtml puts source anchors on rendered preview blocks", () => {
  const result = attach(
    "<!--typezen-source:0-->\n<section class=\"heading\">标题</section>\n<!--typezen-source:8-->\n<p>正文</p>",
  );

  assert.equal(
    result,
    '<section data-typezen-source-start="0" class="heading">标题</section>\n<p data-typezen-source-start="8">正文</p>',
  );
});
