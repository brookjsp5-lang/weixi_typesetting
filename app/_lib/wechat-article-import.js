const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^\[?::1\]?$/i,
];

const WECHAT_ARTICLE_HOST_PATTERN = /^mp\.weixin\.qq\.com$/i;

const isBlockedHost = (hostname) =>
  PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));

const decodeHtmlEntities = (value) =>
  String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const stripTags = (html) =>
  decodeHtmlEntities(String(html || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function normalizeWechatArticleUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return { url: "", error: "请填写微信公众号文章链接" };

  let articleUrl;
  try {
    articleUrl = new URL(value);
  } catch {
    return { url: "", error: "公众号文章链接格式不正确" };
  }

  if (articleUrl.protocol !== "http:" && articleUrl.protocol !== "https:") {
    return { url: "", error: "只支持导入 http 或 https 链接" };
  }

  if (isBlockedHost(articleUrl.hostname)) {
    return { url: "", error: "不支持导入本地或内网地址" };
  }

  if (!WECHAT_ARTICLE_HOST_PATTERN.test(articleUrl.hostname)) {
    return { url: "", error: "请填写微信公众号文章链接" };
  }

  return { url: articleUrl.toString(), error: "" };
}

function findOpeningTagById(html, id) {
  const pattern = new RegExp(`<([a-z][a-z0-9:-]*)\\b[^>]*\\bid=["']${id}["'][^>]*>`, "i");
  const match = pattern.exec(html);
  if (!match) return null;
  return {
    tagName: match[1].toLowerCase(),
    start: match.index,
    openEnd: match.index + match[0].length,
  };
}

function extractElementById(html, id) {
  const source = String(html || "");
  const opening = findOpeningTagById(source, id);
  if (!opening) return "";

  const tagPattern = new RegExp(`</?${opening.tagName}\\b[^>]*>`, "gi");
  let depth = 1;

  for (const match of source.slice(opening.openEnd).matchAll(tagPattern)) {
    const fullMatch = match[0];
    const absoluteIndex = opening.openEnd + (match.index ?? 0);

    if (fullMatch.startsWith("</")) {
      depth -= 1;
      if (depth === 0) return source.slice(opening.openEnd, absoluteIndex);
    } else if (!fullMatch.endsWith("/>")) {
      depth += 1;
    }
  }

  return source.slice(opening.openEnd);
}

function extractMetaContent(html, property) {
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*(?:property|name)=["']${property}["'])(?=[^>]*content=["']([^"']*)["'])[^>]*>`,
    "i",
  );
  return decodeHtmlEntities(pattern.exec(html)?.[1] || "").trim();
}

function extractWechatTitle(html) {
  const activityTitle = extractElementById(html, "activity-name");
  const title = stripTags(activityTitle);
  if (title) return title;

  const ogTitle = extractMetaContent(html, "og:title");
  if (ogTitle) return ogTitle;

  const titleMatch = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return stripTags(titleMatch?.[1] || "");
}

export function extractWechatArticleHtml(html) {
  const source = String(html || "");
  const title = extractWechatTitle(source);
  const content =
    extractElementById(source, "js_content") ||
    extractElementById(source, "img-content") ||
    extractElementById(source, "page-content");
  const fallbackBody = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || source;
  const articleHtml = (content || fallbackBody).trim();
  const htmlWithTitle = title ? `<h1>${escapeHtml(title)}</h1>\n${articleHtml}` : articleHtml;

  return {
    title,
    html: htmlWithTitle.trim(),
  };
}
