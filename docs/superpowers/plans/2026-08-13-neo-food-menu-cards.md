Exit code: 0
Wall time: 0.4 seconds
Output:
# Neo 菜单卡美食风模板统一升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 12 套美食风模板统一升级为兼容微信公众号的 Neo 菜单卡视觉语言。

**Architecture:** 保持 `getStylesByCategory("food", color)` 作为 12 个模板的共享样式来源，并只在 `renderArticle()` 的美食风分支中扩展标题、列表、分隔线和图片输出结构。测试以现有 Node 内置测试读取模板引擎源码的方式，锁定 12 套模板、内联样式及美食风专属标记；其它六类模板不改变。

**Tech Stack:** Next.js 16、React 19、TypeScript、marked 17、Node.js 内置测试、Biome。

## Global Constraints

- 美食风保持 12 套模板、现有模板 ID、名称、配色和选择界面；总计仍为 84 套、7 大类。
- 所有输出均使用 `section`、标准 HTML 文本和内联 CSS；不使用外链图片、外部字体、SVG、伪元素或必需 `flex` 布局。
- 继续在文章内容块中使用显式 `background-color`，图片与表格保留移动端安全的宽度、固定布局和断词规则。
- 装饰使用低频 Unicode 餐具、食物、猫咪与星点符号；失效时不得影响正文内容或层级。
- 美食风以浅暖灰底、细描边、圆角、硬朗小阴影和高饱和主题色对齐 TypeZen 的 Neo UI；不更改其它六类模板的渲染意图。

---

## File Structure

- `app/template-engine.ts` — 美食风共享样式、以及美食专属的 heading/list/hr/image 内联 HTML 输出。
- `tests/template-selection-source.test.mjs` — 对美食风模板注册与 Neo 菜单卡源码契约的回归测试。
- `docs/superpowers/specs/2026-08-13-neo-food-menu-cards-design.md` — 已确认的设计依据，无需修改。
- `docs/superpowers/plans/2026-08-13-neo-food-menu-cards.md` — 本实施计划。

### Task 1: 锁定 Neo 菜单卡的渲染契约

**Files:**
- Modify: `tests/template-selection-source.test.mjs`

**Interfaces:**
- Consumes: `app/template-engine.ts` 的 `case "food"` 与 `customRenderer.heading/list/hr/image`。
- Produces: 对菜单标题牌、主厨提示卡、步骤牌、菜单花边和图片硬阴影的源码回归约束。

- [ ] **Step 1: 写入失败的美食风 Neo 菜单卡测试**

在现有 `food templates register twelve recipe-focused styles` 测试之后加入以下测试：

```js
test("food templates use the shared Neo menu-card component language", () => {
  const foodCase = templateEngineSource.match(/case "food":[\s\S]*?default:/)?.[0] ?? "";

  assert.match(foodCase, /box-shadow:\s*3px 3px 0px/);
  assert.match(foodCase, /border:\s*1px solid/);
  assert.match(foodCase, /border-radius:\s*6px/);
  assert.match(foodCase, /主厨小贴士/);
  assert.match(foodCase, /🐱/);
  assert.match(foodCase, /🥄/);
  assert.match(foodCase, /max-width:\s*100%/);
  assert.match(foodCase, /table-layout:\s*fixed/);
});

test("food renderer adds menu labels without changing other categories", () => {
  assert.match(templateEngineSource, /template\.category === "food"[\s\S]*?MENU_TITLE/);
  assert.match(templateEngineSource, /template\.category === "food"[\s\S]*?MENU_SECTION/);
  assert.match(templateEngineSource, /template\.category === "food"[\s\S]*?MENU_DIVIDER/);
  assert.match(templateEngineSource, /template\.category === "food"[\s\S]*?MENU_IMAGE/);
  assert.match(templateEngineSource, /食材/);
  assert.match(templateEngineSource, /步骤/);
});
```

- [ ] **Step 2: 运行测试以确认失败**

Run: `node --test tests/template-selection-source.test.mjs`

Expected: 新增两项测试失败，提示找不到 `MENU_TITLE`、`MENU_SECTION`、`MENU_DIVIDER` 或 `MENU_IMAGE` 结构；此前测试继续通过。

- [ ] **Step 3: 提交仅测试改动**

```bash
git add tests/template-selection-source.test.mjs
git commit -m "test: define neo food template rendering"
```

### Task 2: 实现共享 Neo 菜单卡样式

**Files:**
- Modify: `app/template-engine.ts:421-458`
- Test: `tests/template-selection-source.test.mjs`

**Interfaces:**
- Consumes: `getStylesByCategory(category: string, color: string)`、`foodTextColors[color]` 与 `hexToRgba(color, opacity)`。
- Produces: 为全部 `food-*` 模板统一提供菜单标题卡、主厨小贴士、清单、图片与表格样式的 `TemplateConfig`。

- [ ] **Step 1: 替换 food 分支的核心样式为菜单卡语言**

