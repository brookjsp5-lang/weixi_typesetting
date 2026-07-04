export const COVER_FIXED_LABEL_TEXT: "";

export type CoverTitleStyle = {
  titleEnabled: boolean;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  fontScalePercent: number;
  textColor: string;
  strokeColor: string;
};

export const DEFAULT_COVER_TITLE_STYLE: Readonly<CoverTitleStyle>;

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

export function normalizeCoverTitleStyle(style?: Partial<CoverTitleStyle>): CoverTitleStyle;

export function isCoverTitleOverlayEnabled(style?: Partial<CoverTitleStyle>): boolean;

export function createCoverTitleArea(
  style?: Partial<CoverTitleStyle>,
  canvasWidth?: number,
  canvasHeight?: number,
): {
  x: number;
  y: number;
  width: number;
  maxHeight: number;
};

export function wrapCoverTitleLines(input: {
  title: string;
  fontSize: number;
  maxWidth: number;
  measureText?: MeasureCoverTitleText;
}): string[];

export function createCoverTitleLayout(input?: {
  title?: string;
  measureText?: MeasureCoverTitleText;
  fontScalePercent?: number;
  area?: {
    x: number;
    y: number;
    width: number;
    maxHeight: number;
  };
}): CoverTitleLayout;
