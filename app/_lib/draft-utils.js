const IMAGE_ATTRIBUTE_CANDIDATES = ["src", "data-src", "data-original", "data-actualsrc"];
const HTML_IMAGE_PATTERN = /<img\b[^>]*>/gi;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]\n]*\]\((?:\\.|[^)\n])+\)/g;
const LOCAL_IMAGE_REF_PATTERN = /!\[[^\]\n]*\]\(#([A-Za-z0-9_-]+)\)/g;
const LOCAL_HTML_IMAGE_REF_PATTERN =
  /<img\b[^>]*\b(?:src|data-src)\s*=\s*["']#([A-Za-z0-9_-]+)["'][^>]*>/gi;
const DEFAULT_AUTOSAVE_IMAGE_MAX_BYTES = 12 * 1024 * 1024;

const blockTags = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "DIV",
  "FIGURE",
  "FOOTER",
  "HEADER",
  "MAIN",
  "P",
  "SECTION",
]);

function escapeMarkdownText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMarkdown(markdown) {
  return String(markdown || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isFenceStart(line) {
  return line.trim().match(/^(`{3,}|~{3,})/);
}

function normalizeImageOnlyChunk(chunk) {
  return chunk
    .split(/(\n{2,})/)
    .map((part) => {
      if (/^\n{2,}$/.test(part)) return part;

      const images = part.match(MARKDOWN_IMAGE_PATTERN) || [];
      if (images.length < 2) return part;

      const textWithoutImages = part.replace(MARKDOWN_IMAGE_PATTERN, "").trim();
      if (textWithoutImages) return part;

      const leadingWhitespace = part.match(/^\s*/)?.[0] || "";
      const trailingWhitespace = part.match(/\s*$/)?.[0] || "";
      return `${leadingWhitespace}${images.join("\n\n")}${trailingWhitespace}`;
    })
    .join("");
}

export function normalizeConsecutiveImageBlocks(markdown) {
  const lines = String(markdown || "")
    .replace(/\r\n/g, "\n")
    .split("\n");
  const chunks = [];
  let currentLines = [];
  let inFence = false;
  let fenceMarker = "";

  const pushCurrent = (type) => {
    if (currentLines.length === 0) return;
    chunks.push({ type, text: currentLines.join("\n") });
    currentLines = [];
  };

  for (const line of lines) {
    const fenceStart = isFenceStart(line);

    if (!inFence && fenceStart) {
      pushCurrent("markdown");
      inFence = true;
      fenceMarker = fenceStart[1];
      currentLines.push(line);
      continue;
    }

    currentLines.push(line);

    if (inFence && line.trim().startsWith(fenceMarker)) {
      pushCurrent("code");
      inFence = false;
      fenceMarker = "";
    }
  }

  pushCurrent(inFence ? "code" : "markdown");

  return chunks
    .map((chunk) => (chunk.type === "markdown" ? normalizeImageOnlyChunk(chunk.text) : chunk.text))
    .join("\n");
}

function absoluteUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^\/\//.test(value)) return `https:${value}`;
  return value;
}

function decodeHtmlAttribute(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeHtmlAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getHtmlAttribute(tag, name) {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
  const match = String(tag || "").match(pattern);
  return decodeHtmlAttribute(match?.[2] ?? match?.[3] ?? "");
}

function setHtmlAttribute(tag, name, value) {
  const source = String(tag || "");
  const nextAttribute = `${name}="${escapeHtmlAttribute(value)}"`;
  const pattern = new RegExp(`(\\s)${name}\\s*=\\s*("[^"]*"|'[^']*')`, "i");

  if (pattern.test(source)) {
    return source.replace(pattern, `$1${nextAttribute}`);
  }

  const closing = source.match(/\s*\/?>$/)?.[0] || ">";
  return `${source.slice(0, source.length - closing.length)} ${nextAttribute}${closing}`;
}

export function extractImageSource(element) {
  for (const attribute of IMAGE_ATTRIBUTE_CANDIDATES) {
    const value = element?.getAttribute?.(attribute);
    if (typeof value === "string" && value.trim()) {
      return absoluteUrl(value);
    }
  }
  return "";
}

function extractHtmlImageSource(tag) {
  for (const attribute of IMAGE_ATTRIBUTE_CANDIDATES) {
    const value = getHtmlAttribute(tag, attribute);
    if (value.trim()) {
      return absoluteUrl(value);
    }
  }
  return "";
}

function getAltText(node) {
  return (
    node?.getAttribute?.("alt") ||
    node?.getAttribute?.("title") ||
    node?.getAttribute?.("data-title") ||
    "图片"
  ).trim();
}

function imageToMarkdown(node, createImageRef, state) {
  const src = extractImageSource(node);
  const alt = getAltText(node);

  if (!src || /^blob:/i.test(src)) {
    state.skippedImages += 1;
    return "";
  }

  if (/^data:image\//i.test(src)) {
    return `![${alt}](${createImageRef(src)})`;
  }

  if (/^https?:\/\//i.test(src)) {
    return `![${alt}](${src})`;
  }

  state.skippedImages += 1;
  return "";
}

function inlineChildrenToMarkdown(node, createImageRef, state) {
  return Array.from(node.childNodes || [])
    .map((child) => nodeToMarkdown(child, createImageRef, state, true))
    .join("")
    .replace(/[ \t]{2,}/g, " ");
}

function listItemsToMarkdown(node, createImageRef, state, ordered) {
  return Array.from(node.children || [])
    .filter((child) => child.tagName === "LI")
    .map((child, index) => {
      const text = normalizeMarkdown(inlineChildrenToMarkdown(child, createImageRef, state));
      const marker = ordered ? `${index + 1}.` : "-";
      return text ? `${marker} ${text.replace(/\n/g, "\n  ")}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

function nodeToMarkdown(node, createImageRef, state, inline = false) {
  if (!node) return "";

  if (node.nodeType === 3) {
    return escapeMarkdownText(node.textContent);
  }

  if (node.nodeType !== 1) return "";

  const tag = node.tagName;

  if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return "";

  if (/^H[1-6]$/.test(tag)) {
    const level = Number(tag.slice(1));
    const text = normalizeMarkdown(inlineChildrenToMarkdown(node, createImageRef, state));
    return text ? `${"#".repeat(level)} ${text}\n\n` : "";
  }

  if (tag === "IMG") {
    const imageMarkdown = imageToMarkdown(node, createImageRef, state);
    return imageMarkdown ? `${imageMarkdown}${inline ? "" : "\n\n"}` : "";
  }

  if (tag === "BR") return "\n";

  if (tag === "STRONG" || tag === "B") {
    const text = inlineChildrenToMarkdown(node, createImageRef, state).trim();
    return text ? `**${text}**` : "";
  }

  if (tag === "EM" || tag === "I") {
    const text = inlineChildrenToMarkdown(node, createImageRef, state).trim();
    return text ? `*${text}*` : "";
  }

  if (tag === "DEL" || tag === "S") {
    const text = inlineChildrenToMarkdown(node, createImageRef, state).trim();
    return text ? `~~${text}~~` : "";
  }

  if (tag === "CODE") {
    const text = String(node.textContent || "").trim();
    return text ? `\`${text}\`` : "";
  }

  if (tag === "PRE") {
    const text = String(node.textContent || "").replace(/\n+$/g, "");
    return text ? `\`\`\`\n${text}\n\`\`\`\n\n` : "";
  }

  if (tag === "A") {
    const href = absoluteUrl(node.getAttribute("href") || "");
    const text = inlineChildrenToMarkdown(node, createImageRef, state).trim() || href;
    return href && !/^javascript:/i.test(href) ? `[${text}](${href})` : text;
  }

  if (tag === "BLOCKQUOTE") {
    const text = normalizeMarkdown(inlineChildrenToMarkdown(node, createImageRef, state));
    return text
      ? `${text
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n")}\n\n`
      : "";
  }

  if (tag === "UL" || tag === "OL") {
    const text = listItemsToMarkdown(node, createImageRef, state, tag === "OL");
    return text ? `${text}\n\n` : "";
  }

  if (tag === "LI") {
    return inlineChildrenToMarkdown(node, createImageRef, state);
  }

  const text = inlineChildrenToMarkdown(node, createImageRef, state);
  if (inline) return text;
  if (blockTags.has(tag)) {
    const cleanText = normalizeMarkdown(text);
    return cleanText ? `${cleanText}\n\n` : "";
  }
  return text;
}

function htmlToMarkdownWithDom(html, createImageRef) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  const state = { skippedImages: 0 };
  const root =
    doc.querySelector("article") ||
    doc.querySelector("[data-testid='doc-content']") ||
    doc.querySelector(".lake-content") ||
    doc.body;
  const markdown = Array.from(root.childNodes || [])
    .map((node) => nodeToMarkdown(node, createImageRef, state))
    .join("");
  return {
    markdown: normalizeConsecutiveImageBlocks(normalizeMarkdown(markdown)),
    skippedImages: state.skippedImages,
  };
}

function htmlToMarkdownFallback(html, createImageRef) {
  const state = { skippedImages: 0 };
  const imagePlaceholders = [];
  let content = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<img\b[^>]*>/gi, (match) => {
      const element = {
        getAttribute(name) {
          const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
          return match.match(pattern)?.[1] || "";
        },
      };
      const markdown = imageToMarkdown(element, createImageRef, state);
      const key = `__WX_IMAGE_${imagePlaceholders.length}__`;
      imagePlaceholders.push(markdown);
      return key;
    });

  content = content
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, text) => {
      return `\n\n${"#".repeat(Number(level))} ${stripHtml(text)}\n\n`;
    })
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      return `[${stripHtml(text)}](${absoluteUrl(href)})`;
    })
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `\n- ${stripHtml(text)}`)
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, text) => {
      return `\n\n> ${stripHtml(text)}\n\n`;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article)>/gi, "\n\n");

  content = stripHtml(content);
  for (let index = 0; index < imagePlaceholders.length; index++) {
    content = content.replace(`__WX_IMAGE_${index}__`, imagePlaceholders[index]);
  }

  return {
    markdown: normalizeConsecutiveImageBlocks(normalizeMarkdown(content)),
    skippedImages: state.skippedImages,
  };
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export function htmlToMarkdownDraft(html, createImageRef) {
  if (typeof DOMParser !== "undefined") {
    return htmlToMarkdownWithDom(html, createImageRef);
  }
  return htmlToMarkdownFallback(html, createImageRef);
}

