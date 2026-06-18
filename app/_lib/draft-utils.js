const IMAGE_ATTRIBUTE_CANDIDATES = ["src", "data-src", "data-original", "data-actualsrc"];

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

function absoluteUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^\/\//.test(value)) return `https:${value}`;
  return value;
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
    markdown: normalizeMarkdown(markdown),
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
    markdown: normalizeMarkdown(content),
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
    markdown: nextMarkdown,
    localizedCount,
    failedCount,
  };
}

export function serializeImageMap(imageMap) {
  return Array.from(imageMap || []).map(([id, dataUrl]) => ({ id, dataUrl }));
}

export function deserializeImageMap(items) {
  if (!Array.isArray(items)) return new Map();
  return new Map(
    items
      .filter((item) => item && typeof item.id === "string" && typeof item.dataUrl === "string")
      .map((item) => [item.id, item.dataUrl]),
  );
}
