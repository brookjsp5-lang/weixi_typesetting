export type MarkdownListType = "ul" | "ol";

export type MarkdownListUpdate = {
  markdown: string;
  selectionStart: number;
  selectionEnd: number;
};

export function setMarkdownListType(
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  type: MarkdownListType,
): MarkdownListUpdate;
