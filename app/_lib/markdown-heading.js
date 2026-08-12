function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function normalizeHeadingLevel(level) {
  return clamp(Math.round(Number(level) || 1), 1, 6);
}

function convertLineToHeading(line, prefix) {
  if (!line.trim()) return line;

  const match = line.match(/^([ \t]{0,3})(?:#{1,6}[ \t]+)?(.*)$/);
  if (!match) return `${prefix}${line}`;

  return `${match[1]}${prefix}${match[2]}`;
}

export function setMarkdownHeadingLevel(markdown, selectionStart, selectionEnd, level) {
  const source = String(markdown || "");
  const start = clamp(Number(selectionStart) || 0, 0, source.length);
  const end = clamp(Number(selectionEnd) || 0, start, source.length);
  const headingPrefix = `${"#".repeat(normalizeHeadingLevel(level))} `;
  const firstLineStart = source.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lastLineSearchStart =
    end > start && source.charAt(end - 1) === "\n" ? end - 1 : end;
  const nextLineBreak = source.indexOf("\n", lastLineSearchStart);
  const lastLineEnd = nextLineBreak === -1 ? source.length : nextLineBreak;
  const selectedLines = source.slice(firstLineStart, lastLineEnd);
  const isEmptyCurrentLine = start === end && selectedLines === "";
  const updatedLines = isEmptyCurrentLine
    ? `${headingPrefix}标题`
    : selectedLines
        .split("\n")
        .map((line) => convertLineToHeading(line, headingPrefix))
        .join("\n");

  return {
    markdown: `${source.slice(0, firstLineStart)}${updatedLines}${source.slice(lastLineEnd)}`,
    selectionStart: firstLineStart,
    selectionEnd: firstLineStart + updatedLines.length,
  };
}
