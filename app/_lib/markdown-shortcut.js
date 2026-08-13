export function getMarkdownShortcutAction({ ctrlKey, metaKey, altKey, key }) {
  if (!(ctrlKey || metaKey) || altKey) return null;

  const normalizedKey = String(key || "").toLowerCase();
  if (normalizedKey === "b") return "bold";
  if (normalizedKey === "i") return "italic";
  return null;
}