export async function localizeRemoteMarkdownImages(markdown, importRemoteImage, createImageRef) {
  const imagePattern = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
  let nextMarkdown = "";
  let lastIndex = 0;
  let localizedCount = 0;
  let failedCount = 0;

  for (const match of markdown.matchAll(imagePattern)) {
    const [fullMatch, alt, url] = match;
    const index = match.index ?? 0;
    nextMarkdown += markdown.slice(lastIndex, index);

    try {
      const dataUrl = await importRemoteImage(url);
      if (typeof dataUrl === "string" && /^data:image\//i.test(dataUrl)) {
        nextMarkdown += `![${alt}](${createImageRef(dataUrl)})`;
        localizedCount += 1;
      } else {
        nextMarkdown += fullMatch;
        failedCount += 1;
      }
    } catch {
      nextMarkdown += fullMatch;
      failedCount += 1;
    }

    lastIndex = index + fullMatch.length;
  }

  nextMarkdown += markdown.slice(lastIndex);

  return {
    markdown: normalizeConsecutiveImageBlocks(nextMarkdown),
    localizedCount,
    failedCount,
  };
}

export async function localizeRemoteHtmlImages(html, importRemoteImage, createImageRef) {
  const source = String(html || "");
  let nextHtml = "";
  let lastIndex = 0;
  let localizedCount = 0;
  let failedCount = 0;

  for (const match of source.matchAll(HTML_IMAGE_PATTERN)) {
    const fullMatch = match[0];
    const index = match.index ?? 0;
    const src = extractHtmlImageSource(fullMatch);
    let nextImageTag = fullMatch;

    nextHtml += source.slice(lastIndex, index);

    if (!src || /^blob:/i.test(src)) {
      if (src) failedCount += 1;
      nextHtml += nextImageTag;
      lastIndex = index + fullMatch.length;
      continue;
    }

    if (/^data:image\//i.test(src)) {
      nextImageTag = setHtmlAttribute(nextImageTag, "src", createImageRef(src));
      localizedCount += 1;
    } else if (/^https?:\/\//i.test(src)) {
      try {
        const dataUrl = await importRemoteImage(src);
        if (typeof dataUrl === "string" && /^data:image\//i.test(dataUrl)) {
          nextImageTag = setHtmlAttribute(nextImageTag, "src", createImageRef(dataUrl));
          localizedCount += 1;
        } else {
          if (!getHtmlAttribute(nextImageTag, "src")) {
            nextImageTag = setHtmlAttribute(nextImageTag, "src", src);
          }
          failedCount += 1;
        }
      } catch {
        if (!getHtmlAttribute(nextImageTag, "src")) {
          nextImageTag = setHtmlAttribute(nextImageTag, "src", src);
        }
        failedCount += 1;
      }
    } else {
      failedCount += 1;
    }

    nextHtml += nextImageTag;
    lastIndex = index + fullMatch.length;
  }

  nextHtml += source.slice(lastIndex);

  return {
    html: nextHtml,
    localizedCount,
    failedCount,
  };
}

