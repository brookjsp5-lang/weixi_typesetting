import type { PosterTextStyle } from "../_types/formatter";

export const DEFAULT_POSTER_TEXT_STYLE: Readonly<PosterTextStyle>;

export function normalizePosterTextStyle(style?: Partial<PosterTextStyle> | unknown): PosterTextStyle;

export function isPosterTextCardEnabled(style?: Partial<PosterTextStyle> | unknown): boolean;

export function createPosterTextCardArea(
  style?: Partial<PosterTextStyle> | unknown,
  canvasWidth?: number,
  canvasHeight?: number,
): {
  x: number;
  y: number;
  width: number;
  maxHeight: number;
};
