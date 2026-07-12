import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const aiTaskSource = readFileSync(resolve(testDir, "../app/api/ai-task/route.ts"), "utf8");
const formatterTypesSource = readFileSync(
  resolve(testDir, "../app/_types/formatter.ts"),
  "utf8",
);

test("ai task route supports posterText as a first-class task type", () => {
  assert.match(formatterTypesSource, /AiTaskType\s*=.*"posterText"/s);
  assert.match(aiTaskSource, /taskType === "posterText"/);
  assert.match(aiTaskSource, /POSTER_TEXT_PROMPT/);
});

test("ai task route supports reversePrompt as a first-class task type", () => {
  assert.match(formatterTypesSource, /AiTaskType\s*=.*"reversePrompt"/s);
  assert.match(aiTaskSource, /taskType === "reversePrompt"/);
  assert.match(aiTaskSource, /REVERSE_PROMPT_PROMPT/);
});

test("posterText prompt is constrained to user-requested plain text", () => {
  assert.match(aiTaskSource, /根据用户提供的处理要求/);
  assert.match(aiTaskSource, /只输出最终可放入贴图的纯文本/);
  assert.match(aiTaskSource, /不要输出解释/);
  assert.match(aiTaskSource, /不要使用 Markdown 代码块/);
  assert.match(aiTaskSource, /不要输出 JSON/);
  assert.match(aiTaskSource, /不编造原文没有的信息/);
});

test("posterText task requires a user processing requirement", () => {
  assert.match(aiTaskSource, /selectedTask === "posterText"/);
  assert.match(aiTaskSource, /请先填写处理要求/);
});

test("reversePrompt prompt outputs only reusable prompt text", () => {
  assert.match(aiTaskSource, /逆向生成一条可复用提示词/);
  assert.match(aiTaskSource, /只输出提示词正文/);
  assert.match(aiTaskSource, /不要输出解释/);
  assert.match(aiTaskSource, /不要使用 Markdown 代码块/);
  assert.match(aiTaskSource, /不要输出 JSON/);
  assert.match(aiTaskSource, /不要复述原文章全文/);
  assert.match(aiTaskSource, /正文改写提示词/);
  assert.match(aiTaskSource, /AI 生图提示词/);
  assert.match(aiTaskSource, /公众号贴图提示词/);
});

test("reversePrompt task requires a reverse prompt instruction", () => {
  assert.match(aiTaskSource, /selectedTask === "reversePrompt"/);
  assert.match(aiTaskSource, /请先填写逆向提示词要求/);
});