export function serializeImageMap(imageMap) {
  return Array.from(imageMap || []).map(([id, dataUrl]) => ({ id, dataUrl }));
}

function getReferencedLocalImageIds(markdown) {
  const ids = [];
  const seen = new Set();
  const source = String(markdown || "");

  const addId = (id) => {
    if (!seen.has(id)) {
      ids.push(id);
      seen.add(id);
    }
  };

  for (const match of source.matchAll(LOCAL_IMAGE_REF_PATTERN)) {
    addId(match[1]);
  }

  for (const match of source.matchAll(LOCAL_HTML_IMAGE_REF_PATTERN)) {
    addId(match[1]);
  }

  return ids;
}

export function serializeAutosaveImageMap(imageMap, markdown, options = {}) {
  const maxTotalBytes = Number.isFinite(options.maxTotalBytes)
    ? Math.max(0, options.maxTotalBytes)
    : DEFAULT_AUTOSAVE_IMAGE_MAX_BYTES;
  const items = [];
  let totalBytes = 0;

  for (const id of getReferencedLocalImageIds(markdown)) {
    const dataUrl = imageMap?.get?.(id);
    if (typeof dataUrl !== "string" || !dataUrl) continue;

    const nextTotalBytes = totalBytes + dataUrl.length;
    if (nextTotalBytes > maxTotalBytes) continue;

    items.push({ id, dataUrl });
    totalBytes = nextTotalBytes;
  }

  return items;
}

export function deserializeImageMap(items) {
  if (!Array.isArray(items)) return new Map();
  return new Map(
    items
      .filter((item) => item && typeof item.id === "string" && typeof item.dataUrl === "string")
      .map((item) => [item.id, item.dataUrl]),
  );
}
