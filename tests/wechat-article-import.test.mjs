import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  extractWechatArticleHtml,
  normalizeWechatArticleUrl,
} from "../app/_lib/wechat-article-import.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const routeSource = readFileSync(
  resolve(testDir, "../app/api/import-wechat-article/route.ts"),
  "utf8",
);
const editorSource = readFileSync(
  resolve(testDir, "../app/_components/markdown-editor-pane.tsx"),
  "utf8",
);
const markdownToolsSource = readFileSync(
  resolve(testDir, "../app/_hooks/use-markdown-tools.ts"),
  "utf8",
);

test("normalizeWechatArticleUrl accepts only public WeChat article urls", () => {
  assert.equal(
    normalizeWechatArticleUrl("https://mp.weixin.qq.com/s/example").url,
    "https://mp.weixin.qq.com/s/example",
  );
  assert.equal(normalizeWechatArticleUrl("https://example.com/post").error, "请填写微信公众号文章链接");
  assert.equal(normalizeWechatArticleUrl("http://127.0.0.1:3000/post").error, "不支持导入本地或内网地址");
});

test("extractWechatArticleHtml keeps WeChat title body images and inline formatting", () => {
  const result = extractWechatArticleHtml(
    `<!doctype html>
    <html>
      <head><meta property="og:title" content="公众号标题"></head>
      <body>
        <h1 id="activity-name">页面标题</h1>
        <div id="js_content" class="rich_media_content">
          <p>第一段 <strong>重点</strong></p>
          <section><img data-src="https://mmbiz.qpic.cn/mmbiz_png/demo/0" alt="配图"></section>
          <blockquote>引用内容</blockquote>
        </div>
      </body>
    </html>`,
  );

  assert.equal(result.title, "页面标题");
  assert.match(result.html, /<h1>页面标题<\/h1>/);
  assert.match(result.html, /第一段/);
  assert.match(result.html, /<strong>重点<\/strong>/);
  assert.match(result.html, /data-src="https:\/\/mmbiz\.qpic\.cn\/mmbiz_png\/demo\/0"/);
  assert.match(result.html, /引用内容/);
});

test("import WeChat article route fetches html without caching", () => {
  assert.match(routeSource, /export async function POST/);
  assert.match(routeSource, /normalizeWechatArticleUrl/);
  assert.match(routeSource, /fetch\(articleUrl/);
  assert.match(routeSource, /cache:\s*"no-store"/);
  assert.match(routeSource, /extractWechatArticleHtml/);
});

test("draft pane exposes WeChat article link import controls", () => {
  assert.match(editorSource, /wechatArticleUrl/);
  assert.match(editorSource, /公众号链接/);
  assert.match(editorSource, /导入公众号/);
  assert.match(editorSource, /onImportWechatArticle/);
});

test("markdown tools import WeChat html through existing draft conversion pipeline", () => {
  assert.match(markdownToolsSource, /importWechatArticle/);
  assert.match(markdownToolsSource, /\/api\/import-wechat-article/);
  assert.match(markdownToolsSource, /htmlToMarkdownDraft/);
  assert.match(markdownToolsSource, /localizeRemoteMarkdownImages/);
  assert.match(markdownToolsSource, /setInputText\(markdownToImport\)/);
});
