const WHOLE_FENCE_PATTERN = /^```(?:json|markdown|md)?\s*\n?([\s\S]*?)\n?```$/i;

export function sanitizeAiTextOutput(text) {
  let value = String(text || "")
    .replace(/^\uFEFF/, "")
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, "")
    .trim();

  const fenceMatch = value.match(WHOLE_FENCE_PATTERN);
  if (fenceMatch) value = fenceMatch[1].trim();

  value = value
    .replace(/^(?:最终(?:Markdown|内容|正文|结果)?|输出|答案|结果)[:：]\s*/i, "")
    .trim();

  const secondFenceMatch = value.match(WHOLE_FENCE_PATTERN);
  if (secondFenceMatch) value = secondFenceMatch[1].trim();

  return value;
}

export function extractJsonObjectFromAiText(text) {
  const cleaned = sanitizeAiTextOutput(text);
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("AI 未返回可解析的 JSON 结果");

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < cleaned.length; index++) {
    const char = cleaned[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth++;
    if (char === "}") depth--;

    if (depth === 0) {
      return JSON.parse(cleaned.slice(start, index + 1));
    }
  }

  throw new Error("AI 未返回完整的 JSON 结果");
}

export function createMediaSourceExcerpt(markdown, maxLength = 6000) {
  const normalized = String(markdown || "")
    .replace(/data:image\/[^)\s]+/gi, "本地图片")
    .replace(/!\[([^\]]*)]\([^)]+\)/g, (_, alt) => `[图片: ${alt || "图片"}]`)
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return normalized.slice(0, maxLength);
}

const cleanValue = (value, maxLength = 500) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

export function normalizePodcastScript(value) {
  const parsed = value || {};
  const rawSegments = Array.isArray(parsed.segments)
    ? parsed.segments
    : Array.isArray(parsed.chapters)
      ? parsed.chapters
      : Array.isArray(parsed.parts)
        ? parsed.parts
        : [];

  const script = {
    title: cleanValue(parsed.title || parsed.name, 80),
    intro: cleanValue(parsed.intro || parsed.opening || parsed.openingText, 500),
    segments: rawSegments
      .map((segment) => ({
        heading: cleanValue(segment.heading || segment.title || segment.name, 80),
        narration: cleanValue(segment.narration || segment.content || segment.script || segment.text, 1200),
      }))
      .filter((segment) => segment.heading && segment.narration)
      .slice(0, 8),
    outro: cleanValue(parsed.outro || parsed.ending || parsed.closing, 500),
  };

  if (!script.title || !script.intro || script.segments.length === 0 || !script.outro) {
    throw new Error("AI 播客脚本结果解析失败");
  }

  return script;
}

export function normalizeVideoScript(value) {
  const parsed = value || {};
  const rawScenes = Array.isArray(parsed.scenes)
    ? parsed.scenes
    : Array.isArray(parsed.shots)
      ? parsed.shots
      : Array.isArray(parsed.storyboard)
        ? parsed.storyboard
        : [];

  const script = {
    title: cleanValue(parsed.title || parsed.name, 80),
    scenes: rawScenes
      .map((scene, index) => ({
        shot: cleanValue(scene.shot || scene.title || scene.name || `镜头 ${index + 1}`, 80),
        visual: cleanValue(scene.visual || scene.image || scene.picture || scene.scene, 500),
        narration: cleanValue(scene.narration || scene.voiceover || scene.script || scene.text, 800),
        subtitle: cleanValue(scene.subtitle || scene.caption || scene.textOverlay, 120),
      }))
      .filter((scene) => scene.shot && scene.visual && scene.narration)
      .slice(0, 10),
    summary: cleanValue(parsed.summary || parsed.note || parsed.description, 300),
  };

  if (!script.title || script.scenes.length === 0) {
    throw new Error("AI 视频分镜结果解析失败");
  }

  return script;
}
