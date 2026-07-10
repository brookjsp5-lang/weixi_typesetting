import { useCallback, useEffect, useRef, useState } from "react";
import { sanitizeAiTextOutput } from "../_lib/ai-output-utils";
import {
  createCoverTitleArea,
  createCoverTitleLayout,
  isCoverTitleOverlayEnabled,
  normalizeCoverTitleStyle,
  selectCoverTitle,
} from "../_lib/cover-title-layout";
import {
  createAppliedAiChange,
  extractJsonObject,
  resolveCoverGenerationConfig,
} from "../_lib/workflow-utils";
import {
  createPosterTextCardArea,
  isPosterTextCardEnabled,
  normalizePosterTextStyle,
} from "../_lib/poster-text-style";
import type {
  AiProviderType,
  AiTaskType,
  AppliedAiChange,
  CoverGenerationResult,
  CoverTitleStyle,
  FormatDraft,
  ImageTextMode,
  PodcastScriptResult,
  PosterGenerationResult,
  PosterLibraryItem,
  PosterTextBrief,
  PosterTextStyle,
  PromptTemplate,
  PublishOptimizationResult,
  RewriteDraft,
  RunningAiTaskType,
  VideoScriptResult,
} from "../_types/formatter";
import type { ShowToast } from "./use-toast";

type UseAiWorkflowParams = {
  inputText: string;
  setInputText: (value: string) => void;
  aiProviderType: AiProviderType;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  aiImageBaseUrl: string;
  aiImageApiKey: string;
  aiImageModel: string;
  coverTextMode: ImageTextMode;
  coverTitleStyle: CoverTitleStyle;
  coverPrompt: string;
  posterTextMode: ImageTextMode;
  posterTextStyle: PosterTextStyle;
  posterPrompt: string;
  posterPromptName?: string;
  onPosterGenerated?: (result: PosterLibraryItem) => void;
  setShowAiConfigModal: (value: boolean) => void;
  showToast: ShowToast;
};

type RequestAiTaskOptions = {
  emptyMessage?: string;
  emptyFallback?: string;
  maxAttempts?: number;
};

const readStreamText = async (body: ReadableStream<Uint8Array>) => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let streamedText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    streamedText += decoder.decode(value, { stream: true });
  }

  streamedText += decoder.decode();
  return streamedText.trim();
};

const normalizeStringArray = (value: unknown, limit: number) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, limit)
    : [];

const normalizePublishOptimization = (value: unknown): NonNullable<PublishOptimizationResult> => {
  const parsed = value as NonNullable<PublishOptimizationResult>;
  return {
    titles: Array.isArray(parsed.titles) ? parsed.titles.slice(0, 5) : [],
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
    suggestions: normalizeStringArray(parsed.suggestions, 6),
  };
};

const COVER_WIDTH = 1200;
const COVER_HEIGHT = 675;
const POSTER_WIDTH = 900;
const POSTER_HEIGHT = 1200;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片加载失败"));
    image.src = src;
  });

const fillRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
};

