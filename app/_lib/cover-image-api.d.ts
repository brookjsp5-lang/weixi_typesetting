import type { AiProviderType } from "../_types/formatter";

export type ImageGenerationRequestInput = {
  baseUrl: string;
  apiKey?: string;
  model: string;
  prompt: string;
  providerType?: AiProviderType;
};

export function resolveImageGenerationEndpoint(baseUrl: string): string;

export function isVolcengineImageConfig(input?: {
  baseUrl?: string;
  providerType?: AiProviderType | string;
}): boolean;

export function buildImageGenerationRequestBodies(input: {
  baseUrl: string;
  model: string;
  prompt: string;
  providerType?: AiProviderType | string;
}): Array<Record<string, unknown>>;

export function parseImageGenerationResult(data: unknown): string;

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
