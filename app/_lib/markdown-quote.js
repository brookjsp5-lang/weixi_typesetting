import { clampSelection, getSelectionLineRange } from "./markdown-selection.js";

function convertLineToQuote(line) {
  if (!line.trim()) return line;

  const match = line.match(/^([ \t]{0,3})(?:>[ \t]?)?(.*)$/);
  return match ? `${match[1]}> ${match[2]}` : `> ${line}`;
}

export function setMarkdownQuote(markdown, selectionStart, selectionEnd) {
  const source = String(markdown || "");
  const start = clampSelection(Number(selectionStart) || 0, 0, source.length);
  const end = clampSelection(Number(selectionEnd) || 0, start, source.length);
  const { firstLineStart, lastLineEnd } = getSelectionLineRange(source, start, end);
  const selectedLines = source.slice(firstLineStart, lastLineEnd);
  const isEmptyCurrentLine = start === end && selectedLines === "";
  const updatedLines = isEmptyCurrentLine
    ? "> 引用内容"
    : selectedLines
        .split("\n")
        .map(convertLineToQuote)
        .join("\n");

  return {
    markdown: `${source.slice(0, firstLineStart)}${updatedLines}${source.slice(lastLineEnd)}`,
    selectionStart: firstLineStart,
    selectionEnd: firstLineStart + updatedLines.length,
  };
}