在 `case "food"` 内保持 `backgroundColor: "#fff9f4"` 和当前正文色，替换或调整以下字段：

```ts
h1Style: `font-size: 1.55em; font-weight: 800; text-align: left; margin: 24px 0 26px; color: #34241d; border: 1px solid ${hexToRgba(color, 0.45)}; border-top: 5px solid ${color}; border-radius: 6px; padding: 14px 16px 12px; background-color: #fffdf9; box-shadow: 3px 3px 0px ${hexToRgba(color, 0.5)}; line-height: 1.4;`,
h2Style: `font-size: 1.2em; font-weight: 800; margin: 28px 0 16px; color: #34241d; border: 1px solid ${hexToRgba(color, 0.45)}; border-left: 5px solid ${color}; border-radius: 6px; padding: 9px 12px; background-color: ${hexToRgba(color, 0.08)}; box-shadow: 2px 2px 0px ${hexToRgba(color, 0.35)}; line-height: 1.4;`,
h3Style: `font-size: 1.08em; font-weight: 700; margin: 20px 0 12px; color: #43332b; border-left: 3px solid ${color}; padding-left: 9px; line-height: 1.5;`,
blockquoteStyle: `border: 1px solid ${hexToRgba(color, 0.4)}; border-left: 5px solid ${color}; border-radius: 6px; margin: 24px 0; padding: 14px 16px; color: #624b3f; background-color: ${hexToRgba(color, 0.08)}; box-shadow: 3px 3px 0px ${hexToRgba(color, 0.25)}; line-height: 1.8;`,
blockquoteInnerBefore: `<span style="display: block; margin-bottom: 7px; color: ${foodTextColor}; font-size: 12px; font-weight: 800; letter-spacing: 1px;">🐱 主厨小贴士 · 🥄</span>`,
listIcon: `<section style="display: inline-block; color: ${foodTextColor}; font-size: 13px; line-height: 1; vertical-align: middle;">●</section>`,
imgStyle: `max-width: 100%; border: 1px solid ${hexToRgba(color, 0.4)}; border-radius: 8px; padding: 4px; background-color: #fffdf9; box-shadow: 3px 3px 0px ${hexToRgba(color, 0.3)}; display: block; margin: 24px auto;`,
tableStyle: `width: 100%; max-width: 100%; border-collapse: separate; border-spacing: 0; margin: 24px 0; font-size: 0.92em; table-layout: fixed; word-wrap: break-word; border: 1px solid ${hexToRgba(color, 0.35)}; border-radius: 6px; overflow: hidden; background-color: #fffdf9;`,
```

保留 `pStyle`、`code`、`link`、`tdStyle` 的可读性与现有安全属性。为表头加主题色底边与浅色背景，并使用显式背景色。

- [ ] **Step 2: 运行指定测试确认仍按预期失败**

Run: `node --test tests/template-selection-source.test.mjs`

Expected: 第一个新增测试通过；第二个新增测试仍失败，因为渲染器尚未输出菜单标签。

- [ ] **Step 3: 提交共享样式改动**

```bash
git add app/template-engine.ts tests/template-selection-source.test.mjs
git commit -m "feat: style food templates as neo menu cards"
```

### Task 3: 实现美食风专属的语义装饰输出

**Files:**
- Modify: `app/template-engine.ts:660-881`
- Test: `tests/template-selection-source.test.mjs`

**Interfaces:**
- Consumes: `template.category`、`template.themeColor`、`foodTextColors`、`customRenderer` 和 `formatTweaks.imageRadius`。
- Produces: 仅在 `template.category === "food"` 时使用的 `MENU_TITLE`、`MENU_SECTION`、`MENU_DIVIDER`、`MENU_IMAGE` 字符串标记与内联 HTML。

- [ ] **Step 1: 在 heading 渲染器中添加标题菜单标识**

在构造 `textHtml` 后、通用 section 输出前，加入仅作用于 food 的包装：

```ts
const foodTextColor = foodTextColors[template.themeColor] || "#43332b";
const foodHeadingLabel = depth === 1
  ? `<span style="display: block; margin-bottom: 6px; color: ${foodTextColor}; font-size: 11px; font-weight: 800; letter-spacing: 1.2px;">MENU_TITLE · 今日菜单 🍽</span>`
  : depth === 2
    ? `<span style="display: inline-block; margin-right: 7px; color: ${foodTextColor}; font-size: 11px; font-weight: 800; letter-spacing: 0.8px;">MENU_SECTION · 🥄</span>`
    : `<span style="display: inline-block; margin-right: 6px; color: ${foodTextColor}; font-size: 12px;">🍴</span>`;
