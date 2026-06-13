import type {
  AiProviderType,
  AppliedAiChange,
  PromptTemplate,
  ProviderPreset,
  PublishCheckItem,
  PublishWorkflowStep,
} from "../_types/formatter";

export const providerPresets: ProviderPreset[];

export function getProviderPreset(providerId: AiProviderType): ProviderPreset;

export function createDefaultPromptTemplates(): PromptTemplate[];

export function extractJsonObject(text: string): unknown;

export function createAppliedAiChange(params: {
  taskType: NonNullable<AppliedAiChange>["taskType"];
  original: string;
  applied: string;
  label: string;
}): NonNullable<AppliedAiChange>;

export function createFallbackCoverImage(params: {
  title: string;
  summary?: string;
  keywords?: string[];
}): string;

export function createPublishWorkflowSteps(params: {
  hasContent: boolean;
  hasRewriteDraft: boolean;
  hasAppliedRewrite: boolean;
  hasFormatDraft: boolean;
  hasAppliedFormat: boolean;
  hasCoverGenerated: boolean;
  hasCheckWarnings: boolean;
  hasPublishOptimization: boolean;
  hasCopied: boolean;
}): PublishWorkflowStep[];

export function runPublishChecks(markdown: string): PublishCheckItem[];
