import type {
  AiProviderType,
  AppliedAiChange,
  CoverPromptTemplate,
  PosterPromptTemplate,
  PosterTextBrief,
  PromptTemplate,
  ProviderPreset,
  PublishCheckItem,
  PublishWorkflowStep,
} from "../_types/formatter";

export const providerPresets: ProviderPreset[];

export function getProviderPreset(providerId: AiProviderType): ProviderPreset;

export function createDefaultPromptTemplates(): PromptTemplate[];

export function createDefaultCoverPromptTemplates(): CoverPromptTemplate[];

export function createDefaultPosterPromptTemplates(): PosterPromptTemplate[];

export function createCoverPrompt(params: {
  markdown: string;
  title: string;
  summary: string;
  keywords?: string[];
  coverPrompt?: string;
  textMode?: "canvas" | "model";
}): string;

export function normalizePosterTextBrief(value: unknown): PosterTextBrief;

export function createPosterBriefPrompt(params: {
  markdown: string;
  posterPrompt?: string;
}): string;

export function createPosterPrompt(params: {
  markdown: string;
  brief: PosterTextBrief;
  posterPrompt?: string;
}): string;

export function extractJsonObject(text: string): unknown;

export function createAppliedAiChange(params: {
  taskType: NonNullable<AppliedAiChange>["taskType"];
  original: string;
  applied: string;
  label: string;
}): NonNullable<AppliedAiChange>;

export function resolveCoverGenerationConfig(params: {
  textBaseUrl: string;
  textApiKey: string;
  imageBaseUrl: string;
  imageApiKey: string;
  imageModel: string;
}): {
  baseUrl: string;
  apiKey: string;
  model: string;
  hasImageModel: boolean;
};

export function getCoverGenerationConfigStatus(params: {
  textBaseUrl: string;
  textApiKey: string;
  imageBaseUrl: string;
  imageApiKey: string;
  imageModel: string;
}): {
  isConfigured: boolean;
  message: string;
};

export function createPublishWorkflowSteps(params: {
  hasContent: boolean;
  hasRewriteDraft: boolean;
  hasAppliedRewrite: boolean;
  hasFormatDraft: boolean;
  hasAppliedFormat: boolean;
  hasCoverGenerated: boolean;
  hasPosterGenerated: boolean;
  hasCheckWarnings: boolean;
  hasPublishOptimization: boolean;
  hasCopied: boolean;
}): PublishWorkflowStep[];

export function runPublishChecks(
  markdown: string,
  options?: {
    hasCoverImage?: boolean;
  },
): PublishCheckItem[];
