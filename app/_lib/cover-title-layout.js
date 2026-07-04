export const COVER_FIXED_LABEL_TEXT = "";
export const DEFAULT_COVER_TITLE_STYLE = Object.freeze({
  titleEnabled: true,
  xPercent: 6,
  yPercent: 14.2,
  widthPercent: 73,
  textColor: "#050816",
  strokeColor: "#ffffff",
});

const DEFAULT_TITLE_AREA = {
  x: 72,
  y: 96,
  width: 876,
  maxHeight: 520,
};
const DEFAULT_COVER_WIDTH = 1200;
const DEFAULT_COVER_HEIGHT = 675;
const DEFAULT_TITLE_BOTTOM_MARGIN = 59;

const TITLE_LAYOUT_CANDIDATES = [
  { fontSize: 64, lineHeight: 76, width: 660, y: 132 },
  { fontSize: 60, lineHeight: 72, width: 700, y: 112 },
  { fontSize: 56, lineHeight: 68, width: 740, y: 92 },
  { fontSize: 52, lineHeight: 64, width: 780, y: 78 },
  { fontSize: 48, lineHeight: 60, width: 820, y: 64 },
  { fontSize: 46, lineHeight: 58, width: 860, y: 52 },
];

const leadingPunctuationPattern = /^[\uFF0C\u3002\uFF01\uFF1F\u3001\uFF1B\uFF1A,.!?:;]+/u;
const endingPunctuationPattern = /[\uFF0C\u3002\uFF01\uFF1F\uFF1B\uFF1A,.!?:;]$/u;
const awkwardLineEndPattern =
  /[\u628a\u88ab\u5C06\u548C\u4E0E\u53CA\u6216\u7684\u5730\u5F97\u5728\u4ECE\u5411\u5BF9\u7ED9\u4E3A\u5230\u662F\u6BCF\u5404\uFF08\u300A\u201C]$/u;

const fallbackMeasureText = (text, fontSize) =>
  Array.from(String(text || "")).reduce((width, char) => {
    if (/\s/.test(char)) return width + fontSize * 0.28;
    if (char.charCodeAt(0) <= 0x7f) return width + fontSize * 0.56;
    return width + fontSize;
  }, 0);

const clampNumber = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

const normalizeHexColor = (value, fallback) => {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : fallback;
};

export function normalizeCoverTitleStyle(style = {}) {
  return {
    titleEnabled:
      typeof style.titleEnabled === "boolean"
        ? style.titleEnabled
        : DEFAULT_COVER_TITLE_STYLE.titleEnabled,
    xPercent: clampNumber(
      style.xPercent,
      0,
      72,
      DEFAULT_COVER_TITLE_STYLE.xPercent,
    ),
    yPercent: clampNumber(
      style.yPercent,
      0,
      70,
      DEFAULT_COVER_TITLE_STYLE.yPercent,
    ),
    widthPercent: clampNumber(
      style.widthPercent,
      30,
      92,
      DEFAULT_COVER_TITLE_STYLE.widthPercent,
    ),
    textColor: normalizeHexColor(style.textColor, DEFAULT_COVER_TITLE_STYLE.textColor),
    strokeColor: normalizeHexColor(style.strokeColor, DEFAULT_COVER_TITLE_STYLE.strokeColor),
  };
}

export function isCoverTitleOverlayEnabled(style = DEFAULT_COVER_TITLE_STYLE) {
  return normalizeCoverTitleStyle(style).titleEnabled;
}

export function createCoverTitleArea(
  style = DEFAULT_COVER_TITLE_STYLE,
  canvasWidth = DEFAULT_COVER_WIDTH,
  canvasHeight = DEFAULT_COVER_HEIGHT,
) {
  const normalizedStyle = normalizeCoverTitleStyle(style);
  const x = Math.round((canvasWidth * normalizedStyle.xPercent) / 100);
  const y = Math.round((canvasHeight * normalizedStyle.yPercent) / 100);
  const requestedWidth = Math.round((canvasWidth * normalizedStyle.widthPercent) / 100);
  const maxWidth = Math.max(240, canvasWidth - x - 32);
  const width = Math.min(requestedWidth, maxWidth);
  const maxHeight = Math.max(120, canvasHeight - y - DEFAULT_TITLE_BOTTOM_MARGIN);

  return { x, y, width, maxHeight };
}

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

