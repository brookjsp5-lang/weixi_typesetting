# 美食风模板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有 Neo 风格模板系统中新增 12 套美食风模板，并保持微信公众号内联样式兼容。

**Architecture:** 扩展 `template-engine.ts` 的分类、配色和类别样式分支，使美食风复用既有模板选择与渲染链路。使用已有的源文件回归测试方式验证分类注册、模板数量、菜谱步骤编号和设置面板文案；同步更新用户可见的模板数量文案。

**Tech Stack:** Next.js 16、React 19、TypeScript、Node.js 内置测试、Biome。

## Global Constraints

- 美食风保持当前 Neo 分类卡片、三列模板按钮和选中态，不新增页面结构或资源。
- 输出到微信公众号的样式必须保持内联，并使用明确的 `background-color`。
- 美食风服务于食谱、探店和美食记录，不引入贴纸、外部字体或节庆装饰。
- 模板总数从 72 套、6 类更新为 84 套、7 类。

---

### Task 1: 美食风模板引擎和设置入口

**Files:**
- Modify: `app/template-engine.ts`
- Modify: `app/_components/settings-pane.tsx`
- Modify: `tests/template-selection-source.test.mjs`

**Interfaces:**
- Consumes: `TemplateConfig`、`groupedTemplates`、`getStylesByCategory(category, color)`。
- Produces: `food` 分类及其 12 个模板；可由现有模板选择 UI 直接消费。

- [x] **Step 1: Write the failing test**

```js
test("food templates register twelve recipe-focused styles", () => {
  assert.match(templateEngineSource, /\{ id: "food", name: "美食风" \}/);
  assert.match(templateEngineSource, /colorPalettes\.food\.forEach/);
  assert.match(templateEngineSource, /case "food":/);
  assert.match(templateEngineSource, /String\(num\)\.padStart\(2, "0"\)/);
  assert.match(settingsPaneSource, /food: "暖食配色与清晰步骤/);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/template-selection-source.test.mjs`

Expected: FAIL because the `food` category and recipe step number formatting do not exist.

- [x] **Step 3: Write minimal implementation**

```ts
case "food":
  return {
    backgroundColor: "#fff9f4",
    // left-aligned headings, a warm recipe note, ingredient bullets,
    // and mobile-safe food image and table styles
  };
```

Add `food` to `categoriesList`, create 12 dedicated food colors, generate twelve templates, and add the matching settings-panel description.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/template-selection-source.test.mjs`

Expected: PASS.

### Task 2: 模板总数文案与全量验证

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `lib/site-config.ts`
- Modify: `app/json-ld.tsx`
- Modify: `app/manifest.ts`
- Modify: `app/_lib/formatter-constants.ts`
- Modify: `tests/template-selection-source.test.mjs`

**Interfaces:**
- Consumes: 新的 `food` 模板分类与现有站点文案。
- Produces: 一致的“84 套 / 7 类”对外文案。

- [x] **Step 1: Write the failing test**

```js
test("public template copy describes seven categories and eighty-four templates", () => {
  assert.match(siteConfigSource, /84 套/);
  assert.match(formatterConstantsSource, /84 套/);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/template-selection-source.test.mjs`

Expected: FAIL because public copy still says 72 套 / 6 类.

- [x] **Step 3: Write minimal implementation**

Replace public count statements with `84 套` and `7 类`, retaining all existing product claims and structure.

- [x] **Step 4: Run complete verification**

Run: `npm test && npm run lint && npm run build`

Expected: all tests, lint, and production build pass.

- [ ] **Step 5: Commit**

```bash
git add app tests README.md AGENTS.md lib docs/superpowers/plans
git commit -m "feat: add food theme templates"
```
