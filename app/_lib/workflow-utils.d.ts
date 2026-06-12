import type {
  AiProviderType,
  PromptTemplate,
  ProviderPreset,
  PublishCheckItem,
  PublishWorkflowStep,
} from "../_types/formatter";

export const providerPresets: ProviderPreset[];

export function getProviderPreset(providerId: AiProviderType): ProviderPreset;

export function createDefaultPromptTemplates(): PromptTemplate[];

export function extractJsonObject(text: string): unknown;

export function createPublishWorkflowSteps(params: {
  hasContent: boolean;
  hasFormatDraft: boolean;
  hasAppliedFormat: boolean;
  hasCheckWarnings: boolean;
  hasPublishOptimization: boolean;
  hasCopied: boolean;
}): PublishWorkflowStep[];

export function runPublishChecks(markdown: string): PublishCheckItem[];
