import assert from "node:assert/strict";
import test from "node:test";

import {
  createMediaSourceExcerpt,
  extractJsonObjectFromAiText,
  normalizePodcastScript,
  normalizeVideoScript,
  sanitizeAiTextOutput,
} from "../app/_lib/ai-output-utils.js";

test("sanitizeAiTextOutput removes think blocks and keeps final markdown", () => {
  const output = sanitizeAiTextOutput(`<think>
I should explain my reasoning here.
</think>

\`\`\`markdown
# 标题

正文内容
\`\`\``);

  assert.equal(output, "# 标题\n\n正文内容");
});

test("sanitizeAiTextOutput removes common reasoning prefixes", () => {
  const output = sanitizeAiTextOutput(`最终内容：

这是可以直接使用的正文。`);

  assert.equal(output, "这是可以直接使用的正文。");
});

test("extractJsonObjectFromAiText parses cleaned JSON wrapped in prose", () => {
  const json = extractJsonObjectFromAiText(`
<think>先分析。</think>
下面是结果：
\`\`\`json
{"title":"播客标题","segments":[{"heading":"第一段","narration":"正文"}]}
\`\`\`
`);

  assert.deepEqual(json, {
    title: "播客标题",
    segments: [{ heading: "第一段", narration: "正文" }],
  });
});

test("createMediaSourceExcerpt removes giant payloads and limits long articles", () => {
  const markdown = `# 长文

![图片](data:image/png;base64,${"a".repeat(20000)})

${"这是一段很长的正文。".repeat(2000)}`;

  const excerpt = createMediaSourceExcerpt(markdown, 1200);

  assert.ok(excerpt.length <= 1200);
  assert.doesNotMatch(excerpt, /base64/);
  assert.match(excerpt, /\[图片: 图片\]/);
});

test("normalizePodcastScript accepts common field aliases", () => {
  const script = normalizePodcastScript({
    title: "这篇文章可以这样听",
    opening: "大家好，今天聊一个实用话题。",
    chapters: [{ title: "核心观点", content: "第一部分口播。" }],
    ending: "感谢收听。",
  });

  assert.deepEqual(script, {
    title: "这篇文章可以这样听",
    intro: "大家好，今天聊一个实用话题。",
    segments: [{ heading: "核心观点", narration: "第一部分口播。" }],
    outro: "感谢收听。",
  });
});

test("normalizeVideoScript accepts common scene aliases", () => {
  const script = normalizeVideoScript({
    title: "短视频标题",
    shots: [
      {
        title: "开场",
        image: "手机文章预览",
        voiceover: "先提出问题。",
        caption: "先看问题",
      },
    ],
    summary: "适合做一分钟短视频。",
  });

  assert.deepEqual(script, {
    title: "短视频标题",
    scenes: [
      {
        shot: "开场",
        visual: "手机文章预览",
        narration: "先提出问题。",
        subtitle: "先看问题",
      },
    ],
    summary: "适合做一分钟短视频。",
  });
});
