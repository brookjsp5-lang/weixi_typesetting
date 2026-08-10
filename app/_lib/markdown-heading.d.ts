export type MarkdownHeadingUpdate = {
  markdown: string;
  selectionStart: number;
  selectionEnd: number;
};

export function setMarkdownHeadingLevel(
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  level: number,
): MarkdownHeadingUpdate;
