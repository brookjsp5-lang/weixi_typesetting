# Distinct Theme Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make non-festive theme templates visually distinct enough that users can immediately see template changes on ordinary pasted articles.

**Architecture:** Keep the existing `TemplateConfig` and `renderArticle` pipeline. Add a per-template `variant` index so each category becomes `3 layout variants x 4 colors`, and update category styles in `app/template-engine.ts` with stronger paragraph, heading, quote, list, and image treatments.

**Tech Stack:** Next.js 16, React 19, TypeScript, marked, Node test runner, Biome.

## Global Constraints

- Keep the template count at 72.
- Keep all generated article CSS inline for WeChat Official Account compatibility.
- Do not change WeChat import, AI workflow, or copy-publish behavior.
- Do not make festive templates weaker; use them as the current high-contrast baseline.
- Preserve custom theme color support and keep the selected template variant when a custom color is applied.

---

### Task 1: Add Regression Coverage For Distinct Template Variants

**Files:**
- Modify: `tests/template-selection-source.test.mjs`

**Interfaces:**
- Consumes: source text from `app/template-engine.ts`
- Produces: source-level tests that fail until variant-based template styling exists

- [ ] **Step 1: Write the failing tests**

Add tests that assert:
- `TemplateConfig` exposes a `variant` field.
- generated templates set `variant: i % 3`.
- custom theme color rerendering passes `baseTemplate.variant`.
- non-festive categories contain visible layout markers such as article cards, report cards, letter paper, tech panels, and brutal blocks.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/template-selection-source.test.mjs`

Expected: FAIL because `variant` and the stronger style markers do not exist yet.

### Task 2: Add Variant-Aware Template Styling

**Files:**
- Modify: `app/template-engine.ts`

**Interfaces:**
- Consumes: `variant: number` from each generated `TemplateConfig`
- Produces: category-specific template styles that change shape, not only color

- [ ] **Step 1: Add `variant` to `TemplateConfig`**

Add `variant: number` and pass `i % 3` in every category loop.

- [ ] **Step 2: Preserve variant for custom colors**

Call `getStylesByCategory(baseTemplate.category, formatTweaks.themeColor, baseTemplate.variant)` in `renderArticle`.

- [ ] **Step 3: Strengthen category styles**

Update five non-festive categories:
- neo-brutalism: paragraph blocks, hard borders, offset shadows.
- minimalist: magazine panels, quiet dividers, pill headings.
- business: report cards, section bars, summary blocks.
- literary: letter-paper cards, framed images, softer quote panels.
- tech: terminal panels, mono accents, dashboard-like modules.

- [ ] **Step 4: Run target test**

Run: `node --test tests/template-selection-source.test.mjs`

Expected: PASS.

### Task 3: Verify, Commit, Push, Deploy

**Files:**
- Verify all modified files.

**Interfaces:**
- Produces: pushed `main` commit and Ready Vercel production deployment.

- [ ] **Step 1: Run verification**

Run:
- `npm test`
- `npm run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd next build --webpack`
- `git diff --check`

- [ ] **Step 2: Commit and push**

Commit message: `feat: make theme templates more distinct`

- [ ] **Step 3: Deploy production**

Deploy with Vercel token and confirm:
- deployment status is `Ready`
- `https://weixi-typesetting.vercel.app` is aliased
- recent error logs are empty
