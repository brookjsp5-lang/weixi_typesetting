import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const appHeaderSource = readFileSync(resolve(testDir, "../app/_components/app-header.tsx"), "utf8");
const pageSource = readFileSync(resolve(testDir, "../app/page.tsx"), "utf8");
const reversePromptModalSource = readFileSync(
  resolve(testDir, "../app/_components/reverse-prompt-modal.tsx"),
  "utf8",
);
const reversePromptRequirementHookSource = readFileSync(
  resolve(testDir, "../app/_hooks/use-reverse-prompt-requirements.ts"),
  "utf8",
);

test("app header exposes the reverse prompt generator button", () => {
  assert.match(appHeaderSource, /onOpenReversePrompt/);
  assert.match(appHeaderSource, /逆向提示词/);
});

test("reverse prompt modal captures instruction article and target type", () => {
  assert.match(reversePromptModalSource, /逆向提示词要求/);
  assert.match(reversePromptModalSource, /需要逆向的文章/);
  assert.match(reversePromptModalSource, /正文改写提示词/);
  assert.match(reversePromptModalSource, /AI 生图提示词/);
  assert.match(reversePromptModalSource, /公众号贴图提示词/);
  assert.match(reversePromptModalSource, /生成并添加到提示词库/);
});

test("reverse prompt modal can manage saved requirement drafts", () => {
  assert.match(reversePromptModalSource, /requirementTemplates/);
  assert.match(reversePromptModalSource, /selectedRequirementId/);
  assert.match(reversePromptModalSource, /已保存要求/);
  assert.match(reversePromptModalSource, /保存\/更新/);
  assert.match(reversePromptModalSource, /删除/);
  assert.match(reversePromptModalSource, /onSaveRequirement/);
  assert.match(reversePromptModalSource, /onDeleteRequirement/);
});

test("page saves generated reverse prompts to the selected prompt library", () => {
  assert.match(pageSource, /runReversePromptGeneration/);
  assert.match(pageSource, /taskType:\s*"reversePrompt"/);
  assert.match(pageSource, /请先配置文本模型，用于逆向生成提示词/);
  assert.match(pageSource, /promptSettings\.savePromptTemplate/);
  assert.match(pageSource, /coverPromptSettings\.saveCoverPromptTemplate/);
  assert.match(pageSource, /posterPromptSettings\.savePosterPromptTemplate/);
  assert.match(pageSource, /createReversePromptTemplateName/);
  assert.match(pageSource, /reversePromptTargetLabels\[target\]/);
});

test("page wires reverse prompt requirement persistence into the modal", () => {
  assert.match(pageSource, /useReversePromptRequirements/);
  assert.match(pageSource, /reversePromptRequirementSettings\.requirement/);
  assert.match(pageSource, /reversePromptRequirementSettings\.requirementTemplates/);
  assert.match(pageSource, /reversePromptRequirementSettings\.saveCurrentRequirement/);
  assert.match(pageSource, /reversePromptRequirementSettings\.deleteCurrentRequirement/);
});

test("reverse prompt requirements are persisted and editable", () => {
  assert.match(reversePromptRequirementHookSource, /reversePromptRequirements/);
  assert.match(reversePromptRequirementHookSource, /reversePromptRequirementDraft/);
  assert.match(reversePromptRequirementHookSource, /selectedReversePromptRequirementId/);
  assert.match(reversePromptRequirementHookSource, /saveCurrentRequirement/);
  assert.match(reversePromptRequirementHookSource, /deleteCurrentRequirement/);
  assert.match(reversePromptRequirementHookSource, /localStorage\.setItem/);
});
