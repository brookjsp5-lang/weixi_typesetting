export type MarkdownQuoteUpdate = {
  markdown: string;
  selectionStart: number;
  selectionEnd: number;
};

export function setMarkdownQuote(
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownQuoteUpdate;
