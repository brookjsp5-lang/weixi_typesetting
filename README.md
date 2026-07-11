# 公众号一键排版助手 TypeZen

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/brookjsp5-lang/weixi_typesetting.svg?style=social)](https://github.com/brookjsp5-lang/weixi_typesetting/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/brookjsp5-lang/weixi_typesetting.svg)](https://github.com/brookjsp5-lang/weixi_typesetting/issues)

TypeZen 是一款面向微信公众号创作者的在线排版工作台。你可以把 Markdown 草稿放进编辑区，使用 AI 优化排版结构，套用 72 套微信公众号兼容模板，并在发布前生成封面图、公众号贴图、播客脚本、短视频分镜和发布检查清单。

- 在线体验：[https://typezen.online](https://typezen.online)
- Vercel 部署：[https://weixi-typesetting.vercel.app](https://weixi-typesetting.vercel.app)
- GitHub 仓库：[https://github.com/brookjsp5-lang/weixi_typesetting](https://github.com/brookjsp5-lang/weixi_typesetting)

## 核心能力

- **Markdown 转微信公众号排版**：基于 `marked` 解析 Markdown，并输出微信公众号编辑器友好的内联 CSS。
- **72 套精美模板**：覆盖新粗野、极简、商务、文艺、科技、节庆 6 大风格分类。
- **AI 一键排版**：只优化标题层级、空行、列表、加粗、引用、分隔线等结构，不静默改写正文事实。
- **AI 发布工作区**：从草稿出发生成发布方向、封面图、公众号贴图、播客脚本、短视频分镜和发布检查结果。
- **AI 封面生图**：支持 `工具叠字` 与 `模型直出`，默认用 TypeZen 在封面背景上叠加中文标题，降低模型错字风险。
- **公众号贴图生图**：支持 `工具叠字` 与 `模型直出`。`工具叠字` 让模型只生成无文字竖版背景，再由 TypeZen 合成标题、金句和说明；`模型直出` 让模型直接生成完整带字贴图。
- **贴图文字样式面板**：在工具叠字模式下可调整卡片位置、宽度、透明度、字号、标题/金句/说明颜色、描边色、强调色和阴影开关，修改样式会基于原背景本地重绘。
- **本地配置与素材管理**：AI 服务配置保存在当前浏览器本地；生成贴图会进入本地贴图库，方便复用。
- **一键复制发布**：复制排版后的 HTML、封面图或贴图，贴近微信公众号后台发布流程。

## AI 服务支持

TypeZen 支持 OpenRouter、DeepSeek、火山方舟、阿里百炼 Qwen、MiniMax、小米 MiMo、Kimi、智谱 GLM、OpenAI、Anthropic 与自定义 OpenAI 兼容接口。

文本类能力用于排版优化、发布方向、脚本与分镜生成；图像类能力用于封面和贴图生成。API Key 只保存在当前浏览器本地，调用时会临时发送到服务端代理请求对应模型服务，项目不会持久化保存你的 API Key。

## 贴图生图模式

### 工具叠字

推荐默认模式。模型只负责生成无文字竖版背景，提示词会明确禁止文字、数字、Logo、水印、UI 卡片和信息图。TypeZen 使用 canvas 合成主标题、金句、说明和样式，适合中文标题准确性要求较高的公众号贴图。

### 模型直出

高级模式。提示词会要求模型完整显示标题、金句和说明，并强调不要改字、漏字或生成乱码。这个模式适合用户希望模型直接完成构图和文字设计的场景，但文字准确性仍取决于模型能力。

## 支持的 Markdown 语法

TypeZen 针对微信公众号编辑器重新设计了常用 Markdown 元素的展示样式：

1. 标题：支持 `#` 到 `######`。
2. 段落：自动应用模板字体、行高、间距和首行缩进设置。
3. 强调：支持 `**加粗**`、`*斜体*` 和内联高亮样式。
4. 引用：支持 `>`，渲染为模板化摘录或提示块。
5. 列表：支持有序列表和无序列表。
6. 代码：支持行内代码和多行代码块。
7. 分隔线：支持 `---`。
8. 链接：支持 `[text](url)`。
9. 图片：支持 `![]()`、远程图片导入、编辑区直接粘贴图片和连续图片自动分组。
10. 表格：自动添加微信公众号兼容的固定布局和换行策略，避免溢出。
11. 内嵌 HTML：尽量保留并隔离样式。

## 技术栈

- **框架**：Next.js 16.2.0 App Router
- **UI**：React 19.2.4 + Tailwind CSS 4
- **语言**：TypeScript 5
- **Markdown 解析**：marked 17.0.4
- **AI SDK**：Vercel AI SDK 6，`@ai-sdk/openai`，`@ai-sdk/anthropic`
- **图标**：lucide-react，@lobehub/icons
- **代码检查**：Biome

## 本地开发

### 环境要求

- Node.js 20.9.0 或更高版本
- npm 或 pnpm

### 启动项目

```bash
git clone https://github.com/brookjsp5-lang/weixi_typesetting.git
cd weixi_typesetting
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可体验。

### 常用命令

```bash
# 运行测试
npm test

# 运行 Biome 检查
npm run lint

# 生产构建
npm run build

# 当前 Windows 环境如遇 Turbopack/SWC native 问题，可使用 webpack 构建
npx next build --webpack
```

## 部署

项目已链接到 Vercel，可通过 GitHub main 分支自动部署，也可以使用 Vercel CLI 手动生产部署：

```bash
npx vercel --prod
```

生产站点：

- [https://typezen.online](https://typezen.online)
- [https://weixi-typesetting.vercel.app](https://weixi-typesetting.vercel.app)

## 微信公众号兼容性

微信公众号编辑器对 CSS 和 HTML 支持有限，因此 TypeZen 的渲染结果会尽量满足以下原则：

- 所有关键样式写入 `style=""` 内联属性。
- 外层使用适合公众号粘贴的结构，避免脚本和不必要的复杂语义标签。
- 表格使用固定布局和强制换行策略，防止移动端溢出。
- 模板明确设置背景色，降低暗黑模式对粘贴结果的影响。
- 图片样式、圆角、边框和间距都在生成 HTML 时内联。

## 贡献

欢迎提交 Bug 报告、功能建议、文档改进或代码 PR。

1. Fork 本仓库。
2. 创建功能分支：`git checkout -b feature/my-feature`。
3. 提交修改：`git commit -m "feat: add my feature"`。
4. 推送分支：`git push origin feature/my-feature`。
5. 发起 Pull Request。

## License

MIT
