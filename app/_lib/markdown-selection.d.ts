export function clampSelection(value: number, minimum: number, maximum: number): number;

export function getSelectionLineRange(
  source: string,
  start: number,
  end: number,
): { firstLineStart: number; lastLineEnd: number };
