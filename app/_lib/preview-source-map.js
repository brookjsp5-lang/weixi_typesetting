const fenceStartPattern = /^ {0,3}(`{3,}|~{3,})/;
const headingPattern = /^ {0,3}#{1,6}[ \t]+/;
const blockquotePattern = /^ {0,3}>/;
const listPattern = /^ {0,3}(?:[-+*]|\d+[.)])[ \t]+/;
const rulePattern = /^ {0,3}(?:([-*_])[ \t]*){3,}$/;
const sourceAnchorCommentPattern =
  /<!--typezen-source:(\d+)-->\s*<([a-z][\w-]*)(\s[^>]*?)?>/gi;

function getLineKind(line, nextLine, currentKind) {
  if (fenceStartPattern.test(line)) return "fence";
  if (headingPattern.test(line)) return "heading";
  if (blockquotePattern.test(line)) return "blockquote";
  if (listPattern.test(line)) return "list";
  if (rulePattern.test(line)) return "rule";

  const isTableDivider = /^ {0,3}\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  if (isTableDivider || currentKind === "table") return "table";
  if (nextLine && /\|/.test(line) && /^ {0,3}\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(nextLine)) {
    return "table";
  }

  return "paragraph";
}

export function annotateMarkdownWithSourceAnchors(markdown) {
  const source = String(markdown || "");
  if (!source) return "";

  const lines = source.split(/(?<=\n)/);
  let result = "";
  let offset = 0;
  let currentKind = null;
  let isInsideFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const sourceLine = lines[index];
    const line = sourceLine.endsWith("\n") ? sourceLine.slice(0, -1) : sourceLine;
    const nextSourceLine = lines[index + 1] || "";
    const nextLine = nextSourceLine.endsWith("\n") ? nextSourceLine.slice(0, -1) : nextSourceLine;
    const fence = line.match(fenceStartPattern);

    if (isInsideFence) {
      result += sourceLine;
      offset += sourceLine.length;
      if (fence) isInsideFence = false;
      continue;
    }

    if (!line.trim()) {
      result += sourceLine;
      offset += sourceLine.length;
      currentKind = null;
      continue;
    }

    const kind = getLineKind(line, nextLine, currentKind);
    const shouldStartBlock =
      currentKind === null || kind === "heading" || kind === "rule" || kind !== currentKind;

    if (shouldStartBlock) {
      result += `<!--typezen-source:${offset}-->\n`;
    }

    result += sourceLine;
    offset += sourceLine.length;
    currentKind = kind;
    if (kind === "fence") isInsideFence = true;
  }

  return result;
}

export function attachSourceAnchorsToPreviewHtml(html) {
  return String(html || "").replace(
    sourceAnchorCommentPattern,
    (_match, sourceStart, tagName, attributes = "") =>
      `<${tagName} data-typezen-source-start="${sourceStart}"${attributes}>`,
  );
}
