export type MarkdownDraftResult = {
  markdown: string;
  skippedImages: number;
};

export type SerializedImageItem = {
  id: string;
  dataUrl: string;
};

export function extractImageSource(element: {
  getAttribute: (name: string) => string | null | undefined;
}): string;

export function htmlToMarkdownDraft(
  html: string,
  createImageRef: (dataUrl: string) => string,
): MarkdownDraftResult;

export function serializeImageMap(imageMap: Map<string, string>): SerializedImageItem[];

export function deserializeImageMap(items: SerializedImageItem[] | unknown): Map<string, string>;
