export type MarkdownDraftResult = {
  markdown: string;
  skippedImages: number;
};

export type SerializedImageItem = {
  id: string;
  dataUrl: string;
};

export type LocalizedMarkdownImagesResult = {
  markdown: string;
  localizedCount: number;
  failedCount: number;
};

export type LocalizedHtmlImagesResult = {
  html: string;
  localizedCount: number;
  failedCount: number;
};

export function extractImageSource(element: {
  getAttribute: (name: string) => string | null | undefined;
}): string;

export function htmlToMarkdownDraft(
  html: string,
  createImageRef: (dataUrl: string) => string,
): MarkdownDraftResult;

export function normalizeConsecutiveImageBlocks(markdown: string): string;

export function localizeRemoteMarkdownImages(
  markdown: string,
  importRemoteImage: (url: string) => Promise<string>,
  createImageRef: (dataUrl: string) => string,
): Promise<LocalizedMarkdownImagesResult>;

export function localizeRemoteHtmlImages(
  html: string,
  importRemoteImage: (url: string) => Promise<string>,
  createImageRef: (dataUrl: string) => string,
): Promise<LocalizedHtmlImagesResult>;

export function serializeImageMap(imageMap: Map<string, string>): SerializedImageItem[];

export function serializeAutosaveImageMap(
  imageMap: Map<string, string>,
  markdown: string,
  options?: { maxTotalBytes?: number },
): SerializedImageItem[];

export function deserializeImageMap(items: SerializedImageItem[] | unknown): Map<string, string>;
