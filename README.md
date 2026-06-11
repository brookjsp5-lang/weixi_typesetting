# 公众号一键排版助手 (WeChat Formatter)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/mspringjade/wechat-formatter.svg?style=social)](https://github.com/mspringjade/wechat-formatter/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/mspringjade/wechat-formatter.svg)](https://github.com/mspringjade/wechat-formatter/issues)

**在线体验：[https://typezen.online](https://typezen.online)**

TypeZen 是一款专为微信公众号设计的「Markdown 转微信排版」辅助工具。写好 Markdown 文本后，可以使用 AI 一键优化排版结构，再套用 72 套不同风格的精美模板，并直接复制粘贴到微信公众平台后台。

## 核心特性

- **AI 一键排版**：支持 OpenRouter 模型库，以及 OpenAI / Anthropic 兼容 API 接口，可在不改写原文内容的前提下优化标题层级、空行、列表、引用、加粗与分隔线等 Markdown 结构。
- **全面格式支持**：原生支持所有常见的 Markdown 语法解析（由 `marked` 驱动），并针对微信公众号编辑器重新设计展示样式。
- **丰富的主题模板**：内置 **72 套**精美模板，覆盖 6 大风格分类，并支持自定义主题色。
- **细节自由微调**：支持调整正文字号、行高、段落间距、首行缩进、页面留白、字间距与图片圆角。
- **响应式工作台**：Neo 风格三栏工作流，支持实时手机框预览，适应桌面、平板以及手机环境。
- **一键无痕复制**：自动内联处理 CSS，点击「一键复制发布」即可直接粘贴进微信公众号文章编辑器并保留颜色与样式。

## AI 一键排版

AI 排版功能用于优化 Markdown 的「结构」而不是改写文章内容，适合在文章发布前快速整理版式。

- **支持多种服务商**：支持 OpenRouter 模型库，以及 OpenAI / Anthropic 兼容 API 接口。
- **OpenRouter 模型选择**：支持拉取 OpenRouter 文本模型列表，免费模型会优先展示，也可以手动输入模型 ID。
- **流式输出体验**：AI 排版结果会流式写回编辑区，减少等待感。
- **本地保存配置**：API 类型、API 地址、API Key 与模型名称仅保存在当前浏览器本地。
- **服务端临时调用**：排版时配置会临时发送到服务端用于调用模型服务，项目本身不会持久化保存你的 API Key。
- **内容保护约束**：系统提示词要求 AI 不删除、不增补、不润色原文，只调整 Markdown 排版结构。

## 完整支持的 Markdown 语法列表

本工具全面适配并重新设计了各类基础语法在微信公众号中的表现形式：

1. **基本与段落语法**：普通文本段落展示与两端对齐。
2. **标题语法** (`#`)：支持 1~6 级标题格式，不同模板拥有各异的视觉展现（如下划线、大号引用于标题等）。
3. **换行语法**：支持直接回车触发普通换行 (`<br>`) 不剥离空白。
4. **强调语法** (`**加粗**` / `*斜体*`)：加粗文字结合了荧光笔高亮、彩色背景等特殊效果；斜体具有各主题独立的颜色搭配。
5. **引用语法** (`>`)：区块引用被设计为精美的卡片式摘要或警示框款式。
6. **列表语法** (`-` / `1.`)：有序和无序列表适配不同主题的标记符号（包括圆点、字母、花朵符或实心球等）。
7. **代码语法** (`\``` ` 及 `\``) ：适配多行代码块环境，内联代码具备独特高亮样式包裹，专门优化避免排版越界。
8. **分隔线语法** (`---`)：针对各个主题色系单独设置了虚线、实线、甚至阴影效果的分隔线。
9. **链接语法** (`[]()`)：自动增加主题色下划线或破折号特效，适配手机端阅读盲区问题。
10. **图片语法** (`![]()`)：为文章内的图片自动赋予倒角、微阴影及主题颜色描边。并且支持**多图自动并排（多排）**，只需将多张连续图片放在同一个段落即可自动触发等宽布局。同时还支持在编辑区直接粘贴截屏/复制的图片。
11. **转义字符** (`\`) 及其它基本功能：完美兼容标准 Markdown 规范渲染。
12. **内嵌 HTML**：支持渲染文章中混写的 HTML 标签代码，并在最外层进行样式隔离兜底。

## 主题分类

72 套模板主要分为以下 6 大类别：
1. **新粗野风（12套）**：高饱和度色彩、粗黑边框与硬投影，适合更有冲击力的内容表达。
2. **纯净极简风（12套）**：没有冗余元素的精简阅读体验。
3. **沉稳商务风（12套）**：严控排版细节，尽显职业素养。
4. **诗意文艺风（12套）**：细腻排版，给文字呼吸的空间。
5. **极客科技风（12套）**：打破常规的模块化终端设计，使用前卫渐变。
6. **欢庆节庆风（12套）**：浓烈色彩传递节日喜悦气息。

## 技术栈

- **框架**: Next.js 16.2.0 (App Router)
- **UI**: React 19.2.4 + Tailwind CSS 4
- **语言**: TypeScript 5
- **Markdown 解析**: marked 17.0.4
- **AI 能力**: Vercel AI SDK 6，`@ai-sdk/openai`，`@ai-sdk/anthropic`
- **图标**: lucide-react，@lobehub/icons
- **代码检查**: Biome

## 快速开始

### 环境要求

- Node.js 20.9.0 或更高版本（Next.js 16 要求）
- npm 或 pnpm

### 本地运行

```bash
# 克隆项目
git clone https://github.com/mspringjade/wechat-formatter.git

# 进入项目目录
cd wechat-formatter

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可体验。

### 构建部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 注意事项

由于微信公众平台仅允许 `内联样式 (inline-css)`，本系统在转换过程中已将所有样式自动映射至 DOM 的 `style=""` 属性中，确保粘贴过程零损失。

AI 一键排版需要你自行配置可用的模型服务 API Key。配置保存在当前浏览器本地，排版请求会临时经过项目服务端转发到对应模型服务，请妥善保管自己的 API Key 与服务商额度。

## 贡献指南

欢迎所有形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 贡献方式

- 提交 Bug 报告或功能建议
- 提出新功能想法
- 改进文档
- 提交代码修复或新功能

## 访问地址

- 在线体验：[https://typezen.online](https://typezen.online)
- GitHub：[https://github.com/mspringjade/wechat-formatter](https://github.com/mspringjade/wechat-formatter)

---

如果这个项目对你有帮助，欢迎 Star 支持一下！
