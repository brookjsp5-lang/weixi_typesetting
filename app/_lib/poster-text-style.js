export const DEFAULT_POSTER_TEXT_STYLE = Object.freeze({
  cardEnabled: true,
  cardXPercent: 8.4,
  cardYPercent: 59.5,
  cardWidthPercent: 83.2,
  fontScalePercent: 100,
  titleColor: "#111827",
  quoteColor: "#050816",
  noteColor: "#4b5563",
  strokeColor: "#ffffff",
  cardBackgroundColor: "#ffffff",
  cardOpacity: 0.92,
  accentColor: "#10b981",
  shadowEnabled: true,
});

const DEFAULT_POSTER_WIDTH = 900;
const DEFAULT_POSTER_HEIGHT = 1200;
const DEFAULT_CARD_BOTTOM_MARGIN = 96;

const clampNumber = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

const normalizeHexColor = (value, fallback) => {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : fallback;
};

export function normalizePosterTextStyle(style = {}) {
  return {
    cardEnabled:
      typeof style.cardEnabled === "boolean"
        ? style.cardEnabled
        : DEFAULT_POSTER_TEXT_STYLE.cardEnabled,
    cardXPercent: clampNumber(
      style.cardXPercent,
      0,
      40,
      DEFAULT_POSTER_TEXT_STYLE.cardXPercent,
    ),
    cardYPercent: clampNumber(
      style.cardYPercent,
      0,
      78,
      DEFAULT_POSTER_TEXT_STYLE.cardYPercent,
    ),
    cardWidthPercent: clampNumber(
      style.cardWidthPercent,
      48,
      92,
      DEFAULT_POSTER_TEXT_STYLE.cardWidthPercent,
    ),
    fontScalePercent: clampNumber(
      style.fontScalePercent,
      75,
      125,
      DEFAULT_POSTER_TEXT_STYLE.fontScalePercent,
    ),
    titleColor: normalizeHexColor(style.titleColor, DEFAULT_POSTER_TEXT_STYLE.titleColor),
    quoteColor: normalizeHexColor(style.quoteColor, DEFAULT_POSTER_TEXT_STYLE.quoteColor),
    noteColor: normalizeHexColor(style.noteColor, DEFAULT_POSTER_TEXT_STYLE.noteColor),
    strokeColor: normalizeHexColor(style.strokeColor, DEFAULT_POSTER_TEXT_STYLE.strokeColor),
    cardBackgroundColor: normalizeHexColor(
      style.cardBackgroundColor,
      DEFAULT_POSTER_TEXT_STYLE.cardBackgroundColor,
    ),
    cardOpacity: clampNumber(
      style.cardOpacity,
      0.35,
      1,
      DEFAULT_POSTER_TEXT_STYLE.cardOpacity,
    ),
    accentColor: normalizeHexColor(style.accentColor, DEFAULT_POSTER_TEXT_STYLE.accentColor),
    shadowEnabled:
      typeof style.shadowEnabled === "boolean"
        ? style.shadowEnabled
        : DEFAULT_POSTER_TEXT_STYLE.shadowEnabled,
  };
}

export function isPosterTextCardEnabled(style = DEFAULT_POSTER_TEXT_STYLE) {
  return normalizePosterTextStyle(style).cardEnabled;
}

export function createPosterTextCardArea(
  style = DEFAULT_POSTER_TEXT_STYLE,
  canvasWidth = DEFAULT_POSTER_WIDTH,
  canvasHeight = DEFAULT_POSTER_HEIGHT,
) {
  const normalizedStyle = normalizePosterTextStyle(style);
  const x = Math.round((canvasWidth * normalizedStyle.cardXPercent) / 100);
  const y = Math.round((canvasHeight * normalizedStyle.cardYPercent) / 100);
  const requestedWidth = Math.round((canvasWidth * normalizedStyle.cardWidthPercent) / 100);
  const maxWidth = Math.max(320, canvasWidth - x - 32);
  const width = Math.min(requestedWidth, maxWidth);
  const maxHeight = Math.max(160, canvasHeight - y - DEFAULT_CARD_BOTTOM_MARGIN);

  return { x, y, width, maxHeight };
}