function getTitleVisualLength(title) {
  return Array.from(normalizeCoverTitle(title)).reduce((length, char) => {
    if (/\s/.test(char)) return length + 0.25;
    if (char.charCodeAt(0) <= 0x7f) return length + 0.56;
    return length + 1;
  }, 0);
}

function getPreferredLineCount(title) {
  const visualLength = getTitleVisualLength(title);
  if (visualLength <= 26) return 2;
  if (visualLength <= 42) return 3;
  if (visualLength <= 58) return 4;
  return 5;
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

function createBreakableTokens({ title, fontSize, maxWidth, measureText }) {
  const tokens = [];

  for (const token of tokenizeTitle(title)) {
    if (/^\s+$/.test(token)) {
      tokens.push(token);
      continue;
    }

    if (measureText(token, fontSize) <= maxWidth) {
      tokens.push(token);
      continue;
    }

    tokens.push(...splitLongToken(token, { fontSize, maxWidth, measureText }));
  }

  return tokens;
}

function getLineText(tokens, start, end) {
  return tokens.slice(start, end).join("").trim();
}

function moveLeadingPunctuation(lines) {
  const normalizedLines = [];

  for (const rawLine of lines) {
    let line = String(rawLine || "").trim();
    if (!line) continue;

    const leadingPunctuation = line.match(leadingPunctuationPattern)?.[0] || "";
    if (leadingPunctuation && normalizedLines.length > 0) {
      normalizedLines[normalizedLines.length - 1] += leadingPunctuation;
      line = line.slice(leadingPunctuation.length).trimStart();
    }

    if (line) normalizedLines.push(line);
  }

  return normalizedLines;
}

function scoreLine({ line, width, maxWidth, isLastLine }) {
  let score = 0;

  if (width > maxWidth) score += (width - maxWidth) * 1.8;
  if (leadingPunctuationPattern.test(line)) score += 2000;
  if (!isLastLine && endingPunctuationPattern.test(line)) score -= 90;
  if (!isLastLine && awkwardLineEndPattern.test(line)) score += 180;
  if (isLastLine && width < maxWidth * 0.38) score += 240;

  return score;
}

function scoreLineSet({ lines, fontSize, maxWidth, measureText, preferredLines }) {
  const lineWidths = lines.map((line) => measureText(line, fontSize));
  const longestLine = Math.max(...lineWidths);
  const shortestLine = Math.min(...lineWidths);
  const lastLineWidth = lineWidths.at(-1) || 0;
  const balancePenalty = longestLine ? ((longestLine - shortestLine) / longestLine) * 95 : 0;
  const lastLineRatio = longestLine ? lastLineWidth / longestLine : 1;

  let score = Math.abs(lines.length - preferredLines) * 180 + balancePenalty;
  if (lines.length >= 3 && lastLineRatio < 0.55) score += 420;
  if (lines.length === 1 && longestLine > maxWidth * 0.72) score += 260;

  lines.forEach((line, index) => {
    score += scoreLine({
      line,
      width: lineWidths[index],
      maxWidth,
      isLastLine: index === lines.length - 1,
    });
  });

  return score;
}

function buildLineLayout({ tokens, lineCount, fontSize, maxWidth, measureText, preferredLines }) {
  const tokenCount = tokens.length;
  const dp = Array.from({ length: lineCount + 1 }, () => new Map());
  dp[0].set(0, { score: 0, lines: [] });

  for (let lineIndex = 1; lineIndex <= lineCount; lineIndex += 1) {
    for (let end = 1; end <= tokenCount; end += 1) {
      let best = null;

      for (let start = lineIndex - 1; start < end; start += 1) {
        const previous = dp[lineIndex - 1].get(start);
        if (!previous) continue;

        const line = getLineText(tokens, start, end);
        if (!line) continue;

        const width = measureText(line, fontSize);
        if (width > maxWidth * 1.06) continue;

        const isLastLine = lineIndex === lineCount;
        const score =
          previous.score +
          scoreLine({
            line,
            width,
            maxWidth,
            isLastLine,
          });

        if (!best || score < best.score) {
          best = { score, lines: [...previous.lines, line] };
        }
      }

      if (best) dp[lineIndex].set(end, best);
    }
  }

  const result = dp[lineCount].get(tokenCount);
  if (!result) return null;

  const lines = moveLeadingPunctuation(result.lines);
  return {
    lines,
    score: result.score + scoreLineSet({ lines, fontSize, maxWidth, measureText, preferredLines }),
  };
}

export function wrapCoverTitleLines({
  title,
  fontSize,
  maxWidth,
  measureText = fallbackMeasureText,
  preferredLines = getPreferredLineCount(title),
}) {
  const tokens = createBreakableTokens({ title, fontSize, maxWidth, measureText });
  if (!tokens.length) return [];

  const maxLines = Math.min(8, Math.max(1, tokens.filter((token) => !/^\s+$/.test(token)).length));
  const lineCounts = Array.from({ length: maxLines }, (_, index) => index + 1);
  const layouts = lineCounts
    .map((lineCount) =>
      buildLineLayout({
        tokens,
        lineCount,
        fontSize,
        maxWidth,
        measureText,
        preferredLines,
      }),
    )
    .filter(Boolean)
    .sort((a, b) => a.score - b.score);

  if (layouts[0]) return layouts[0].lines;

  return moveLeadingPunctuation([normalizeCoverTitle(title)]);
}

function scoreCoverTitleLayout({ lines, fontSize, lineHeight, width, area, measureText, title }) {
  if (!lines.length) return Number.POSITIVE_INFINITY;

  const height = lines.length * lineHeight;
  const lineWidths = lines.map((line) => measureText(line, fontSize));
  const longestLine = Math.max(...lineWidths);
  const shortestLine = Math.min(...lineWidths);
  const lastLineWidth = lineWidths.at(-1) || 0;
  const visualLength = getTitleVisualLength(title);
  const preferredLines = getPreferredLineCount(title);
  const lastLineRatio = longestLine ? lastLineWidth / longestLine : 1;
  const balancePenalty = longestLine ? ((longestLine - shortestLine) / longestLine) * 100 : 0;

  let score = 0;
  score += Math.abs(lines.length - preferredLines) * 140;
  score += balancePenalty;

  if (height > area.maxHeight) score += 10000 + (height - area.maxHeight) * 10;
  if (longestLine > width * 1.04) score += 1200 + (longestLine - width) * 3;
  if (lines.some((line) => leadingPunctuationPattern.test(line))) score += 2000;
  if (lines.length >= 3 && lastLineRatio < 0.55) score += 520;
  if (fontSize > 60 && visualLength > 18) score += 180;
  if (fontSize < 52) score += (52 - fontSize) * 12;

  return score;
}

export function createCoverTitleLayout({
  title,
  measureText = fallbackMeasureText,
  area = DEFAULT_TITLE_AREA,
} = {}) {
  const normalizedTitle = normalizeCoverTitle(title) || "\u516c\u4f17\u53f7\u6587\u7ae0\u5c01\u9762";
  const preferredLines = getPreferredLineCount(normalizedTitle);
  const layouts = TITLE_LAYOUT_CANDIDATES.map((candidate) => {
    const width = Math.min(candidate.width, area.width);
    const y = area.y + (candidate.y - DEFAULT_TITLE_AREA.y);
    const lines = wrapCoverTitleLines({
      title: normalizedTitle,
      fontSize: candidate.fontSize,
      maxWidth: width,
      measureText,
      preferredLines,
    });
    const height = lines.length * candidate.lineHeight;

    return {
      x: area.x,
      y,
      width,
      lines,
      fontSize: candidate.fontSize,
      lineHeight: candidate.lineHeight,
      height,
      score: scoreCoverTitleLayout({
        lines,
        fontSize: candidate.fontSize,
        lineHeight: candidate.lineHeight,
        width,
        area,
        title: normalizedTitle,
        measureText,
      }),
    };
  }).sort((a, b) => a.score - b.score);

  const bestLayout = layouts[0];
  return {
    x: bestLayout.x,
    y: bestLayout.y,
    width: bestLayout.width,
    lines: bestLayout.lines,
    fontSize: bestLayout.fontSize,
    lineHeight: bestLayout.lineHeight,
    height: bestLayout.height,
  };
}
