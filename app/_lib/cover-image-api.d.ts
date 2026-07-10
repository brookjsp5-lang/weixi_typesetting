import type { AiProviderType, ImageTextMode } from "../_types/formatter";

export type ImageLayout = "cover" | "poster";

export type ImageGenerationRequestInput = {
  baseUrl: string;
  apiKey?: string;
  model: string;
  prompt: string;
  providerType?: AiProviderType;
  textMode?: ImageTextMode;
  imageLayout?: ImageLayout;
};

export function resolveImageGenerationEndpoint(baseUrl: string): string;

export function isOpenRouterImageConfig(input?: {
  baseUrl?: string;
  providerType?: AiProviderType | string;
}): boolean;

export function isOpenAIImageConfig(input?: {
  baseUrl?: string;
  providerType?: AiProviderType | string;
}): boolean;

export function isDashScopeImageConfig(input?: {
  baseUrl?: string;
  providerType?: AiProviderType | string;
}): boolean;

export function isMiniMaxImageConfig(input?: {
  baseUrl?: string;
  providerType?: AiProviderType | string;
}): boolean;

export function isZhipuImageConfig(input?: {
  baseUrl?: string;
  providerType?: AiProviderType | string;
}): boolean;

export function isVolcengineImageConfig(input?: {
  baseUrl?: string;
  providerType?: AiProviderType | string;
}): boolean;

export function getUnsupportedImageModelMessage(input?: {
  providerType?: AiProviderType | string;
  model?: string;
}): string;

export function buildImageGenerationRequestBodies(input: {
  baseUrl: string;
  model: string;
  prompt: string;
  providerType?: AiProviderType | string;
  textMode?: ImageTextMode;
  imageLayout?: ImageLayout;
}): Array<Record<string, unknown>>;

export function parseImageGenerationResult(data: unknown): string;

export function remoteImageToDataUrl(
  imageUrl: string,
  fetchImpl?: typeof fetch,
): Promise<string>;

export function getImageGenerationRawError(data: unknown): string;

export function createImageGenerationErrorMessage(
  data: unknown,
  status: number,
  fallbackMessage?: string,
): string;

export function requestImageGeneration(input: ImageGenerationRequestInput): Promise<{
  data: unknown;
  imageUrl: string;
  response: Response | null;
  requestBody: Record<string, unknown>;
}>;