const hexToRgba = (hex: string, opacity: number) => {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#ffffff";
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${opacity})`;
};

const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) => {
  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;
  const drawHeight = imageRatio > canvasRatio ? height : width / imageRatio;
  const drawWidth = imageRatio > canvasRatio ? height * imageRatio : width;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
};

const drawWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  strokeStyle = "",
  strokeWidth = 0,
) => {
  const chars = Array.from(text.trim());
  const lines: string[] = [];
  let currentLine = "";

  for (const char of chars) {
    const nextLine = currentLine + char;
    if (ctx.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine;
      continue;
    }
    lines.push(currentLine);
    currentLine = char;
    if (lines.length >= maxLines) break;
  }
  if (currentLine && lines.length < maxLines) lines.push(currentLine);

  if (lines.length === maxLines && chars.join("").length > lines.join("").length) {
    const lastLine = lines[maxLines - 1] || "";
    let truncated = lastLine;
    while (truncated && ctx.measureText(`${truncated}…`).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    lines[maxLines - 1] = `${truncated}…`;
  }

  lines.forEach((line, index) => {
    const lineY = y + index * lineHeight;
    if (strokeStyle && strokeWidth > 0) {
      ctx.save();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(line, x, lineY);
      ctx.restore();
    }
    ctx.fillText(line, x, lineY);
  });
  return y + lines.length * lineHeight;
};

const createCoverTitleFont = (fontSize: number) =>
  `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif`;

const drawCoverTitle = (
  ctx: CanvasRenderingContext2D,
  title: string,
  coverTitleStyle: CoverTitleStyle,
) => {
  const normalizedStyle = normalizeCoverTitleStyle(coverTitleStyle);
  const layout = createCoverTitleLayout({
    title,
    area: createCoverTitleArea(normalizedStyle, COVER_WIDTH, COVER_HEIGHT),
    fontScalePercent: normalizedStyle.fontScalePercent,
    measureText: (text, fontSize) => {
      ctx.font = createCoverTitleFont(fontSize);
      return ctx.measureText(text).width;
    },
  });

  ctx.save();
  ctx.textBaseline = "top";
  ctx.font = createCoverTitleFont(layout.fontSize);
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = normalizedStyle.strokeColor;
  ctx.lineWidth = Math.max(5, Math.round(layout.fontSize * 0.1));
  ctx.fillStyle = normalizedStyle.textColor;
  ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  layout.lines.forEach((line, index) => {
    const y = layout.y + index * layout.lineHeight;
    ctx.strokeText(line, layout.x, y);
    ctx.fillText(line, layout.x, y);
  });
  ctx.restore();
};

const composeCoverImage = async (
  backgroundImageUrl: string,
  title: string,
  coverTitleStyle: CoverTitleStyle,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = COVER_WIDTH;
  canvas.height = COVER_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器不支持封面合成");

  const image = await loadImage(backgroundImageUrl);
  drawCoverImage(ctx, image, COVER_WIDTH, COVER_HEIGHT);

  if (isCoverTitleOverlayEnabled(coverTitleStyle)) {
    const overlay = ctx.createLinearGradient(0, 0, 880, 0);
    overlay.addColorStop(0, "rgba(248,250,252,0.9)");
    overlay.addColorStop(0.45, "rgba(248,250,252,0.68)");
    overlay.addColorStop(0.78, "rgba(248,250,252,0.24)");
    overlay.addColorStop(1, "rgba(248,250,252,0)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);

    drawCoverTitle(ctx, title || "公众号文章封面", coverTitleStyle);
  }

  return canvas.toDataURL("image/png");
};

const composePosterImage = async (
  backgroundImageUrl: string,
  brief: PosterTextBrief,
  posterTextStyle: PosterTextStyle,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器不支持贴图生成");

  const image = await loadImage(backgroundImageUrl);
  drawCoverImage(ctx, image, POSTER_WIDTH, POSTER_HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, 0, POSTER_HEIGHT);
  gradient.addColorStop(0, "rgba(255,255,255,0.35)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.10)");
  gradient.addColorStop(1, "rgba(12,18,32,0.55)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const normalizedStyle = normalizePosterTextStyle(posterTextStyle);
  const cardArea = createPosterTextCardArea(normalizedStyle, POSTER_WIDTH, POSTER_HEIGHT);
  const scale = normalizedStyle.fontScalePercent / 100;
  const cardHeight = Math.min(
    cardArea.maxHeight,
    Math.max(264, Math.round(356 * scale)),
  );
  const cardPaddingX = Math.round(48 * scale);
  const textX = cardArea.x + cardPaddingX;
  const textWidth = Math.max(260, cardArea.width - cardPaddingX * 2);
  const textY = cardArea.y + Math.round(72 * scale);
  const strokeWidth = Math.max(3, Math.round(4 * scale));

  if (isPosterTextCardEnabled(normalizedStyle)) {
    ctx.save();
    if (normalizedStyle.shadowEnabled) {
      ctx.shadowColor = "rgba(0,0,0,0.16)";
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 14;
    }
    ctx.fillStyle = hexToRgba(normalizedStyle.cardBackgroundColor, normalizedStyle.cardOpacity);
    fillRoundedRect(ctx, cardArea.x, cardArea.y, cardArea.width, cardHeight, 34);
    ctx.restore();
  } else if (normalizedStyle.shadowEnabled) {
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
  }

  ctx.fillStyle = normalizedStyle.titleColor;
  ctx.font = `900 ${Math.round(48 * scale)}px system-ui, -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif`;
  const titleBottom = drawWrappedText(
    ctx,
    brief.title,
    textX,
    textY,
    textWidth,
    Math.round(58 * scale),
    2,
    normalizedStyle.strokeColor,
    strokeWidth,
  );

  ctx.fillStyle = normalizedStyle.quoteColor;
  ctx.font = `900 ${Math.round(58 * scale)}px system-ui, -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif`;
  const quoteBottom = drawWrappedText(
    ctx,
    brief.quote,
    textX,
    titleBottom + Math.round(38 * scale),
    textWidth,
    Math.round(72 * scale),
    3,
    normalizedStyle.strokeColor,
    strokeWidth,
  );

  ctx.fillStyle = normalizedStyle.noteColor;
  ctx.font = `700 ${Math.round(28 * scale)}px system-ui, -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif`;
  const noteBottom = drawWrappedText(
    ctx,
    brief.note || "公众号贴图",
    textX,
    quoteBottom + Math.round(28 * scale),
    textWidth,
    Math.round(38 * scale),
    1,
  );

  ctx.shadowColor = "transparent";
  ctx.fillStyle = normalizedStyle.accentColor;
  const accentY = Math.min(cardArea.y + cardHeight - 46, noteBottom + Math.round(20 * scale));
  fillRoundedRect(
    ctx,
    textX,
    accentY,
    Math.round(88 * scale),
    Math.max(6, Math.round(10 * scale)),
    5,
  );

  return canvas.toDataURL("image/png");
};

export function useAiWorkflow({
  inputText,
  setInputText,
  aiProviderType,
  aiBaseUrl,
  aiApiKey,
  aiModel,
  aiImageBaseUrl,
  aiImageApiKey,
  aiImageModel,
  coverTextMode,
  coverTitleStyle,
  coverPrompt,
  posterTextMode,
  posterTextStyle,
  posterPrompt,
  posterPromptName = "",
  onPosterGenerated,
  setShowAiConfigModal,
  showToast,
}: UseAiWorkflowParams) {
  const [runningTask, setRunningTask] = useState<RunningAiTaskType | null>(null);
  const [formatDraft, setFormatDraft] = useState<FormatDraft>(null);
  const [hasAppliedFormat, setHasAppliedFormat] = useState(false);
  const [rewriteDraft, setRewriteDraft] = useState<RewriteDraft>(null);
  const [hasAppliedRewrite, setHasAppliedRewrite] = useState(false);
  const [appliedAiChange, setAppliedAiChange] = useState<AppliedAiChange>(null);
  const [publishOptimization, setPublishOptimization] = useState<PublishOptimizationResult>(null);
  const [coverGenerationResult, setCoverGenerationResult] = useState<CoverGenerationResult>(null);
  const [selectedCoverTitle, setSelectedCoverTitle] = useState("");
  const coverStyleKeyRef = useRef(JSON.stringify(normalizeCoverTitleStyle(coverTitleStyle)));
  const coverRecomposeVersionRef = useRef(0);
  const posterStyleKeyRef = useRef(JSON.stringify(normalizePosterTextStyle(posterTextStyle)));
  const posterRecomposeVersionRef = useRef(0);
  const [posterGenerationResult, setPosterGenerationResult] =
    useState<PosterGenerationResult>(null);
  const [podcastScript, setPodcastScript] = useState<PodcastScriptResult>(null);
  const [videoScript, setVideoScript] = useState<VideoScriptResult>(null);

  const requestAiTask = useCallback(
    async (taskType: AiTaskType, rewritePrompt = "", options: RequestAiTaskOptions = {}) => {
      if (!inputText.trim() || runningTask) return null;

      const trimmedBaseUrl = aiBaseUrl.trim();
      const trimmedApiKey = aiApiKey.trim();
      const trimmedModel = aiModel.trim();
      if (!trimmedBaseUrl || !trimmedApiKey || !trimmedModel) {
        setShowAiConfigModal(true);
        showToast("请先配置 AI 服务地址、API Key 和模型", "error");
        return null;
      }

      const maxAttempts = Math.max(1, options.maxAttempts || 2);
      setRunningTask(taskType);
      try {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const res = await fetch("/api/ai-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              markdown: inputText,
              providerType: aiProviderType,
              baseUrl: trimmedBaseUrl,
              apiKey: trimmedApiKey,
              model: trimmedModel,
              taskType,
              rewritePrompt,
            }),
          });

          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            showToast(data?.error || "AI 任务失败，请重试", "error");
            return null;
          }

          if (!res.body) {
            showToast("AI 服务未返回内容，请重试", "error");
            return null;
          }

          const result = sanitizeAiTextOutput(await readStreamText(res.body));
          if (result) return result;

          if (attempt < maxAttempts) continue;

          if (typeof options.emptyFallback === "string") {
            showToast(options.emptyMessage || "AI 返回内容为空，已使用当前内容继续处理");
            return options.emptyFallback;
          }

          showToast(options.emptyMessage || "AI 返回内容为空，请重试", "error");
          return null;
        }

        return null;
      } catch {
        showToast("网络错误，请稍后重试", "error");
        return null;
      } finally {
        setRunningTask(null);
      }
    },
    [
      inputText,
      runningTask,
      aiBaseUrl,
      aiApiKey,
      aiModel,
      setShowAiConfigModal,
      showToast,
      aiProviderType,
    ],
  );

  const runFormat = useCallback(async () => {
    const result = await requestAiTask("format");
    if (!result) return;
    const change = createAppliedAiChange({
      taskType: "format",
      original: inputText,
      applied: result,
      label: "AI 一键排版",
    });
    setInputText(result);
    setAppliedAiChange(change);
    setFormatDraft(null);
    setHasAppliedFormat(true);
    showToast("AI 排版已应用，可一键还原");
  }, [inputText, requestAiTask, setInputText, showToast]);

  const applyFormatDraft = useCallback(() => {
    if (!formatDraft) return;
    setInputText(formatDraft.formatted);
    setFormatDraft(null);
    setHasAppliedFormat(true);
    showToast("已应用 AI 排版");
  }, [formatDraft, setInputText, showToast]);

  const discardFormatDraft = useCallback(() => {
    setFormatDraft(null);
    showToast("已取消 AI 排版稿");
  }, [showToast]);

  const runRewrite = useCallback(
    async (promptTemplate?: PromptTemplate) => {
      if (!promptTemplate?.prompt.trim()) {
        showToast("请先选择提示词", "error");
        return;
      }
      const result = await requestAiTask("rewrite", promptTemplate.prompt);
      if (!result) return;
      const change = createAppliedAiChange({
        taskType: "rewrite",
        original: inputText,
        applied: result,
        label: promptTemplate.name,
      });
      setInputText(result);
      setAppliedAiChange(change);
      setRewriteDraft(null);
      setHasAppliedRewrite(true);
      showToast("改写已应用到初稿，可一键还原");
    },
    [inputText, requestAiTask, setInputText, showToast],
  );

  const applyRewriteDraft = useCallback(() => {
    if (!rewriteDraft) return;
    setInputText(rewriteDraft.rewritten);
    setRewriteDraft(null);
    setHasAppliedRewrite(true);
    showToast("已应用改写稿");
  }, [rewriteDraft, setInputText, showToast]);

  const restoreAppliedAiChange = useCallback(() => {
    if (!appliedAiChange) return;
    setInputText(appliedAiChange.original);
    if (appliedAiChange.taskType === "format") {
      setHasAppliedFormat(false);
    }
    if (appliedAiChange.taskType === "rewrite") {
      setHasAppliedRewrite(false);
    }
    setAppliedAiChange(null);
    showToast("已还原到 AI 处理前的初稿");
  }, [appliedAiChange, setInputText, showToast]);

  const applyPublishOptimizationResult = useCallback(
    (result: string) => {
      try {
        const optimization = normalizePublishOptimization(extractJsonObject(result));
        setPublishOptimization(optimization);
        if (!selectedCoverTitle && optimization.titles[0]) {
          setSelectedCoverTitle(optimization.titles[0]);
        }
        showToast("发布优化建议已生成");
        return optimization;
      } catch {
        showToast("AI 发布优化结果解析失败，请重试", "error");
        return null;
      }
    },
    [selectedCoverTitle, showToast],
  );

  const runPublishOptimize = useCallback(async () => {
    const result = await requestAiTask("publishOptimize");
    if (!result) return;
    applyPublishOptimizationResult(result);
  }, [applyPublishOptimizationResult, requestAiTask]);

  const requestCoverGeneration = useCallback(
    async (optimization: NonNullable<PublishOptimizationResult>) => {
      const imageConfig = resolveCoverGenerationConfig({
        textBaseUrl: aiBaseUrl,
        textApiKey: aiApiKey,
        imageBaseUrl: aiImageBaseUrl,
        imageApiKey: aiImageApiKey,
        imageModel: aiImageModel,
      });

      setRunningTask("cover");
      setCoverGenerationResult(null);
      try {
        const coverTitle = selectCoverTitle({
          selectedTitle: selectedCoverTitle,
          titles: optimization.titles,
        });
        if (!selectedCoverTitle && coverTitle) {
          setSelectedCoverTitle(coverTitle);
        }
        const res = await fetch("/api/ai-cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            markdown: inputText,
            providerType: aiProviderType,
            baseUrl: imageConfig.baseUrl,
            apiKey: imageConfig.apiKey,
            model: imageConfig.model,
            title: coverTitle,
            summary: optimization.summary,
            keywords: optimization.keywords,
            coverPrompt,
            textMode: coverTextMode,
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          result?: NonNullable<CoverGenerationResult>;
          error?: string;
        } | null;

        if (!res.ok || !data?.result) {
          showToast(
            data?.error || "当前模型不支持图片生成，请更换支持图片生成的模型或接口",
            "error",
          );
          return null;
        }

        const imageResult = data.result;
        const finalResult =
          coverTextMode === "canvas"
            ? {
                ...imageResult,
                imageUrl: await composeCoverImage(
                  imageResult.backgroundImageUrl || imageResult.imageUrl,
                  coverTitle,
                  coverTitleStyle,
                ),
                backgroundImageUrl: imageResult.backgroundImageUrl || imageResult.imageUrl,
                rawBackgroundImageUrl: imageResult.rawBackgroundImageUrl || imageResult.rawImageUrl,
                titleHint: coverTitle,
                textMode: "canvas" as const,
              }
            : {
                ...imageResult,
                titleHint: coverTitle,
                textMode: "model" as const,
              };

        setCoverGenerationResult(finalResult);
        showToast("封面图已生成");
        return finalResult;
      } catch {
        showToast("封面图生成失败，请检查模型接口后重试", "error");
        return null;
      } finally {
        setRunningTask(null);
      }
    },
    [
      aiBaseUrl,
      aiApiKey,
      aiImageBaseUrl,
      aiImageApiKey,
      aiImageModel,
      coverTextMode,
      coverTitleStyle,
      coverPrompt,
      showToast,
      inputText,
      aiProviderType,
      selectedCoverTitle,
    ],
  );

  const recomposeCoverTitle = useCallback(
    async (title: string) => {
      setSelectedCoverTitle(title);
      if (!coverGenerationResult || coverGenerationResult.textMode !== "canvas") return;

      const backgroundImageUrl = coverGenerationResult.backgroundImageUrl || coverGenerationResult.imageUrl;
      try {
        const imageUrl = await composeCoverImage(backgroundImageUrl, title, coverTitleStyle);
        setCoverGenerationResult({
          ...coverGenerationResult,
          imageUrl,
          titleHint: title,
          textMode: "canvas",
        });
        showToast("封面标题已更新");
      } catch {
        showToast("封面标题重绘失败，请重新生成封面", "error");
      }
    },
    [coverGenerationResult, coverTitleStyle, showToast],
  );

  useEffect(() => {
    const nextStyleKey = JSON.stringify(normalizeCoverTitleStyle(coverTitleStyle));
    if (coverStyleKeyRef.current === nextStyleKey) return;
    coverStyleKeyRef.current = nextStyleKey;

    if (!coverGenerationResult || coverGenerationResult.textMode !== "canvas") return;
    const backgroundImageUrl = coverGenerationResult.backgroundImageUrl;
    if (!backgroundImageUrl) return;

    const coverTitle =
      selectedCoverTitle || coverGenerationResult.titleHint || "\u516c\u4f17\u53f7\u6587\u7ae0\u5c01\u9762";
    const version = coverRecomposeVersionRef.current + 1;
    coverRecomposeVersionRef.current = version;

    composeCoverImage(backgroundImageUrl, coverTitle, coverTitleStyle)
      .then((imageUrl) => {
        if (coverRecomposeVersionRef.current !== version) return;
        setCoverGenerationResult((current) =>
          current && current.textMode === "canvas"
            ? {
                ...current,
                imageUrl,
                titleHint: coverTitle,
                textMode: "canvas",
              }
            : current,
        );
      })
      .catch(() => {
        if (coverRecomposeVersionRef.current === version) {
          showToast("\u5c01\u9762\u6807\u9898\u6837\u5f0f\u66f4\u65b0\u5931\u8d25\uff0c\u8bf7\u91cd\u65b0\u751f\u6210\u5c01\u9762", "error");
        }
      });
  }, [
    coverGenerationResult?.backgroundImageUrl,
    coverGenerationResult?.textMode,
    coverGenerationResult?.titleHint,
    coverTitleStyle,
    selectedCoverTitle,
    showToast,
  ]);

  useEffect(() => {
    const normalizedStyle = normalizePosterTextStyle(posterTextStyle);
    const nextStyleKey = JSON.stringify(normalizedStyle);
    if (posterStyleKeyRef.current === nextStyleKey) return;
    posterStyleKeyRef.current = nextStyleKey;

    if (!posterGenerationResult || posterGenerationResult.textMode !== "canvas") return;
    const backgroundImageUrl = posterGenerationResult.backgroundImageUrl;
    if (!backgroundImageUrl) return;

    const version = posterRecomposeVersionRef.current + 1;
    posterRecomposeVersionRef.current = version;

    composePosterImage(backgroundImageUrl, posterGenerationResult.brief, normalizedStyle)
      .then((imageUrl) => {
        if (posterRecomposeVersionRef.current !== version) return;
        setPosterGenerationResult((current) =>
          current && current.textMode === "canvas"
            ? {
                ...current,
                imageUrl,
                posterTextStyle: normalizedStyle,
              }
            : current,
        );
      })
      .catch(() => {
        if (posterRecomposeVersionRef.current === version) {
          showToast("贴图文字样式更新失败，请重新生成贴图", "error");
        }
      });
  }, [
    posterGenerationResult?.backgroundImageUrl,
    posterGenerationResult?.brief,
    posterGenerationResult?.textMode,
    posterTextStyle,
    showToast,
  ]);

  const runCoverGeneration = useCallback(async () => {
    if (!inputText.trim()) {
      showToast("请先填写初稿内容", "error");
      return;
    }

    if (runningTask) return;

    let optimization = publishOptimization;
    if (!optimization) {
      const result = await requestAiTask("publishOptimize");
      if (!result) return;
      optimization = applyPublishOptimizationResult(result);
      if (!optimization) return;
    }

    await requestCoverGeneration(optimization);
  }, [
    inputText,
    runningTask,
    publishOptimization,
    requestAiTask,
    applyPublishOptimizationResult,
    requestCoverGeneration,
    showToast,
  ]);

  const runPosterGeneration = useCallback(async () => {
    if (!inputText.trim()) {
      showToast("请先填写初稿内容", "error");
      return;
    }

    if (runningTask) return;

    const trimmedTextBaseUrl = aiBaseUrl.trim();
    const trimmedTextApiKey = aiApiKey.trim();
    const trimmedTextModel = aiModel.trim();
    if (!trimmedTextBaseUrl || !trimmedTextApiKey || !trimmedTextModel) {
      setShowAiConfigModal(true);
      showToast("请先配置文本模型，用于提炼贴图文案", "error");
      return;
    }

    const imageConfig = resolveCoverGenerationConfig({
      textBaseUrl: aiBaseUrl,
      textApiKey: aiApiKey,
      imageBaseUrl: aiImageBaseUrl,
      imageApiKey: aiImageApiKey,
      imageModel: aiImageModel,
    });

    if (!imageConfig.baseUrl || !imageConfig.apiKey || !imageConfig.model) {
      setShowAiConfigModal(true);
      showToast("请先配置生图 API，用于生成贴图背景", "error");
      return;
    }

    setRunningTask("poster");
    setPosterGenerationResult(null);

    try {
      const briefResponse = await fetch("/api/ai-poster-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: inputText,
          providerType: aiProviderType,
          baseUrl: trimmedTextBaseUrl,
          apiKey: trimmedTextApiKey,
          model: trimmedTextModel,
          posterPrompt,
        }),
      });
      const briefData = (await briefResponse.json().catch(() => null)) as {
        result?: PosterTextBrief;
        error?: string;
      } | null;

      if (!briefResponse.ok || !briefData?.result) {
        showToast(briefData?.error || "贴图文案生成失败，请重试", "error");
        return;
      }

      const posterResponse = await fetch("/api/ai-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: inputText,
          providerType: aiProviderType,
          baseUrl: imageConfig.baseUrl,
          apiKey: imageConfig.apiKey,
          model: imageConfig.model,
          brief: briefData.result,
          posterPrompt,
          textMode: posterTextMode,
        }),
      });
      const posterData = (await posterResponse.json().catch(() => null)) as {
        result?: {
          backgroundImageUrl: string;
          prompt: string;
          brief: PosterTextBrief;
          textMode?: ImageTextMode;
          titleHint?: string;
          createdAt: string;
          source?: "ai";
          warning?: string;
        };
        error?: string;
      } | null;

      if (!posterResponse.ok || !posterData?.result?.backgroundImageUrl) {
        showToast(posterData?.error || "贴图背景生成失败，请重试", "error");
        return;
      }

      const normalizedStyle = normalizePosterTextStyle(posterTextStyle);
      const imageUrl =
        posterTextMode === "canvas"
          ? await composePosterImage(
              posterData.result.backgroundImageUrl,
              posterData.result.brief,
              normalizedStyle,
            )
          : posterData.result.backgroundImageUrl;
      const posterResult = {
        ...posterData.result,
        imageUrl,
        textMode: posterTextMode,
        titleHint: posterData.result.titleHint || posterData.result.brief.title,
        posterTextStyle: posterTextMode === "canvas" ? normalizedStyle : undefined,
      };
      setPosterGenerationResult(posterResult);
      onPosterGenerated?.({
        ...posterResult,
        articleTitle: inputText.match(/^#\s+(.+)$/m)?.[1]?.trim() || "未命名文章",
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        posterPromptName: posterPromptName || "当前贴图提示词",
      });
      showToast("公众号贴图已生成");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      showToast(message || "公众号贴图生成失败，请检查配置后重试", "error");
    } finally {
      setRunningTask(null);
    }
  }, [
    inputText,
    runningTask,
    aiBaseUrl,
    aiApiKey,
    aiModel,
    aiImageBaseUrl,
    aiImageApiKey,
    aiImageModel,
    aiProviderType,
    posterTextMode,
    posterTextStyle,
    posterPrompt,
    posterPromptName,
    onPosterGenerated,
    setShowAiConfigModal,
    showToast,
  ]);

  const runPodcastScript = useCallback(async () => {
    if (!inputText.trim()) {
      showToast("请先填写初稿内容", "error");
      return;
    }

    if (runningTask) return;

    const trimmedBaseUrl = aiBaseUrl.trim();
    const trimmedApiKey = aiApiKey.trim();
    const trimmedModel = aiModel.trim();
    if (!trimmedBaseUrl || !trimmedApiKey || !trimmedModel) {
      setShowAiConfigModal(true);
      showToast("请先配置文本模型，用于生成播客脚本", "error");
      return;
    }

    setRunningTask("podcast");
    try {
      const res = await fetch("/api/ai-podcast-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: inputText,
          providerType: aiProviderType,
          baseUrl: trimmedBaseUrl,
          apiKey: trimmedApiKey,
          model: trimmedModel,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        result?: NonNullable<PodcastScriptResult>;
        error?: string;
      } | null;

      if (!res.ok || !data?.result) {
        showToast(data?.error || "AI 播客脚本生成失败，请重试", "error");
        return;
      }

      setPodcastScript(data.result);
      showToast("AI 播客脚本已生成");
    } catch {
      showToast("AI 播客脚本生成失败，请检查模型配置后重试", "error");
    } finally {
      setRunningTask(null);
    }
  }, [
    inputText,
    runningTask,
    aiBaseUrl,
    aiApiKey,
    aiModel,
    aiProviderType,
    setShowAiConfigModal,
    showToast,
  ]);

  const runVideoScript = useCallback(async () => {
    if (!inputText.trim()) {
      showToast("请先填写初稿内容", "error");
      return;
    }

    if (runningTask) return;

    const trimmedBaseUrl = aiBaseUrl.trim();
    const trimmedApiKey = aiApiKey.trim();
    const trimmedModel = aiModel.trim();
    if (!trimmedBaseUrl || !trimmedApiKey || !trimmedModel) {
      setShowAiConfigModal(true);
      showToast("请先配置文本模型，用于生成视频分镜", "error");
      return;
    }

    setRunningTask("video");
    try {
      const res = await fetch("/api/ai-video-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: inputText,
          providerType: aiProviderType,
          baseUrl: trimmedBaseUrl,
          apiKey: trimmedApiKey,
          model: trimmedModel,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        result?: NonNullable<VideoScriptResult>;
        error?: string;
      } | null;

      if (!res.ok || !data?.result) {
        showToast(data?.error || "AI 视频分镜生成失败，请重试", "error");
        return;
      }

      setVideoScript(data.result);
      showToast("AI 视频分镜已生成");
    } catch {
      showToast("AI 视频分镜生成失败，请检查模型配置后重试", "error");
    } finally {
      setRunningTask(null);
    }
  }, [
    inputText,
    runningTask,
    aiBaseUrl,
    aiApiKey,
    aiModel,
    aiProviderType,
    setShowAiConfigModal,
    showToast,
  ]);

  return {
    runningTask,
    isAiFormatting: runningTask === "format",
    formatDraft,
    setFormatDraft,
    hasAppliedFormat,
    rewriteDraft,
    setRewriteDraft,
    hasAppliedRewrite,
    appliedAiChange,
    publishOptimization,
    setPublishOptimization,
    coverGenerationResult,
    setCoverGenerationResult,
    selectedCoverTitle,
    setSelectedCoverTitle,
    recomposeCoverTitle,
    hasGeneratedCover: Boolean(coverGenerationResult?.imageUrl?.trim()),
    posterGenerationResult,
    setPosterGenerationResult,
    hasGeneratedPoster: Boolean(posterGenerationResult?.imageUrl?.trim()),
    podcastScript,
    setPodcastScript,
    videoScript,
    setVideoScript,
    runFormat,
    applyFormatDraft,
    discardFormatDraft,
    runRewrite,
    applyRewriteDraft,
    restoreAppliedAiChange,
    runPublishOptimize,
    runCoverGeneration,
    runPosterGeneration,
    runPodcastScript,
    runVideoScript,
  };
}
