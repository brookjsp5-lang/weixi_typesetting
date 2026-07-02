export const COVER_FIXED_LABEL_TEXT = "";

const DEFAULT_TITLE_AREA = {
  x: 72,
  y: 96,
  width: 720,
  maxHeight: 520,
};

const TITLE_LAYOUT_CANDIDATES = [
  { fontSize: 64, lineHeight: 76, maxLines: 4, width: 660, y: 132 },
  { fontSize: 60, lineHeight: 72, maxLines: 5, width: 700, y: 112 },
  { fontSize: 56, lineHeight: 68, maxLines: 6, width: 740, y: 92 },
  { fontSize: 52, lineHeight: 64, maxLines: 7, width: 780, y: 78 },
  { fontSize: 48, lineHeight: 60, maxLines: 8, width: 820, y: 64 },
  { fontSize: 46, lineHeight: 58, maxLines: Number.POSITIVE_INFINITY, width: 860, y: 52 },
];

const fallbackMeasureText = (text, fontSize) =>
  Array.from(String(text || "")).reduce((width, char) => {
    if (/\s/.test(char)) return width + fontSize * 0.28;
    if (char.charCodeAt(0) <= 0x7f) return width + fontSize * 0.56;
    return width + fontSize;
  }, 0);

export function normalizeCoverTitle(title) {
  return String(title || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function selectCoverTitle({ selectedTitle = "", titles = [], fallback = "" } = {}) {
  const selected = normalizeCoverTitle(selectedTitle);
  if (selected) return selected;

  const firstCandidate = Array.isArray(titles)
    ? titles.map((title) => normalizeCoverTitle(title)).find(Boolean)
    : "";

  return firstCandidate || normalizeCoverTitle(fallback);
}

function tokenizeTitle(title) {
  return normalizeCoverTitle(title).match(/[A-Za-z0-9][A-Za-z0-9&+/#._:-]*|\s+|./gu) || [];
}

function splitLongToken(token, { fontSize, maxWidth, measureText }) {
  const chars = Array.from(token);
  const chunks = [];
  let current = "";

  for (const char of chars) {
    const next = current + char;
    if (!current || measureText(next, fontSize) <= maxWidth) {
      current = next;
      continue;
    }
    chunks.push(current);
    current = char;
  }

  if (current) chunks.push(current);
  return chunks;
}

export function wrapCoverTitleLines({
  title,
  fontSize,
  maxWidth,
  measureText = fallbackMeasureText,
}) {
  const tokens = tokenizeTitle(title);
  const lines = [];
  let currentLine = "";

  for (const token of tokens) {
    const isSpace = /^\s+$/.test(token);
    if (isSpace && !currentLine) continue;

    const nextLine = currentLine + token;
    if (!currentLine || measureText(nextLine.trimEnd(), fontSize) <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine.trim()) lines.push(currentLine.trim());

    if (!isSpace && measureText(token, fontSize) > maxWidth) {
      const chunks = splitLongToken(token, { fontSize, maxWidth, measureText });
      lines.push(...chunks.slice(0, -1));
      currentLine = chunks.at(-1) || "";
      continue;
    }

    currentLine = isSpace ? "" : token;
  }

  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

export function createCoverTitleLayout({
  title,
  measureText = fallbackMeasureText,
  area = DEFAULT_TITLE_AREA,
} = {}) {
  const normalizedTitle = normalizeCoverTitle(title) || "公众号文章封面";

  for (const candidate of TITLE_LAYOUT_CANDIDATES) {
    const width = Math.min(candidate.width, area.width + 160);
    const lines = wrapCoverTitleLines({
      title: normalizedTitle,
      fontSize: candidate.fontSize,
      maxWidth: width,
      measureText,
    });
    const height = lines.length * candidate.lineHeight;
    if (lines.length <= candidate.maxLines && height <= area.maxHeight) {
      return {
        x: area.x,
        y: candidate.y,
        width,
        lines,
        fontSize: candidate.fontSize,
        lineHeight: candidate.lineHeight,
        height,
      };
    }
  }

  const fallback = TITLE_LAYOUT_CANDIDATES.at(-1);
  const lines = wrapCoverTitleLines({
    title: normalizedTitle,
    fontSize: fallback.fontSize,
    maxWidth: fallback.width,
    measureText,
  });

  return {
    x: area.x,
    y: fallback.y,
    width: fallback.width,
    lines,
    fontSize: fallback.fontSize,
    lineHeight: fallback.lineHeight,
    height: lines.length * fallback.lineHeight,
  };
}
