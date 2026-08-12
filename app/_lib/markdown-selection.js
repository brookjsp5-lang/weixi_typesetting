export function clampSelection(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function getSelectionLineRange(source, start, end) {
  const firstLineStart = source.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lastLineSearchStart =
    end > start && source.charAt(end - 1) === "\n" ? end - 1 : end;
  const nextLineBreak = source.indexOf("\n", lastLineSearchStart);

  return {
    firstLineStart,
    lastLineEnd: nextLineBreak === -1 ? source.length : nextLineBreak,
  };
}
