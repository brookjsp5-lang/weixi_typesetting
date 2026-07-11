import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const hookSource = readFileSync(resolve(testDir, "../app/_hooks/use-ai-workflow.ts"), "utf8");
const workflowPaneSource = readFileSync(
  resolve(testDir, "../app/_components/workflow-pane.tsx"),
  "utf8",
);

test("poster generation uses manual text and skips AI poster brief endpoint", () => {
  assert.match(hookSource, /posterManualText\.trim\(\)/);
  assert.match(hookSource, /createManualPosterTextBrief/);
  assert.doesNotMatch(hookSource, /\/api\/ai-poster-brief/);
  assert.doesNotMatch(hookSource, /请先配置文本模型，用于提炼贴图文案/);
});

test("workflow module entry list hides podcast and video modules", () => {
  const moduleList = workflowPaneSource.match(/const workflowModules[\s\S]*?\];/)?.[0] || "";

  assert.match(moduleList, /id: "guide"/);
  assert.match(moduleList, /id: "poster"/);
  assert.doesNotMatch(moduleList, /id: "podcast"/);
  assert.doesNotMatch(moduleList, /id: "video"/);
});
