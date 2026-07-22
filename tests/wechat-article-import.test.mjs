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
const pageSource = readFileSync(resolve(testDir, "../app/page.tsx"), "utf8");

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
        <div id="js_content" class="rich_media_content" style="background-color:#f7f4ef">
          <p style="text-align:center">第一段 <strong>重点</strong></p>
          <section style="border-top:1px solid #f4b26b"><img data-src="https://mmbiz.qpic.cn/mmbiz_png/demo/0" alt="配图"></section>
          <blockquote>引用内容</blockquote>
        </div>
      </body>
    </html>`,
  );

  assert.equal(result.title, "页面标题");
  assert.match(result.html, /<h1 id="activity-name">页面标题<\/h1>/);
  assert.match(result.html, /id="js_content"/);
  assert.match(result.html, /background-color:#f7f4ef/);
  assert.match(result.html, /text-align:center/);
  assert.match(result.html, /border-top:1px solid #f4b26b/);
  assert.match(result.html, /第一段/);
  assert.match(result.html, /<strong>重点<\/strong>/);
  assert.match(result.html, /data-src="https:\/\/mmbiz\.qpic\.cn\/mmbiz_png\/demo\/0"/);
  assert.match(result.html, /引用内容/);
});

test("extractWechatArticleHtml makes WeChat js-hidden content visible after import", () => {
  const result = extractWechatArticleHtml(
    `<!doctype html>
    <html>
      <body>
        <h1 id="activity-name">页面标题</h1>
        <div id="js_content" style="visibility: hidden; opacity: 0;">
          <p>正文应该可见</p>
        </div>
      </body>
    </html>`,
  );

  assert.match(result.html, /id="js_content"/);
  assert.match(result.html, /正文应该可见/);
  assert.doesNotMatch(result.html, /visibility:\s*hidden/i);
  assert.doesNotMatch(result.html, /opacity:\s*0\b/i);
  assert.match(result.html, /visibility:\s*visible/i);
  assert.match(result.html, /opacity:\s*1/i);
});

test("import WeChat article route fetches html without caching", () => {
  assert.match(routeSource, /export async function POST/);
  assert.match(routeSource, /normalizeWechatArticleUrl/);
  assert.match(routeSource, /fetch\(articleUrl/);
  assert.match(routeSource, /cache:\s*"no-store"/);
  assert.match(routeSource, /Mozilla\/5\.0 \(Windows NT 10\.0; Win64; x64\)/);
  assert.match(routeSource, /Referer:\s*"https:\/\/mp\.weixin\.qq\.com\/"/);
  assert.match(routeSource, /extractWechatArticleHtml/);
});

test("draft pane exposes WeChat article link import controls", () => {
  assert.match(editorSource, /wechatArticleUrl/);
  assert.match(editorSource, /公众号链接/);
  assert.match(editorSource, /导入公众号/);
  assert.match(editorSource, /onImportWechatArticle/);
});

test("draft pane renders imported WeChat html as visual editable content", () => {
  assert.match(editorSource, /isWechatImportedHtmlDraft/);
  assert.match(editorSource, /contentEditable/);
  assert.match(editorSource, /dangerouslySetInnerHTML/);
  assert.match(editorSource, /onInput/);
});

test("markdown tools import WeChat html as layout-preserving raw html", () => {
  assert.match(markdownToolsSource, /importWechatArticle/);
  assert.match(markdownToolsSource, /\/api\/import-wechat-article/);
  assert.match(markdownToolsSource, /localizeRemoteHtmlImages/);
  assert.match(markdownToolsSource, /setInputText\(htmlToImport\)/);
  assert.doesNotMatch(markdownToolsSource, /const result = htmlToMarkdownDraft\(article\.html/);
});

test("page resolves local image refs inside imported raw html", () => {
  assert.match(pageSource, /replaceLocalImageRefs/);
  assert.match(pageSource, /<img\\b\[\^>\]\*\\bsrc=/);
});

test("page bypasses markdown templates for imported WeChat html drafts", () => {
  assert.match(pageSource, /isWechatImportedHtmlDraft/);
  assert.match(pageSource, /processedText/);
  assert.match(pageSource, /return `<section style="width: 100%; max-width: 100%; box-sizing: border-box;">\$\{processedText\}<\/section>`/);
});
