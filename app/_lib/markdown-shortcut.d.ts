export type MarkdownShortcutEvent = {
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  key: string;
};

export type MarkdownShortcutAction = "bold" | "italic";

export function getMarkdownShortcutAction(
  event: MarkdownShortcutEvent,
): MarkdownShortcutAction | null;
