import type { PodcastScriptResult, VideoScriptResult } from "../_types/formatter";

export function sanitizeAiTextOutput(text: unknown): string;
export function extractJsonObjectFromAiText(text: unknown): unknown;
export function createMediaSourceExcerpt(markdown: unknown, maxLength?: number): string;
export function normalizePodcastScript(value: unknown): NonNullable<PodcastScriptResult>;
export function normalizeVideoScript(value: unknown): NonNullable<VideoScriptResult>;
