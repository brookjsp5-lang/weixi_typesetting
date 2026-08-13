import { clampSelection } from "./markdown-selection.js";

export function insertInlineMarkdown(
  markdown,
  selectionStart,
  selectionEnd,
  prefix,
  suffix = prefix,
  placeholder = "",
) {
  const source = String(markdown || "");
  const start = clampSelection(Number(selectionStart) || 0, 0, source.length);
  const end = clampSelection(Number(selectionEnd) || 0, start, source.length);
  const selectedText = source.slice(start, end);
  const textToInsert = selectedText || placeholder;
  const normalizedPrefix = String(prefix || "");
  const normalizedSuffix = String(suffix || "");

  return {
    markdown: `${source.slice(0, start)}${normalizedPrefix}${textToInsert}${normalizedSuffix}${source.slice(end)}`,
    selectionStart: start + normalizedPrefix.length,
    selectionEnd: start + normalizedPrefix.length + textToInsert.length,
  };
}
