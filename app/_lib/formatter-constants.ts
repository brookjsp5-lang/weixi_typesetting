export const sampleText = `# 用 WX 把公众号文章整理到可发布状态

写公众号最耗时间的地方，往往不是表达观点，而是反复调整标题、段落、封面、摘要和发布素材。**WX · 公众号排版助手**把这些动作整理成一条新手也能照着走的发布向导：先写初稿，再做 AI 改写、AI 排版、AI 生图、发布物料，最后复制发布。

## 第 1 步：先放入初稿

你可以直接在左侧写 Markdown，也可以把已有文章粘贴进来。初稿不需要一开始就很完美，只要观点、案例和结构大致完整，就可以进入后面的优化流程。

> 好的工具不替你做决定，而是帮你把杂乱的内容变得更清楚、更适合阅读。

## 第 2 步：用 AI 改写优化表达

如果文章语气还不够顺，可以在 **AI 改写** 中选择提示词，例如：

1. **公众号温和润色**：保留观点，让表达更自然
2. **增强开头吸引力**：让第一段更容易抓住读者
3. **压缩精简版**：删掉啰嗦句子，让内容更利落

改写会直接更新左侧初稿，页面会保留本次 AI 处理前的内容；如果不满意，点击“还原”即可回到改写前。

## 第 3 步：用 AI 排版整理结构

**AI 一键排版**只整理 Markdown 结构，不改写正文。它会直接更新左侧初稿，并保留还原入口，帮助你优化标题层级、空行、列表、引用和重点加粗，让文章更适合手机阅读。

同时，你还可以在这一步选择模板、主题色和细节参数。WX 当前提供 **72 套公众号模板**，适合观点文、教程、商业分析、活动通知等不同内容。

## 第 4 步：生成封面图

在 **AI 生图** 中，你可以选择封面风格提示词，再生成公众号封面图。封面图需要先配置支持 /images/generations 的生图模型；未配置时不会生成封面图。

示例封面方向：

![公众号封面示例](https://picsum.photos/seed/wx-cover/800/400)

如果文章正文还需要配图，也可以继续使用左侧工具栏插入本地或在线图片：

![配图1](https://picsum.photos/seed/wx-1/400/400) ![配图2](https://picsum.photos/seed/wx-2/400/400) ![配图3](https://picsum.photos/seed/wx-3/400/400)

## 第 5 步：生成发布物料

发布前建议确认这些内容：

- 标题是否清楚，有没有过长
- 段落是否适合手机阅读
- 图片、链接、引用是否完整
- 摘要、关键词和标签是否准备好
- 是否已经复制最终排版 HTML

## 第 6 步：复制到公众号后台

完成检查后，点击右上角 **一键复制发布**，再到微信公众号后台编辑器中粘贴即可。标题、摘要和关键词也可以在发布步骤里单独复制。

来一段代码块测试模板效果：

\`\`\`javascript
function publishWithWX() {
  console.log("WX 让公众号排版更轻松")
}
\`\`\`

现在，你可以把这篇示例替换成自己的文章，按右侧发布向导一步步完成排版。`;

export const aiStorageKeys = {
  provider: "wechat-formatter-ai-provider",
  baseUrl: "wechat-formatter-ai-base-url",
  apiKey: "wechat-formatter-ai-api-key",
  model: "wechat-formatter-ai-model",
  imageBaseUrl: "wechat-formatter-ai-image-base-url",
  imageApiKey: "wechat-formatter-ai-image-api-key",
  imageModel: "wechat-formatter-ai-image-model",
  coverTextMode: "wechat-formatter-ai-cover-text-mode",
  coverTitleStyle: "wechat-formatter-ai-cover-title-style",
  posterTextMode: "wechat-formatter-ai-poster-text-mode",
  posterTextStyle: "wechat-formatter-ai-poster-text-style",
  prompts: "wechat-formatter-ai-prompts",
  coverPrompts: "wechat-formatter-ai-cover-prompts",
  selectedCoverPromptId: "wechat-formatter-ai-selected-cover-prompt",
  posterPrompts: "wechat-formatter-ai-poster-prompts",
  selectedPosterPromptId: "wechat-formatter-ai-selected-poster-prompt",
  reversePromptRequirements: "wechat-formatter-ai-reverse-prompt-requirements",
  reversePromptRequirementDraft: "wechat-formatter-ai-reverse-prompt-requirement-draft",
  selectedReversePromptRequirementId:
    "wechat-formatter-ai-selected-reverse-prompt-requirement",
  workflowTab: "wechat-formatter-workflow-tab",
} as const;

export const openRouterConfig = {
  baseUrl: "https://openrouter.ai/api/v1",
  apiKeyUrl: "https://openrouter.ai/settings/keys",
  modelsPageUrl: "https://openrouter.ai/models",
  modelsApiUrl: "https://openrouter.ai/api/v1/models?output_modalities=text",
} as const;