const foodHeadingHtml = template.category === "food" ? `${foodHeadingLabel}${textHtml}` : textHtml;
```

将两处 `${textHtml}` 替换为 `${foodHeadingHtml}`。不能修改非 food 分支的样式字符串。

- [ ] **Step 2: 在 list 渲染器中加入食材与步骤牌**

在 `ordered` 分支内的 food 图标替换为：

```ts
icon = `<section style="display: inline-block; min-width: 28px; padding: 4px 5px; border: 1px solid ${hexToRgba(template.themeColor, 0.45)}; border-radius: 5px; background-color: ${hexToRgba(template.themeColor, 0.08)}; color: ${foodTextColor}; font-size: 11px; font-weight: 800; letter-spacing: 0.4px; text-align: center; box-sizing: border-box;">步骤 ${step}</section>`;
```

在无序且 food 的分支中替换图标为：

```ts
icon = `<section style="display: inline-block; min-width: 28px; color: ${foodTextColor}; font-size: 11px; font-weight: 800; letter-spacing: 0.3px;">食材 ●</section>`;
```

将 food `iconWidth` 从 `30` 提升为 `54`，保证步骤牌和食材文字不与正文重叠。非 food 分类的图标与宽度保持不变。

- [ ] **Step 3: 在 hr 与 image 渲染器中添加菜单花边和图片语义标识**

替换 `customRenderer.hr`：

```ts
customRenderer.hr = function () {
  if (template.category === "food") {
    const foodTextColor = foodTextColors[template.themeColor] || "#43332b";
    return `<section style="margin: 30px 0; text-align: center; color: ${foodTextColor}; font-size: 13px; letter-spacing: 6px; line-height: 1; background-color: ${template.backgroundColor};">MENU_DIVIDER · 🍽 ✦ 🥄 ✦ 🍽</section>`;
  }
  return `<hr style="${template.hrStyle}" />`;
};
```

在 `customRenderer.image` 中，food 时将已生成的 `<img>` 包在以下 section 内：

```ts
return `<section style="margin: 24px auto; text-align: center; background-color: ${template.backgroundColor};"><section style="display: inline-block; max-width: 100%; position: relative;"><span style="display: block; margin: 0 0 5px; color: ${foodTextColor}; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-align: left;">MENU_IMAGE · 主厨推荐</span>${styledImage}</section></section>`;
```

非 food 模板继续直接返回加上 `imageStyle` 的 `<img>`。

- [ ] **Step 4: 运行全部测试确认通过**

Run: `npm test`

Expected: 全部 Node 测试通过，包括两个新增 Neo 菜单卡测试。

- [ ] **Step 5: 提交渲染器改动**

```bash
git add app/template-engine.ts tests/template-selection-source.test.mjs
git commit -m "feat: render food templates with menu ornaments"
```

### Task 4: 全量静态校验与实际预览检查

**Files:**
- Modify: `app/template-engine.ts`（仅在失败需要修复时）
- Modify: `tests/template-selection-source.test.mjs`（仅在失败需要修复时）

**Interfaces:**
- Consumes: 完整美食风 `TemplateConfig` 与模板渲染器。
- Produces: 可交付的 12 套 Neo 菜单卡模板，且不破坏 Next.js 构建与 Biome 规则。

- [ ] **Step 1: 运行格式与代码检查**

Run: `npm run lint`

Expected: exit code 0。

- [ ] **Step 2: 运行生产构建**

Run: `npm run build`

Expected: Next.js 16 生产构建成功，exit code 0。

- [ ] **Step 3: 检查模板渲染所需标记与范围**

Run:

```bash
node --input-type=module -e "import { allTemplates } from './app/template-engine.ts'; const food = allTemplates.filter((template) => template.category === 'food'); if (food.length !== 12) throw new Error('Expected 12 food templates'); console.log(food.map((template) => template.id).join(', '));"
```

Expected: 输出 `food-0` 至 `food-11`，没有其它分类模板。

- [ ] **Step 4: 启动预览并抽查三种配色**

Run: `npm run dev`

Expected: 页面可打开；在模板选择中依次选择番茄、抹茶、蓝莓，使用含 H1/H2/H3、引用、两种列表、`---`、图片与表格的示例 Markdown。确认标题牌、主厨小贴士、步骤牌、菜单花边和图片标签均可见，且每个块为暖色背景、没有水平溢出。

- [ ] **Step 5: 提交最终校验后的修复（若有）**

```bash
git add app/template-engine.ts tests/template-selection-source.test.mjs
git commit -m "fix: polish neo food menu template rendering"
```

若没有修复，不创建空提交。

## Plan Self-Review

- Spec coverage: Task 2 实现 Neo 共享卡片语言与公众号兼容样式；Task 3 实现低频 Unicode 装饰、标题/清单/花边/图片的结构；Task 4 覆盖三种配色、全部测试、lint 和生产构建。
- Placeholder scan: 无 `TODO`、`TBD`、待定事项或未定义实现步骤。
- Type consistency: 所有改动复用现有 `TemplateConfig`、`Template.category`、`foodTextColors`、`customRenderer` 与 `allTemplates`，不引入新类型或接口。


