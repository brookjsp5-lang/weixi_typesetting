import { clampSelection, getSelectionLineRange } from "./markdown-selection.js";

function stripListMarker(line) {
  const match = line.match(/^([ \t]{0,3})(?:(?:[-+*])|\d+[.)])[ \t]+(.*)$/);
  return match ? `${match[1]}${match[2]}` : line;
}

export function setMarkdownListType(markdown, selectionStart, selectionEnd, type) {
  const source = String(markdown || "");
  const start = clampSelection(Number(selectionStart) || 0, 0, source.length);
  const end = clampSelection(Number(selectionEnd) || 0, start, source.length);
  const { firstLineStart, lastLineEnd } = getSelectionLineRange(source, start, end);
  const selectedLines = source.slice(firstLineStart, lastLineEnd);
  const isEmptyCurrentLine = start === end && selectedLines === "";
  let orderedIndex = 1;
  const updatedLines = isEmptyCurrentLine
    ? type === "ol"
      ? "1. 列表项"
      : "- 列表项"
    : selectedLines
        .split("\n")
        .map((line) => {
          if (!line.trim()) return line;

          const content = stripListMarker(line);
          const prefix = type === "ol" ? `${orderedIndex++}. ` : "- ";
          return `${prefix}${content}`;
        })
        .join("\n");

  return {
    markdown: `${source.slice(0, firstLineStart)}${updatedLines}${source.slice(lastLineEnd)}`,
    selectionStart: firstLineStart,
    selectionEnd: firstLineStart + updatedLines.length,
  };
}
