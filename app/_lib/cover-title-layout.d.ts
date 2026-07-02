export const COVER_FIXED_LABEL_TEXT: "";

export type MeasureCoverTitleText = (text: string, fontSize: number) => number;

export type CoverTitleLayout = {
  x: number;
  y: number;
  width: number;
  lines: string[];
  fontSize: number;
  lineHeight: number;
  height: number;
};

export function normalizeCoverTitle(title: string): string;

export function selectCoverTitle(input?: {
  selectedTitle?: string;
  titles?: string[];
  fallback?: string;
}): string;

export function wrapCoverTitleLines(input: {
  title: string;
  fontSize: number;
  maxWidth: number;
  measureText?: MeasureCoverTitleText;
}): string[];

export function createCoverTitleLayout(input?: {
  title?: string;
  measureText?: MeasureCoverTitleText;
  area?: {
    x: number;
    y: number;
    width: number;
    maxHeight: number;
  };
}): CoverTitleLayout;
