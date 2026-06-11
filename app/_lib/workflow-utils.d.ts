import type {
  AiProviderType,
  PromptTemplate,
  ProviderPreset,
  PublishCheckItem,
} from "../_types/formatter";

export const providerPresets: ProviderPreset[];

export function getProviderPreset(providerId: AiProviderType): ProviderPreset;

export function createDefaultPromptTemplates(): PromptTemplate[];

export function extractJsonObject(text: string): unknown;

export function runPublishChecks(markdown: string): PublishCheckItem[];
