export type InlineMarkdownUpdate = {
  markdown: string;
  selectionStart: number;
  selectionEnd: number;
};

export function insertInlineMarkdown(
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix?: string,
  placeholder?: string,
): InlineMarkdownUpdate;
