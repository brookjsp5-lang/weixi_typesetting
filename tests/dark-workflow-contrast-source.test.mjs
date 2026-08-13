import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const workflowSource = readFileSync(resolve(testDir, "../app/_components/workflow-pane.tsx"), "utf8");
const previewSource = readFileSync(resolve(testDir, "../app/_components/preview-pane.tsx"), "utf8");
const footerSource = readFileSync(resolve(testDir, "../app/_components/app-footer.tsx"), "utf8");
const globalStyles = readFileSync(resolve(testDir, "../app/globals.css"), "utf8");

test("workflow status cards use dark-safe semantic styles", () => {
  assert.match(workflowSource, /neo-workflow-step-done/);
  assert.match(workflowSource, /neo-workflow-step-active/);
  assert.match(workflowSource, /neo-workflow-step-pending/);
  assert.match(workflowSource, /neo-workflow-info-card/);
  assert.match(workflowSource, /neo-workflow-completion-card/);
  assert.match(globalStyles, /\.neo-workflow-step-active/);
  assert.match(globalStyles, /\.neo-workflow-info-card/);
  assert.match(globalStyles, /\.neo-workflow-completion-card/);
});

test("preview provides a visible cue that the article can be scrolled", () => {
  assert.match(previewSource, /neo-preview-scroll-hint/);
  assert.match(globalStyles, /\.neo-preview-scroll-hint/);
});

test("footer uses a readable semantic muted-text treatment", () => {
  assert.match(footerSource, /neo-footer-muted/);
  assert.match(globalStyles, /\.neo-footer-muted/);
});
