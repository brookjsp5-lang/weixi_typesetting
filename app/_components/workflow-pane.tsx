import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Download,
  FileCheck2,
  Image as ImageIcon,
  Loader2,
  Mic2,
  PenLine,
  Send,
  Settings,
  Sparkles,
  Tags,
  Trash2,
  Undo2,
  Video,
  Wand2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type {
  ActiveTab,
  AppliedAiChange,
  CoverGenerationResult,
  CoverTitleStyle,
  CoverPromptTemplate,
  FormatTweaks,
  ImageTextMode,
  PodcastScriptResult,
  PosterGenerationResult,
  PosterLibraryItem,
  PosterPromptTemplate,
  PosterTextStyle,
  PromptTemplate,
  PublishCheckItem,
  PublishOptimizationResult,
  PublishStepId,
  PublishWorkflowStep,
  RunningAiTaskType,
  VideoScriptResult,
  WorkflowModuleId,
  WordCount,
} from "../_types/formatter";
import type { TemplateConfig } from "../template-engine";
import { SettingsPane } from "./settings-pane";

type TemplateGroup = {
  id: string;
  name: string;
  templates: TemplateConfig[];
};

type WorkflowPaneProps = {
  activeTab: ActiveTab;
  publishStep: PublishStepId;
  setPublishStep: React.Dispatch<React.SetStateAction<PublishStepId>>;
  inputText: string;
  wordCount: WordCount;
  runningTask: RunningAiTaskType | null;
  publishWorkflowSteps: PublishWorkflowStep[];
  onAiFormat: () => void;
  onRewrite: (promptTemplate?: PromptTemplate) => void;
  hasAppliedRewrite: boolean;
  appliedAiChange: AppliedAiChange;
  onRestoreAiChange: () => void;
  onPublishOptimize: () => void;
  onGenerateCover: () => void;
  onGeneratePoster: () => void;
  coverGenerationResult: CoverGenerationResult;
  coverTextMode: ImageTextMode;
  setCoverTextMode: React.Dispatch<React.SetStateAction<ImageTextMode>>;
  coverTitleStyle: CoverTitleStyle;
  onCoverTitleStyleChange: (style: CoverTitleStyle) => void;
  onResetCoverTitleStyle: () => void;
  selectedCoverTitle: string;
  onSelectCoverTitle: (title: string) => void;
  posterGenerationResult: PosterGenerationResult;
  posterTextMode: ImageTextMode;
  setPosterTextMode: React.Dispatch<React.SetStateAction<ImageTextMode>>;
  posterManualText: string;
  setPosterManualText: React.Dispatch<React.SetStateAction<string>>;
  posterTextStyle: PosterTextStyle;
  onPosterTextStyleChange: (style: PosterTextStyle) => void;
  onResetPosterTextStyle: () => void;
  coverGenerationConfigStatus: {
    isConfigured: boolean;
    message: string;
  };
  onOpenAiConfig: () => void;
  promptTemplates: PromptTemplate[];
  selectedPrompt?: PromptTemplate;
  selectedPromptId: string;
  setSelectedPromptId: React.Dispatch<React.SetStateAction<string>>;
  onSavePrompt: (draft: Pick<PromptTemplate, "id" | "name" | "prompt">) => void;
  onDeletePrompt: (id: string) => void;
  coverPromptTemplates: CoverPromptTemplate[];
  selectedCoverPrompt?: CoverPromptTemplate;
  selectedCoverPromptId: string;
  setSelectedCoverPromptId: React.Dispatch<React.SetStateAction<string>>;
  onSaveCoverPrompt: (draft: Pick<CoverPromptTemplate, "id" | "name" | "prompt">) => void;
  onDeleteCoverPrompt: (id: string) => void;
  posterPromptTemplates: PosterPromptTemplate[];
  selectedPosterPrompt?: PosterPromptTemplate;
  selectedPosterPromptId: string;
  setSelectedPosterPromptId: React.Dispatch<React.SetStateAction<string>>;
  onSavePosterPrompt: (draft: Pick<PosterPromptTemplate, "id" | "name" | "prompt">) => void;
  onDeletePosterPrompt: (id: string) => void;
  posterLibraryItems: PosterLibraryItem[];
  isLoadingPosterLibrary: boolean;
  onDeletePosterLibraryItem: (id: string) => void;
  onClearPosterLibrary: () => void;
  publishChecks: PublishCheckItem[];
  publishOptimization: PublishOptimizationResult;
  onCopy: () => void;
  allTemplatesCount: number;
  groupedTemplates: TemplateGroup[];
  currentCategory: string;
  setCurrentCategory: React.Dispatch<React.SetStateAction<string>>;
  currentTemplateId: string;
  setCurrentTemplateId: React.Dispatch<React.SetStateAction<string>>;
  formatTweaks: FormatTweaks;
  setFormatTweaks: React.Dispatch<React.SetStateAction<FormatTweaks>>;
  onResetFormatTweaks: () => void;
  syncScroll: boolean;
  setSyncScroll: React.Dispatch<React.SetStateAction<boolean>>;
  podcastScript: PodcastScriptResult;
  onGeneratePodcastScript: () => void;
  videoScript: VideoScriptResult;
  onGenerateVideoScript: () => void;
};

const publishStepOrder: PublishStepId[] = [
  "draft",
  "rewrite",
  "format",
  "image",
  "check",
  "publish",
];

const workflowModules: Array<{
  id: WorkflowModuleId;
  label: string;
  description: string;
}> = [
  { id: "guide", label: "发布向导", description: "一步步完成正文发布" },
  { id: "poster", label: "公众号贴图", description: "输入文字并生成贴图" },
];

const coverTitleTextColors = ["#050816", "#111827", "#ffffff", "#f8fafc", "#e11d48", "#2563eb"];
const coverTitleStrokeColors = ["#ffffff", "#f8fafc", "#111827", "#000000", "#dbeafe", "#fee2e2"];
const posterTextColors = ["#050816", "#111827", "#ffffff", "#f8fafc", "#2563eb", "#e11d48"];
const posterMutedTextColors = ["#4b5563", "#64748b", "#ffffff", "#f8fafc", "#475569", "#7c2d12"];
const posterAccentColors = ["#10b981", "#22c55e", "#2563eb", "#e11d48", "#f59e0b", "#111827"];
const posterCardColors = ["#ffffff", "#f8fafc", "#fff7ed", "#ecfeff", "#111827", "#000000"];

const workflowStepClassNames = {
  done: "border-emerald-300 bg-emerald-50 text-emerald-700",
  active: "border-(--neo-green) bg-white text-[#065f46] shadow-sm",
  warning: "border-amber-300 bg-amber-50 text-amber-800",
  pending: "border-(--neo-line) bg-white/75 text-(--neo-muted)",
} as const;

const workflowStepStatusLabels = {
  done: "完成",
  active: "待确认",
  warning: "提醒",
  pending: "待处理",
} as const;

const statusClassNames = {
  success: "bg-(--neo-green)",
  warning: "bg-(--neo-yellow)",
  neutral: "bg-(--neo-surface)",
} as const;

const stepDescriptions: Record<PublishStepId, string> = {
  draft: "先把正文放到左侧初稿。",
  rewrite: "需要润色时，选提示词改写；不满意可还原。",
  format: "用 AI 整理结构，再选择模板和样式。",
  image: "生成公众号封面图，并同步准备标题、摘要和关键词。",
  check: "生成标题、摘要和关键词。",
  publish: "复制正文到公众号后台，发布前再检查一遍。",
};

function StepActions({
  currentStep,
  setPublishStep,
}: {
  currentStep: PublishStepId;
  setPublishStep: React.Dispatch<React.SetStateAction<PublishStepId>>;
}) {
  const currentIndex = publishStepOrder.indexOf(currentStep);
  const previousStep = publishStepOrder[currentIndex - 1];
  const nextStep = publishStepOrder[currentIndex + 1];

  return (
    <div className="flex gap-2 pt-1">
      <button
        type="button"
        disabled={!previousStep}
        onClick={() => previousStep && setPublishStep(previousStep)}
        className="neo-button neo-button-ghost flex-1 py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        上一步
      </button>
      <button
        type="button"
        disabled={!nextStep}
        onClick={() => nextStep && setPublishStep(nextStep)}
        className="neo-button neo-button-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
      >
        下一步
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CompletionCard({ done, text }: { done: boolean; text: string }) {
  return (
    <section
      className={`rounded-xl border p-3 text-xs font-bold leading-relaxed ${
        done
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-(--neo-line) bg-white neo-text-muted"
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black text-(--neo-ink)">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {done ? "本步已完成" : "本步完成条件"}
      </div>
      {text}
    </section>
  );
}

function PosterColorControl({
  label,
  value,
  colors,
  onChange,
}: {
  label: string;
  value: string;
  colors: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-black">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`${label} ${color}`}
            onClick={() => onChange(color)}
            className={`h-7 w-7 rounded-full border ${
              value === color
                ? "border-(--neo-green) ring-2 ring-emerald-200"
                : "border-(--neo-line)"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-(--neo-line) bg-white p-1"
      />
    </div>
  );
}

function AppliedAiChangeCard({
  change,
  onRestore,
}: {
  change: NonNullable<AppliedAiChange>;
  onRestore: () => void;
}) {
  return (
    <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black text-(--neo-ink)">
            已直接应用：{change.taskType === "format" ? "AI 排版" : "AI 改写"}
          </div>
          <p className="mt-1 leading-relaxed">
            当前左侧初稿已更新。不满意可以还原到这次 AI 处理前的内容。
          </p>
        </div>
        <button
          type="button"
          onClick={onRestore}
          className="neo-button neo-button-ghost shrink-0 px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
        >
          <Undo2 className="h-3.5 w-3.5" />
          还原
        </button>
      </div>
    </section>
  );
}

function CoverResultCard({
  coverGenerationResult,
  runningTask,
  onCopyText,
  onCopyImage,
  copiedMaterialIds,
}: {
  coverGenerationResult: CoverGenerationResult;
  runningTask: RunningAiTaskType | null;
  onCopyText: (text: string, id: string) => void;
  onCopyImage: (imageUrl: string, id: string) => void;
  copiedMaterialIds: string[];
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const imageUrl = coverGenerationResult?.imageUrl?.trim() || "";

  if (runningTask === "cover" || runningTask === "publishOptimize") {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        <div className="mb-2 flex items-center gap-2 text-(--neo-ink)">
          <Loader2 className="h-4 w-4 animate-spin" />
          封面图结果
        </div>
        正在生成，完成后会在这里直接显示封面图。
      </section>
    );
  }

  if (!coverGenerationResult) {
    return (
      <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-4 text-sm font-bold neo-text-muted">
        <div className="mb-2 flex items-center gap-2 text-(--neo-ink)">
          <ImageIcon className="h-4 w-4" />
          封面图结果
        </div>
        尚未生成封面图。点击上方“生成封面图”后，图片会显示在这里。
      </section>
    );
  }

  if (!imageUrl || hasImageError) {
    return (
      <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-800">
        <div className="mb-2 flex items-center gap-2 text-(--neo-ink)">
          <ImageIcon className="h-4 w-4" />
          封面图结果
        </div>
        {hasImageError
          ? "图片地址已返回，但浏览器加载失败。请重新生成，或检查生图接口返回的图片链接是否可访问。"
          : "接口返回了生成结果，但没有可显示的图片地址。请更换支持图片生成的模型后重试。"}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
      <h3 className="text-xs font-black flex items-center gap-1.5">
        <ImageIcon className="h-3.5 w-3.5" />
        封面图结果
      </h3>
      {coverGenerationResult.warning && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs font-bold leading-relaxed text-amber-800">
          {coverGenerationResult.warning}
        </div>
      )}
      <img
        src={imageUrl}
        alt="公众号封面图"
        onError={() => setHasImageError(true)}
        className="aspect-video w-full rounded-lg border border-(--neo-line) object-cover bg-white"
      />
      <div className="rounded-lg border border-(--neo-line) bg-white p-2 text-[11px] font-bold leading-relaxed neo-text-muted">
        {coverGenerationResult.textMode === "canvas"
          ? `标题由 WX 融合叠加：${coverGenerationResult.titleHint || "公众号文章封面"}`
          : "标题由模型直接生成，文字准确性取决于模型能力。"}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={imageUrl}
          download="wx-cover.png"
          className="neo-button neo-button-secondary flex-1 py-1.5 text-center text-xs inline-flex items-center justify-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          下载封面
        </a>
        <button
          type="button"
          onClick={() => onCopyImage(imageUrl, "cover-image")}
          className="neo-button neo-button-secondary flex-1 py-1.5 text-xs inline-flex items-center justify-center gap-1.5"
        >
          <Clipboard className="h-3.5 w-3.5" />
          {copiedMaterialIds.includes("cover-image") ? "封面已复制" : "复制封面"}
        </button>
        <button
          type="button"
          onClick={() => onCopyText(coverGenerationResult.prompt, "cover-prompt")}
          className="neo-button neo-button-ghost col-span-2 py-1.5 text-xs"
        >
          {copiedMaterialIds.includes("cover-prompt") ? "提示词已复制" : "复制提示词"}
        </button>
      </div>
    </section>
  );
}

function PosterResultCard({
  posterGenerationResult,
  runningTask,
  onCopyText,
  onCopyImage,
  copiedMaterialIds,
  onRegenerate,
}: {
  posterGenerationResult: PosterGenerationResult;
  runningTask: RunningAiTaskType | null;
  onCopyText: (text: string, id: string) => void;
  onCopyImage: (imageUrl: string, id: string) => void;
  copiedMaterialIds: string[];
  onRegenerate: () => void;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const imageUrl = posterGenerationResult?.imageUrl?.trim() || "";
  const posterTextContent = posterGenerationResult?.brief.quote || posterGenerationResult?.brief.title || "";

  if (runningTask === "poster") {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        <div className="mb-2 flex items-center gap-2 text-(--neo-ink)">
          <Loader2 className="h-4 w-4 animate-spin" />
          公众号贴图结果
        </div>
        正在根据贴图文字生成背景并合成图片，完成后会在这里显示竖版贴图。
      </section>
    );
  }

  if (!posterGenerationResult) {
    return (
      <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-4 text-sm font-bold neo-text-muted">
        <div className="mb-2 flex items-center gap-2 text-(--neo-ink)">
          <ImageIcon className="h-4 w-4" />
          公众号贴图结果
        </div>
        尚未生成贴图。填写贴图文字并点击“生成公众号贴图”后，竖版图片会显示在这里。
      </section>
    );
  }

  if (!imageUrl || hasImageError) {
    return (
      <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-800">
        <div className="mb-2 flex items-center gap-2 text-(--neo-ink)">
          <ImageIcon className="h-4 w-4" />
          公众号贴图结果
        </div>
        贴图已生成，但图片加载失败。请重新生成，或检查生图接口返回的背景图是否可访问。
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
      <h3 className="text-xs font-black flex items-center gap-1.5">
        <ImageIcon className="h-3.5 w-3.5" />
        公众号贴图结果
      </h3>
      {posterGenerationResult.warning && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs font-bold leading-relaxed text-amber-800">
          {posterGenerationResult.warning}
        </div>
      )}
      <img
        src={imageUrl}
        alt="公众号贴图"
        onError={() => setHasImageError(true)}
        className="mx-auto aspect-[3/4] max-h-[520px] w-full max-w-[390px] rounded-lg border border-(--neo-line) object-cover bg-white"
      />
      <div className="rounded-lg border border-(--neo-line) bg-white p-3 text-xs font-bold leading-relaxed">
        <div className="mb-2 neo-text-muted">
          {posterGenerationResult.textMode === "canvas"
            ? "中文由 TypeZen 工具叠加，可调整样式后自动重绘。"
            : "中文由模型直接生成，文字准确性取决于模型能力。"}
        </div>
        <div className="text-[11px] font-black neo-text-muted">贴图文字内容</div>
        <div className="mt-1 whitespace-pre-wrap text-(--neo-ink)">{posterTextContent}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={imageUrl}
          download="wx-poster.png"
          className="neo-button neo-button-secondary py-1.5 text-center text-xs inline-flex items-center justify-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          下载贴图
        </a>
        <button
          type="button"
          onClick={() => onCopyImage(imageUrl, "poster-image")}
          className="neo-button neo-button-secondary py-1.5 text-xs"
        >
          {copiedMaterialIds.includes("poster-image") ? "贴图已复制" : "复制贴图"}
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          className="neo-button neo-button-secondary py-1.5 text-xs"
        >
          重新生成
        </button>
        <button
          type="button"
          onClick={() => onCopyText(posterGenerationResult.prompt, "poster-prompt")}
          className="neo-button neo-button-ghost py-1.5 text-xs"
        >
          {copiedMaterialIds.includes("poster-prompt") ? "提示词已复制" : "复制生图提示词"}
        </button>
      </div>
    </section>
  );
}

function PosterLibrary({
  items,
  isLoading,
  onCopyText,
  copiedMaterialIds,
  onDelete,
  onClear,
}: {
  items: PosterLibraryItem[];
  isLoading: boolean;
  onCopyText: (text: string, id: string) => void;
  copiedMaterialIds: string[];
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black">历史贴图库</h3>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="neo-button neo-button-ghost px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            清空
          </button>
        )}
      </div>

      {isLoading && <p className="text-xs font-bold neo-text-muted">正在读取本地图库...</p>}

      {!isLoading && items.length === 0 && (
        <p className="text-xs font-bold leading-relaxed neo-text-muted">
          生成后的公众号贴图会保存在这里，方便后续下载和复用提示词。
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-(--neo-line) bg-white p-2 space-y-2"
          >
            <img
              src={item.imageUrl}
              alt={item.brief.title}
              className="aspect-[3/4] w-full rounded-lg border border-(--neo-line) object-cover"
            />
            <div className="text-[11px] font-black line-clamp-2">{item.brief.title}</div>
            <div className="flex gap-1.5">
              <a
                href={item.imageUrl}
                download="wx-poster.png"
                className="neo-button neo-button-secondary flex-1 px-2 py-1 text-[10px] text-center"
              >
                下载
              </a>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="neo-button neo-button-ghost px-2 py-1 text-[10px]"
              >
                删除
              </button>
            </div>
            <button
              type="button"
              onClick={() => onCopyText(item.prompt, `poster-library:${item.id}`)}
              className="neo-button neo-button-ghost w-full px-2 py-1 text-[10px]"
            >
              {copiedMaterialIds.includes(`poster-library:${item.id}`) ? "已复制" : "复制提示词"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function PublishMaterials({
  publishOptimization,
  coverGenerationResult,
  onCopyText,
  onCopyImage,
  copiedMaterialIds,
  showCover = true,
  compact = false,
}: {
  publishOptimization: PublishOptimizationResult;
  coverGenerationResult: CoverGenerationResult;
  onCopyText: (text: string, id: string) => void;
  onCopyImage: (imageUrl: string, id: string) => void;
  copiedMaterialIds: string[];
  showCover?: boolean;
  compact?: boolean;
}) {
  const coverSection =
    showCover && coverGenerationResult?.imageUrl?.trim() ? (
      <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
        <h3 className="text-xs font-black flex items-center gap-1.5">封面图</h3>
        {coverGenerationResult.warning && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs font-bold leading-relaxed text-amber-800">
            {coverGenerationResult.warning}
          </div>
        )}
        <img
          src={coverGenerationResult.imageUrl}
          alt="公众号封面图"
          className="aspect-video w-full rounded-lg border border-(--neo-line) object-cover bg-white"
        />
        <div className="grid grid-cols-2 gap-2">
          <a
            href={coverGenerationResult.imageUrl}
            download="wx-cover.png"
            className="neo-button neo-button-secondary flex-1 py-1.5 text-center text-xs inline-flex items-center justify-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            下载封面
          </a>
          <button
            type="button"
            onClick={() => onCopyImage(coverGenerationResult.imageUrl, "cover-image")}
            className="neo-button neo-button-secondary flex-1 py-1.5 text-xs inline-flex items-center justify-center gap-1.5"
          >
            <Clipboard className="h-3.5 w-3.5" />
            {copiedMaterialIds.includes("cover-image") ? "封面已复制" : "复制封面"}
          </button>
          <button
            type="button"
            onClick={() => onCopyText(coverGenerationResult.prompt, "cover-prompt")}
            className="neo-button neo-button-ghost col-span-2 py-1.5 text-xs"
          >
            {copiedMaterialIds.includes("cover-prompt") ? "提示词已复制" : "复制提示词"}
          </button>
        </div>
      </section>
    ) : null;

  if (!publishOptimization) {
    return (
      <div className="space-y-3">
        {coverSection}
        <div className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-4 text-sm font-bold neo-text-muted">
          生成后会显示标题候选、摘要和关键词。
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {coverSection}

      <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
        <h3 className="text-xs font-black">标题候选</h3>
        {publishOptimization.titles.map((title) => (
          <button
            key={title}
            type="button"
            onClick={() => onCopyText(title, `title:${title}`)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-(--neo-line) p-2 text-left text-xs font-bold hover:bg-(--neo-cyan)"
          >
            <span>{title}</span>
            {copiedMaterialIds.includes(`title:${title}`) && (
              <span className="shrink-0 text-[10px] text-emerald-700">已复制</span>
            )}
          </button>
        ))}
      </section>

      <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
        <h3 className="text-xs font-black">摘要</h3>
        <p className="text-xs neo-text-muted font-bold leading-relaxed">
          {publishOptimization.summary}
        </p>
        <button
          type="button"
          onClick={() => onCopyText(publishOptimization.summary, "summary")}
          className="neo-button neo-button-ghost px-3 py-1.5 text-xs"
        >
          {copiedMaterialIds.includes("summary") ? "摘要已复制" : "复制摘要"}
        </button>
      </section>

      <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
        <h3 className="text-xs font-black flex items-center gap-1.5">
          <Tags className="w-3.5 h-3.5" />
          关键词/标签
        </h3>
        <div className="flex flex-wrap gap-2">
          {publishOptimization.keywords.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => onCopyText(keyword, `keyword:${keyword}`)}
              className="rounded-full border border-(--neo-line) bg-(--neo-cyan) px-2 py-1 text-xs font-bold text-(--neo-ink)"
            >
              {keyword}
              {copiedMaterialIds.includes(`keyword:${keyword}`) ? " · 已复制" : ""}
            </button>
          ))}
        </div>
      </section>

      {!compact && publishOptimization.suggestions.length > 0 && (
        <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
          <h3 className="text-xs font-black">发布建议</h3>
          <div className="space-y-2">
            {publishOptimization.suggestions.map((suggestion) => (
              <p key={suggestion} className="text-xs neo-text-muted font-bold leading-relaxed">
                {suggestion}
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PublishChecklist({
  hasCopiedBody,
  publishOptimization,
  coverGenerationResult,
  copiedMaterialIds,
}: {
  hasCopiedBody: boolean;
  publishOptimization: PublishOptimizationResult;
  coverGenerationResult: CoverGenerationResult;
  copiedMaterialIds: string[];
}) {
  const checklist = [
    { label: "正文 HTML", done: hasCopiedBody, doneLabel: "已复制", pendingLabel: "待复制" },
    {
      label: "封面图",
      done: copiedMaterialIds.includes("cover-image"),
      doneLabel: "已复制",
      pendingLabel: coverGenerationResult ? "待复制" : "待生成",
    },
    {
      label: "标题",
      done: copiedMaterialIds.some((id) => id.startsWith("title:")),
      doneLabel: "已复制",
      pendingLabel: "待复制",
    },
    {
      label: "摘要",
      done: copiedMaterialIds.includes("summary"),
      doneLabel: "已复制",
      pendingLabel: "待复制",
    },
    {
      label: "关键词",
      done: copiedMaterialIds.some((id) => id.startsWith("keyword:")),
      doneLabel: "已复制",
      pendingLabel: "待复制",
    },
  ];

  return (
    <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
      <h3 className="text-xs font-black">发布复制清单</h3>
      {!publishOptimization && (
        <p className="text-xs font-bold leading-relaxed neo-text-muted">
          先生成发布物料后，可逐项复制标题、摘要和关键词。
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {checklist.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-2 text-xs font-bold ${
              item.done
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-(--neo-line) bg-white neo-text-muted"
            }`}
          >
            {item.done ? item.doneLabel : item.pendingLabel} · {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}

export function WorkflowPane({
  activeTab,
  publishStep,
  setPublishStep,
  inputText,
  wordCount,
  runningTask,
  publishWorkflowSteps,
  onAiFormat,
  onRewrite,
  hasAppliedRewrite,
  appliedAiChange,
  onRestoreAiChange,
  onPublishOptimize,
  onGenerateCover,
  onGeneratePoster,
  coverGenerationResult,
  coverTextMode,
  setCoverTextMode,
  coverTitleStyle,
  onCoverTitleStyleChange,
  onResetCoverTitleStyle,
  selectedCoverTitle,
  onSelectCoverTitle,
  posterGenerationResult,
  posterTextMode,
  setPosterTextMode,
  posterManualText,
  setPosterManualText,
  posterTextStyle,
  onPosterTextStyleChange,
  onResetPosterTextStyle,
  coverGenerationConfigStatus,
  onOpenAiConfig,
  promptTemplates,
  selectedPrompt,
  selectedPromptId,
  setSelectedPromptId,
  onSavePrompt,
  onDeletePrompt,
  coverPromptTemplates,
  selectedCoverPrompt,
  selectedCoverPromptId,
  setSelectedCoverPromptId,
  onSaveCoverPrompt,
  onDeleteCoverPrompt,
  posterPromptTemplates,
  selectedPosterPrompt,
  selectedPosterPromptId,
  setSelectedPosterPromptId,
  onSavePosterPrompt,
  onDeletePosterPrompt,
  posterLibraryItems,
  isLoadingPosterLibrary,
  onDeletePosterLibraryItem,
  onClearPosterLibrary,
  publishChecks,
  publishOptimization,
  onCopy,
  allTemplatesCount,
  groupedTemplates,
  currentCategory,
  setCurrentCategory,
  currentTemplateId,
  setCurrentTemplateId,
  formatTweaks,
  setFormatTweaks,
  onResetFormatTweaks,
  syncScroll,
  setSyncScroll,
  podcastScript,
  onGeneratePodcastScript,
  videoScript,
  onGenerateVideoScript,
}: WorkflowPaneProps) {
  const [promptDraftId, setPromptDraftId] = useState("");
  const [promptName, setPromptName] = useState("");
  const [promptBody, setPromptBody] = useState("");
  const [isPromptManagerOpen, setIsPromptManagerOpen] = useState(false);
  const [coverPromptDraftId, setCoverPromptDraftId] = useState("");
  const [coverPromptName, setCoverPromptName] = useState("");
  const [coverPromptBody, setCoverPromptBody] = useState("");
  const [isCoverTitleStyleOpen, setIsCoverTitleStyleOpen] = useState(false);
  const [isCoverPromptEditorOpen, setIsCoverPromptEditorOpen] = useState(false);
  const [posterPromptDraftId, setPosterPromptDraftId] = useState("");
  const [posterPromptName, setPosterPromptName] = useState("");
  const [posterPromptBody, setPosterPromptBody] = useState("");
  const [isPosterPromptEditorOpen, setIsPosterPromptEditorOpen] = useState(false);
  const [isPosterTextStyleOpen, setIsPosterTextStyleOpen] = useState(false);
  const [isFormatSettingsOpen, setIsFormatSettingsOpen] = useState(true);
  const [copiedMaterialIds, setCopiedMaterialIds] = useState<string[]>([]);
  const [workflowModule, setWorkflowModule] = useState<WorkflowModuleId>("guide");

  const headingCount = (inputText.match(/^#{1,6}\s+.+$/gm) || []).length;
  const imageCount = (inputText.match(/!\[[^\]]*]\([^)]+\)/g) || []).length;
  const linkCount = Math.max(0, (inputText.match(/\[[^\]]+]\([^)]+\)/g) || []).length - imageCount);
  const currentStepLabel =
    publishWorkflowSteps.find((step) => step.id === publishStep)?.label || "发布工作流";
  const getStepStatus = (stepId: PublishStepId) =>
    publishWorkflowSteps.find((step) => step.id === stepId)?.status || "pending";
  const formatReady = getStepStatus("format") === "done";
  const imageReady = Boolean(coverGenerationResult);
  const materialsReady = Boolean(publishOptimization);
  const hasCopiedBody = getStepStatus("publish") === "done";

  useEffect(() => {
    setCopiedMaterialIds((current) => current.filter((id) => id !== "cover-image"));
  }, [coverGenerationResult?.imageUrl]);

  useEffect(() => {
    setCopiedMaterialIds((current) => current.filter((id) => id !== "poster-image"));
  }, [posterGenerationResult?.imageUrl]);

  const loadPromptForEdit = (template: PromptTemplate) => {
    setPromptDraftId(template.id);
    setPromptName(template.name);
    setPromptBody(template.prompt);
    setIsPromptManagerOpen(true);
  };

  const editSelectedPrompt = () => {
    if (selectedPrompt) {
      loadPromptForEdit(selectedPrompt);
      return;
    }
    setIsPromptManagerOpen(true);
  };

  const clearPromptDraft = () => {
    setPromptDraftId("");
    setPromptName("");
    setPromptBody("");
  };

  const savePrompt = () => {
    onSavePrompt({ id: promptDraftId, name: promptName, prompt: promptBody });
    clearPromptDraft();
  };

  const loadCoverPromptForEdit = (template: CoverPromptTemplate) => {
    setCoverPromptDraftId(template.id);
    setCoverPromptName(template.name);
    setCoverPromptBody(template.prompt);
    setIsCoverPromptEditorOpen(true);
  };

  const editSelectedCoverPrompt = () => {
    if (selectedCoverPrompt) {
      loadCoverPromptForEdit(selectedCoverPrompt);
      return;
    }
    setIsCoverPromptEditorOpen(true);
  };

  const newCoverPrompt = () => {
    setCoverPromptDraftId("");
    setCoverPromptName("");
    setCoverPromptBody("");
    setIsCoverPromptEditorOpen(true);
  };

  const clearCoverPromptDraft = () => {
    setCoverPromptDraftId("");
    setCoverPromptName("");
    setCoverPromptBody("");
    setIsCoverPromptEditorOpen(false);
  };

  const saveCoverPrompt = () => {
    onSaveCoverPrompt({
      id: coverPromptDraftId,
      name: coverPromptName,
      prompt: coverPromptBody,
    });
    clearCoverPromptDraft();
  };

  const loadPosterPromptForEdit = (template: PosterPromptTemplate) => {
    setPosterPromptDraftId(template.id);
    setPosterPromptName(template.name);
    setPosterPromptBody(template.prompt);
    setIsPosterPromptEditorOpen(true);
  };

  const editSelectedPosterPrompt = () => {
    if (selectedPosterPrompt) {
      loadPosterPromptForEdit(selectedPosterPrompt);
      return;
    }
    setIsPosterPromptEditorOpen(true);
  };

  const newPosterPrompt = () => {
    setPosterPromptDraftId("");
    setPosterPromptName("");
    setPosterPromptBody("");
    setIsPosterPromptEditorOpen(true);
  };

  const clearPosterPromptDraft = () => {
    setPosterPromptDraftId("");
    setPosterPromptName("");
    setPosterPromptBody("");
    setIsPosterPromptEditorOpen(false);
  };

  const savePosterPrompt = () => {
    onSavePosterPrompt({
      id: posterPromptDraftId,
      name: posterPromptName,
      prompt: posterPromptBody,
    });
    clearPosterPromptDraft();
  };

  const updateCoverTitleStyle = (patch: Partial<CoverTitleStyle>) => {
    onCoverTitleStyleChange({
      ...coverTitleStyle,
      ...patch,
    });
  };
  const isCoverTitleEnabled = coverTitleStyle.titleEnabled !== false;

  const updatePosterTextStyle = (patch: Partial<PosterTextStyle>) => {
    onPosterTextStyleChange({
      ...posterTextStyle,
      ...patch,
    });
  };
  const isPosterCardEnabled = posterTextStyle.cardEnabled !== false;

  const copyPlainText = async (text: string, id = "text") => {
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopiedMaterialIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const copyImageToClipboard = async (imageUrl: string, id = "cover-image") => {
    if (!imageUrl.trim() || !navigator.clipboard?.write || !("ClipboardItem" in window)) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const mimeType = blob.type || "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })]);
      setCopiedMaterialIds((current) => (current.includes(id) ? current : [...current, id]));
    } catch (error) {
      console.error("复制封面图失败", error);
    }
  };

  return (
    <aside
      className={`w-full md:w-[360px] lg:w-[400px] shrink-0 h-full overflow-hidden ${
        activeTab === "workflow" ? "flex" : "hidden md:flex"
      }`}
    >
      <div className="neo-panel flex flex-col w-full overflow-hidden">
        <div className="bg-(--neo-template-header) border-b border-(--neo-line) p-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-black text-(--neo-on-header) uppercase flex items-center gap-2">
              <Send className="w-4 h-4" />
              工作区
            </h2>
            <button
              type="button"
              onClick={onOpenAiConfig}
              className="neo-button neo-button-ghost p-1.5"
              title="配置 AI 服务"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {workflowModules.map((module) => (
              <button
                key={module.id}
                type="button"
                onClick={() => setWorkflowModule(module.id)}
                className={`rounded-lg border px-2 py-2 text-left transition ${
                  workflowModule === module.id
                    ? "border-(--neo-green) bg-emerald-50 text-emerald-700"
                    : "border-(--neo-line) bg-white text-(--neo-ink)"
                }`}
                title={module.description}
              >
                <div className="text-[11px] font-black">{module.label}</div>
                <div className="mt-0.5 truncate text-[9px] font-bold opacity-70">
                  {module.description}
                </div>
              </button>
            ))}
          </div>

          {workflowModule === "guide" && (
            <div className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-2">
            <div className="grid grid-cols-3 gap-1.5">
              {publishWorkflowSteps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setPublishStep(step.id)}
                  aria-current={publishStep === step.id ? "step" : undefined}
                  className={`rounded-lg border px-1.5 py-2 text-center transition ${
                    workflowStepClassNames[step.status]
                  } ${publishStep === step.id ? "ring-2 ring-(--neo-green)" : ""}`}
                  title={`${step.label}：${step.description}`}
                >
                  <div className="mx-auto mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/85 text-[10px] font-black">
                    {index + 1}
                  </div>
                  <div className="truncate text-[10px] font-black">{step.label}</div>
                  <div className="mt-0.5 truncate text-[9px] font-bold opacity-75">
                    {workflowStepStatusLabels[step.status]}
                  </div>
                </button>
              ))}
            </div>
          </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-(--neo-surface) custom-scrollbar">
          {workflowModule === "guide" && (
            <>
          <div className="mb-3 rounded-xl border border-(--neo-line) bg-white p-3">
            <div className="text-[11px] font-black neo-text-muted">当前步骤</div>
            <div className="mt-1 text-lg font-black text-(--neo-ink)">{currentStepLabel}</div>
            <p className="mt-1 text-xs font-bold leading-relaxed neo-text-muted">
              {stepDescriptions[publishStep]}
            </p>
          </div>

          {publishStep === "draft" && (
            <div className="space-y-3">
              <CompletionCard
                done={Boolean(inputText.trim())}
                text="左侧已有正文即可继续；建议先写好标题。"
              />
              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <h3 className="text-sm font-black">初稿状态</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-(--neo-line) bg-white p-2">
                    <div className="text-[10px] font-black neo-text-muted">字符</div>
                    <div className="text-lg font-black">{wordCount.chars}</div>
                  </div>
                  <div className="rounded-lg border border-(--neo-line) bg-white p-2">
                    <div className="text-[10px] font-black neo-text-muted">预计阅读</div>
                    <div className="text-lg font-black">{wordCount.readTime} 分钟</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "标题", value: headingCount > 0 ? `${headingCount} 个` : "未检测到" },
                    { label: "图片", value: imageCount > 0 ? `${imageCount} 张` : "未检测到" },
                    { label: "链接", value: linkCount > 0 ? `${linkCount} 个` : "未检测到" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border border-(--neo-line) bg-white p-2 text-xs font-bold"
                    >
                      <span>{item.label}</span>
                      <span className="neo-text-muted">{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>
              <StepActions currentStep={publishStep} setPublishStep={setPublishStep} />
            </div>
          )}

          {publishStep === "rewrite" && (
            <div className="space-y-4">
              <CompletionCard
                done={hasAppliedRewrite}
                text="可选：选提示词改写初稿，不满意可还原。"
              />
              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4" />
                    提示词改写
                  </h3>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedPromptId}
                    onChange={(e) => setSelectedPromptId(e.target.value)}
                    className="neo-input min-w-0 flex-1 px-3 py-2 text-sm"
                  >
                    {promptTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={editSelectedPrompt}
                    className="neo-button neo-button-ghost shrink-0 px-3 py-2 text-xs"
                  >
                    编辑提示词
                  </button>
                  <button
                    type="button"
                    disabled={!selectedPrompt}
                    onClick={() => selectedPrompt && onDeletePrompt(selectedPrompt.id)}
                    className="neo-button neo-button-ghost shrink-0 px-3 py-2 text-xs disabled:opacity-40"
                  >
                    删除
                  </button>
                </div>
                <button
                  type="button"
                  disabled={!selectedPrompt || Boolean(runningTask)}
                  onClick={() => onRewrite(selectedPrompt)}
                  className="neo-button neo-button-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Wand2 className="h-4 w-4" />
                  {runningTask === "rewrite" ? "改写中..." : "按提示词改写"}
                </button>
                <p className="text-xs neo-text-muted font-bold leading-relaxed">
                  会更新左侧初稿；可随时还原。
                </p>
              </section>

              {appliedAiChange?.taskType === "rewrite" && (
                <AppliedAiChangeCard change={appliedAiChange} onRestore={onRestoreAiChange} />
              )}

              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsPromptManagerOpen((current) => !current)}
                  className="flex w-full items-center justify-between gap-2 p-3 text-left"
                >
                  <span className="text-sm font-black flex items-center gap-1.5">
                    <PenLine className="w-4 h-4" />
                    管理提示词
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isPromptManagerOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isPromptManagerOpen && (
                  <div className="border-t border-(--neo-line) p-3 space-y-2">
                    <input
                      value={promptName}
                      onChange={(e) => setPromptName(e.target.value)}
                      className="neo-input w-full px-3 py-2 text-sm"
                      placeholder="提示词名称"
                    />
                    <textarea
                      value={promptBody}
                      onChange={(e) => setPromptBody(e.target.value)}
                      className="neo-input w-full min-h-24 px-3 py-2 text-sm resize-none"
                      placeholder="输入你的改写提示词"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={savePrompt}
                        className="neo-button neo-button-primary flex-1 py-2 text-xs"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={clearPromptDraft}
                        className="neo-button neo-button-ghost px-3 py-2 text-xs"
                      >
                        清空
                      </button>
                    </div>
                    <div className="space-y-2 pt-1">
                      {promptTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-(--neo-line) p-2"
                        >
                          <button
                            type="button"
                            onClick={() => loadPromptForEdit(template)}
                            className="truncate text-left text-xs font-black underline"
                          >
                            {template.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePrompt(template.id)}
                            className="text-[10px] font-black"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <StepActions currentStep={publishStep} setPublishStep={setPublishStep} />
            </div>
          )}

          {publishStep === "format" && (
            <div className="space-y-4">
              <CompletionCard done={formatReady} text="完成后左侧初稿已排好版；不满意可还原。" />
              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={onAiFormat}
                    disabled={!inputText.trim() || Boolean(runningTask)}
                    className="neo-button neo-button-pink w-full px-4 py-3 flex items-center justify-center gap-2"
                  >
                    {runningTask === "format" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    AI 一键排版
                  </button>
                  <p className="px-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                    只整理结构，不改写正文；会更新左侧初稿。
                  </p>
                </div>
              </section>

              {appliedAiChange?.taskType === "format" && (
                <AppliedAiChangeCard change={appliedAiChange} onRestore={onRestoreAiChange} />
              )}

              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsFormatSettingsOpen((current) => !current)}
                  className="flex w-full items-center justify-between gap-2 p-3 text-left"
                >
                  <span className="text-sm font-black">模板和细节微调</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isFormatSettingsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isFormatSettingsOpen && (
                  <div className="border-t border-(--neo-line)">
                    <SettingsPane
                      activeTab="workflow"
                      embedded
                      allTemplatesCount={allTemplatesCount}
                      groupedTemplates={groupedTemplates}
                      currentCategory={currentCategory}
                      setCurrentCategory={setCurrentCategory}
                      currentTemplateId={currentTemplateId}
                      setCurrentTemplateId={setCurrentTemplateId}
                      formatTweaks={formatTweaks}
                      setFormatTweaks={setFormatTweaks}
                      onResetFormatTweaks={onResetFormatTweaks}
                      syncScroll={syncScroll}
                      setSyncScroll={setSyncScroll}
                    />
                  </div>
                )}
              </section>

              <StepActions currentStep={publishStep} setPublishStep={setPublishStep} />
            </div>
          )}

          {publishStep === "image" && (
            <div className="space-y-4">
              <CompletionCard
                done={imageReady}
                text={
                  imageReady ? "已生成公众号封面图。" : "配置生图 API 后，生成公众号封面图。"
                }
              />
              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 text-xs font-bold leading-relaxed neo-text-muted">
                这里专注生成公众号封面图；金句图和总结图请切换到上方“公众号贴图”模块。
              </section>

              {!coverGenerationConfigStatus.isConfigured && (
                <section className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2 text-amber-800">
                  <h3 className="text-sm font-black flex items-center gap-1.5 text-(--neo-ink)">
                    <ImageIcon className="w-4 h-4" />
                    先配置生图 API
                  </h3>
                  <p className="text-xs font-bold leading-relaxed">
                    {coverGenerationConfigStatus.message}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAiConfig}
                    className="neo-button neo-button-secondary w-full py-2 text-xs"
                  >
                    去配置
                  </button>
                </section>
              )}

                  <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                    <div>
                      <h3 className="text-sm font-black flex items-center gap-1.5">
                        <PenLine className="w-4 h-4" />
                        生图提示词
                      </h3>
                      <p className="mt-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                        选择封面风格，生成时会结合文章标题、摘要和关键词。
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedCoverPromptId}
                        onChange={(e) => setSelectedCoverPromptId(e.target.value)}
                        className="neo-input min-w-0 flex-1 px-3 py-2 text-sm"
                      >
                        {coverPromptTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={editSelectedCoverPrompt}
                        className="neo-button neo-button-ghost shrink-0 px-3 py-2 text-xs"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        disabled={!selectedCoverPrompt}
                        onClick={() =>
                          selectedCoverPrompt && onDeleteCoverPrompt(selectedCoverPrompt.id)
                        }
                        className="neo-button neo-button-ghost shrink-0 px-3 py-2 text-xs disabled:opacity-40"
                      >
                        删除
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold neo-text-muted">
                        当前：{selectedCoverPrompt?.name || "公众号封面通用"}
                      </p>
                      <button
                        type="button"
                        onClick={newCoverPrompt}
                        className="text-xs font-black underline text-(--neo-ink)"
                      >
                        新增提示词
                      </button>
                    </div>
                    {isCoverPromptEditorOpen && (
                      <div className="rounded-xl border border-(--neo-line) bg-white p-3 space-y-2">
                        <input
                          value={coverPromptName}
                          onChange={(e) => setCoverPromptName(e.target.value)}
                          className="neo-input w-full px-3 py-2 text-sm"
                          placeholder="提示词名称"
                        />
                        <textarea
                          value={coverPromptBody}
                          onChange={(e) => setCoverPromptBody(e.target.value)}
                          className="neo-input w-full min-h-28 px-3 py-2 text-sm resize-none"
                          placeholder="输入封面风格、构图、色彩和禁用元素等要求"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveCoverPrompt}
                            className="neo-button neo-button-primary flex-1 py-2 text-xs"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={clearCoverPromptDraft}
                            className="neo-button neo-button-ghost px-3 py-2 text-xs"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                  <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                    <div>
                      <h3 className="text-sm font-black flex items-center gap-1.5">
                        <PenLine className="w-4 h-4" />
                        标题显示方式
                      </h3>
                      <p className="mt-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                        默认由 WX 融合叠加完整标题；模型直出适合测试 Seedream、Qwen Image 等文字能力。
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCoverTextMode("canvas")}
                        className={`rounded-lg border px-3 py-2 text-left text-xs font-black ${
                          coverTextMode === "canvas"
                            ? "border-(--neo-green) bg-emerald-50 text-emerald-700"
                            : "border-(--neo-line) bg-white text-(--neo-ink)"
                        }`}
                      >
                        工具叠字
                        <span className="mt-0.5 block text-[10px] font-bold opacity-70">推荐</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverTextMode("model")}
                        className={`rounded-lg border px-3 py-2 text-left text-xs font-black ${
                          coverTextMode === "model"
                            ? "border-(--neo-pink) bg-pink-50 text-pink-700"
                            : "border-(--neo-line) bg-white text-(--neo-ink)"
                        }`}
                      >
                        模型直出标题
                        <span className="mt-0.5 block text-[10px] font-bold opacity-70">高级</span>
                      </button>
                    </div>
                    {coverTextMode === "model" && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] font-bold leading-relaxed text-amber-800">
                        模型直出会要求生图模型直接写标题，但可能缺字、错字或不显示。
                      </div>
                    )}
                  </section>

                  {coverTextMode === "canvas" && (
                    <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                      <button
                        type="button"
                        onClick={() => setIsCoverTitleStyleOpen((value) => !value)}
                        className="flex w-full items-center justify-between text-left text-xs font-black"
                      >
                        <span>标题样式</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            isCoverTitleStyleOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <p className="text-[11px] font-bold leading-relaxed neo-text-muted">
                        调整 WX 叠字的位置和颜色，已生成封面会自动重新合成。
                      </p>
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-(--neo-line) bg-white p-2">
                        <div>
                          <div className="text-[11px] font-black">叠加标题</div>
                          <p className="mt-0.5 text-[10px] font-bold leading-relaxed neo-text-muted">
                            关闭后只显示生图背景，不叠加标题。
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-pressed={isCoverTitleEnabled}
                          onClick={() =>
                            updateCoverTitleStyle({ titleEnabled: !isCoverTitleEnabled })
                          }
                          className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
                            isCoverTitleEnabled
                              ? "border-emerald-400 bg-emerald-400"
                              : "border-(--neo-line) bg-slate-200"
                          }`}
                        >
                          <span
                            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                              isCoverTitleEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                          <span className="sr-only">
                            {isCoverTitleEnabled ? "关闭工具叠字" : "开启工具叠字"}
                          </span>
                        </button>
                      </div>
                      {isCoverTitleStyleOpen && (
                        isCoverTitleEnabled ? (
                          <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black">
                              <span>横向位置</span>
                              <span>{Math.round(coverTitleStyle.xPercent)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="72"
                              step="1"
                              value={coverTitleStyle.xPercent}
                              onChange={(event) =>
                                updateCoverTitleStyle({ xPercent: Number(event.target.value) })
                              }
                              className="w-full accent-(--neo-green)"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black">
                              <span>纵向位置</span>
                              <span>{Math.round(coverTitleStyle.yPercent)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="70"
                              step="1"
                              value={coverTitleStyle.yPercent}
                              onChange={(event) =>
                                updateCoverTitleStyle({ yPercent: Number(event.target.value) })
                              }
                              className="w-full accent-(--neo-green)"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black">
                              <span>标题区域宽度</span>
                              <span>{Math.round(coverTitleStyle.widthPercent)}%</span>
                            </div>
                            <input
                              type="range"
                              min="30"
                              max="92"
                              step="1"
                              value={coverTitleStyle.widthPercent}
                              onChange={(event) =>
                                updateCoverTitleStyle({ widthPercent: Number(event.target.value) })
                              }
                              className="w-full accent-(--neo-green)"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-black">
                              <span>字体大小</span>
                              <span>{Math.round(coverTitleStyle.fontScalePercent)}%</span>
                            </div>
                            <input
                              type="range"
                              min="75"
                              max="120"
                              step="1"
                              value={coverTitleStyle.fontScalePercent}
                              onChange={(event) =>
                                updateCoverTitleStyle({
                                  fontScalePercent: Number(event.target.value),
                                })
                              }
                              className="w-full accent-(--neo-green)"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <div className="text-[11px] font-black">标题颜色</div>
                              <div className="flex flex-wrap gap-1.5">
                                {coverTitleTextColors.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    aria-label={`标题颜色 ${color}`}
                                    onClick={() => updateCoverTitleStyle({ textColor: color })}
                                    className={`h-7 w-7 rounded-full border ${
                                      coverTitleStyle.textColor === color
                                        ? "border-(--neo-green) ring-2 ring-emerald-200"
                                        : "border-(--neo-line)"
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <input
                                type="color"
                                value={coverTitleStyle.textColor}
                                onChange={(event) =>
                                  updateCoverTitleStyle({ textColor: event.target.value })
                                }
                                className="h-9 w-full rounded-lg border border-(--neo-line) bg-white p-1"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="text-[11px] font-black">描边颜色</div>
                              <div className="flex flex-wrap gap-1.5">
                                {coverTitleStrokeColors.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    aria-label={`描边颜色 ${color}`}
                                    onClick={() => updateCoverTitleStyle({ strokeColor: color })}
                                    className={`h-7 w-7 rounded-full border ${
                                      coverTitleStyle.strokeColor === color
                                        ? "border-(--neo-green) ring-2 ring-emerald-200"
                                        : "border-(--neo-line)"
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <input
                                type="color"
                                value={coverTitleStyle.strokeColor}
                                onChange={(event) =>
                                  updateCoverTitleStyle({ strokeColor: event.target.value })
                                }
                                className="h-9 w-full rounded-lg border border-(--neo-line) bg-white p-1"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={onResetCoverTitleStyle}
                            className="neo-button neo-button-ghost w-full px-3 py-2 text-xs"
                          >
                            恢复默认标题样式
                          </button>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-(--neo-line) bg-white p-3 text-[11px] font-bold leading-relaxed neo-text-muted">
                            工具叠字已关闭。封面会保留模型生成的背景图，重新打开后会用当前标题样式自动合成。
                          </div>
                        )
                      )}
                    </section>
                  )}

                  {publishOptimization?.titles?.length ? (
                    <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
                      <h3 className="text-xs font-black">封面标题候选</h3>
                      {publishOptimization.titles.slice(0, 3).map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => onSelectCoverTitle(title)}
                          className={`w-full rounded-lg border p-2 text-left text-xs font-bold ${
                            (selectedCoverTitle || coverGenerationResult?.titleHint) === title
                              ? "border-(--neo-green) bg-emerald-50 text-emerald-700"
                              : "border-(--neo-line) bg-white text-(--neo-ink)"
                          }`}
                        >
                          {title}
                        </button>
                      ))}
                    </section>
                  ) : null}

                  <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                    <button
                      type="button"
                      onClick={onGenerateCover}
                      disabled={
                        !inputText.trim() ||
                        Boolean(runningTask) ||
                        !coverGenerationConfigStatus.isConfigured
                      }
                      className="neo-button neo-button-primary w-full px-4 py-3 flex items-center justify-center gap-2"
                    >
                      {runningTask === "cover" || runningTask === "publishOptimize" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      {runningTask === "cover"
                        ? "正在生成封面..."
                        : runningTask === "publishOptimize"
                          ? "正在准备物料..."
                          : "生成封面图"}
                    </button>
                    <p className="px-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                      {coverTextMode === "canvas"
                        ? "模型生成背景，WX 负责叠加完整标题。"
                        : "模型会尝试直接生成带标题的封面，文字准确性取决于模型能力。"}
                    </p>
                  </section>

                  <CoverResultCard
                    coverGenerationResult={coverGenerationResult}
                    runningTask={runningTask}
                    onCopyText={copyPlainText}
                    onCopyImage={copyImageToClipboard}
                    copiedMaterialIds={copiedMaterialIds}
                  />

                  {coverGenerationResult || publishOptimization ? (
                    <PublishMaterials
                      publishOptimization={publishOptimization}
                      coverGenerationResult={coverGenerationResult}
                      onCopyText={copyPlainText}
                      onCopyImage={copyImageToClipboard}
                      copiedMaterialIds={copiedMaterialIds}
                      showCover={false}
                      compact
                    />
                  ) : (
                    <div className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-4 text-sm font-bold neo-text-muted">
                      生成封面后，标题、摘要和关键词会显示在这里。
                    </div>
                  )}

              <StepActions currentStep={publishStep} setPublishStep={setPublishStep} />
            </div>
          )}

          {publishStep === "check" && (
            <div className="space-y-4">
              <CompletionCard done={materialsReady} text="已生成标题、摘要和关键词。" />
              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <button
                  type="button"
                  onClick={onPublishOptimize}
                  disabled={!inputText.trim() || Boolean(runningTask)}
                  className="neo-button neo-button-primary w-full px-4 py-3 flex items-center justify-center gap-2"
                >
                  {runningTask === "publishOptimize" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileCheck2 className="w-4 h-4" />
                  )}
                  生成发布物料
                </button>
                <p className="px-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                  用于公众号后台填写，可单独复制。
                </p>
              </section>

              <PublishMaterials
                publishOptimization={publishOptimization}
                coverGenerationResult={coverGenerationResult}
                onCopyText={copyPlainText}
                onCopyImage={copyImageToClipboard}
                copiedMaterialIds={copiedMaterialIds}
              />

              <StepActions currentStep={publishStep} setPublishStep={setPublishStep} />
            </div>
          )}

          {publishStep === "publish" && (
            <div className="space-y-4">
              <CompletionCard done={hasCopiedBody} text="复制正文 HTML 到公众号后台。" />
              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <button
                  type="button"
                  onClick={onCopy}
                  disabled={!inputText.trim()}
                  className="neo-button neo-button-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <Clipboard className="w-4 h-4" />
                  复制到公众号后台
                </button>
                <p className="px-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                  复制后到公众号后台正文区粘贴。
                </p>
              </section>

              <PublishMaterials
                publishOptimization={publishOptimization}
                coverGenerationResult={coverGenerationResult}
                onCopyText={copyPlainText}
                onCopyImage={copyImageToClipboard}
                copiedMaterialIds={copiedMaterialIds}
                compact
              />

              <PublishChecklist
                hasCopiedBody={hasCopiedBody}
                publishOptimization={publishOptimization}
                coverGenerationResult={coverGenerationResult}
                copiedMaterialIds={copiedMaterialIds}
              />

              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
                <h3 className="text-xs font-black">发布前快速检查</h3>
                {publishChecks.map((item) => (
                  <div key={item.id} className="rounded-lg border border-(--neo-line) bg-white p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-3 h-3 rounded-full border border-(--neo-line) ${
                          statusClassNames[item.status]
                        }`}
                      />
                      <h4 className="text-xs font-black">{item.label}</h4>
                    </div>
                    <p className="text-[11px] neo-text-muted font-bold leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                ))}
              </section>

              {!publishOptimization && (
                <button
                  type="button"
                  onClick={() => setPublishStep("check")}
                  className="neo-button neo-button-secondary w-full py-2 text-xs"
                >
                  去生成发布物料
                </button>
              )}

              <StepActions currentStep={publishStep} setPublishStep={setPublishStep} />
            </div>
          )}
            </>
          )}

          {workflowModule === "poster" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-(--neo-line) bg-white p-3">
                <div className="text-[11px] font-black neo-text-muted">独立模块</div>
                <div className="mt-1 text-lg font-black text-(--neo-ink)">公众号贴图</div>
                <p className="mt-1 text-xs font-bold leading-relaxed neo-text-muted">
                  输入希望出现在贴图上的文字，再按提示词生成最终公众号贴图；结果会保存到本地图库。
                </p>
              </div>

              {!coverGenerationConfigStatus.isConfigured && (
                <section className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2 text-amber-800">
                  <h3 className="text-sm font-black flex items-center gap-1.5 text-(--neo-ink)">
                    <ImageIcon className="w-4 h-4" />
                    先配置生图 API
                  </h3>
                  <p className="text-xs font-bold leading-relaxed">
                    {coverGenerationConfigStatus.message}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAiConfig}
                    className="neo-button neo-button-secondary w-full py-2 text-xs"
                  >
                    去配置
                  </button>
                </section>
              )}

              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <div>
                  <h3 className="text-sm font-black flex items-center gap-1.5">
                    <PenLine className="w-4 h-4" />
                    贴图文字内容
                  </h3>
                  <p className="mt-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                    输入最终想出现在贴图上的文字，可多行；系统不会再根据初稿自动总结。
                  </p>
                </div>
                <textarea
                  value={posterManualText}
                  onChange={(event) => setPosterManualText(event.target.value)}
                  className="neo-input w-full min-h-32 px-3 py-2 text-sm leading-relaxed resize-y"
                  placeholder={"例如：\n你做一遍，Codex 记下，\n以后替你做。"}
                />
              </section>

              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <div>
                  <h3 className="text-sm font-black flex items-center gap-1.5">
                    <PenLine className="w-4 h-4" />
                    贴图提示词
                  </h3>
                  <p className="mt-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                    选择贴图风格；工具叠字模式会生成无文字背景，模型直出模式会尝试直接排版上面的文字。
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedPosterPromptId}
                    onChange={(e) => setSelectedPosterPromptId(e.target.value)}
                    className="neo-input min-w-0 flex-1 px-3 py-2 text-sm"
                  >
                    {posterPromptTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={editSelectedPosterPrompt}
                    className="neo-button neo-button-ghost shrink-0 px-3 py-2 text-xs"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    disabled={!selectedPosterPrompt}
                    onClick={() =>
                      selectedPosterPrompt && onDeletePosterPrompt(selectedPosterPrompt.id)
                    }
                    className="neo-button neo-button-ghost shrink-0 px-3 py-2 text-xs disabled:opacity-40"
                  >
                    删除
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-bold neo-text-muted">
                    当前：{selectedPosterPrompt?.name || "金句传播贴图"}
                  </p>
                  <button
                    type="button"
                    onClick={newPosterPrompt}
                    className="text-xs font-black underline text-(--neo-ink)"
                  >
                    新增提示词
                  </button>
                </div>
                {isPosterPromptEditorOpen && (
                  <div className="rounded-xl border border-(--neo-line) bg-white p-3 space-y-2">
                    <input
                      value={posterPromptName}
                      onChange={(e) => setPosterPromptName(e.target.value)}
                      className="neo-input w-full px-3 py-2 text-sm"
                      placeholder="提示词名称"
                    />
                    <textarea
                      value={posterPromptBody}
                      onChange={(e) => setPosterPromptBody(e.target.value)}
                      className="neo-input w-full min-h-28 px-3 py-2 text-sm resize-none"
                      placeholder="输入贴图风格、使用场景、视觉氛围和禁用元素等要求"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={savePosterPrompt}
                        className="neo-button neo-button-primary flex-1 py-2 text-xs"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={clearPosterPromptDraft}
                        className="neo-button neo-button-ghost px-3 py-2 text-xs"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <div>
                  <h3 className="text-sm font-black flex items-center gap-1.5">
                    <PenLine className="w-4 h-4" />
                    文字生成方式
                  </h3>
                  <p className="mt-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                    默认由 TypeZen 叠加中文；模型直出适合测试生图模型的海报文字能力。
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPosterTextMode("canvas")}
                    className={`rounded-lg border px-3 py-2 text-left text-xs font-black ${
                      posterTextMode === "canvas"
                        ? "border-(--neo-green) bg-emerald-50 text-emerald-700"
                        : "border-(--neo-line) bg-white text-(--neo-ink)"
                    }`}
                  >
                    工具叠字
                    <span className="mt-0.5 block text-[10px] font-bold opacity-70">推荐</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterTextMode("model")}
                    className={`rounded-lg border px-3 py-2 text-left text-xs font-black ${
                      posterTextMode === "model"
                        ? "border-(--neo-pink) bg-pink-50 text-pink-700"
                        : "border-(--neo-line) bg-white text-(--neo-ink)"
                    }`}
                  >
                    模型直出
                    <span className="mt-0.5 block text-[10px] font-bold opacity-70">高级</span>
                  </button>
                </div>
                {posterTextMode === "model" && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] font-bold leading-relaxed text-amber-800">
                    模型会直接生成带中文的完整贴图，可能缺字、错字或不显示。
                  </div>
                )}
              </section>

              {posterTextMode === "canvas" && (
                <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsPosterTextStyleOpen((value) => !value)}
                    className="flex w-full items-center justify-between text-left text-xs font-black"
                  >
                    <span>贴图文字样式</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isPosterTextStyleOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <p className="text-[11px] font-bold leading-relaxed neo-text-muted">
                    调整卡片、字号和颜色；已生成贴图会自动重新合成。
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={isPosterCardEnabled}
                      onClick={() =>
                        updatePosterTextStyle({ cardEnabled: !isPosterCardEnabled })
                      }
                      className={`rounded-lg border px-3 py-2 text-left text-xs font-black ${
                        isPosterCardEnabled
                          ? "border-(--neo-green) bg-emerald-50 text-emerald-700"
                          : "border-(--neo-line) bg-white text-(--neo-ink)"
                      }`}
                    >
                      文字卡片
                      <span className="mt-0.5 block text-[10px] font-bold opacity-70">
                        {isPosterCardEnabled ? "开启" : "关闭"}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={posterTextStyle.shadowEnabled}
                      onClick={() =>
                        updatePosterTextStyle({ shadowEnabled: !posterTextStyle.shadowEnabled })
                      }
                      className={`rounded-lg border px-3 py-2 text-left text-xs font-black ${
                        posterTextStyle.shadowEnabled
                          ? "border-(--neo-green) bg-emerald-50 text-emerald-700"
                          : "border-(--neo-line) bg-white text-(--neo-ink)"
                      }`}
                    >
                      阴影
                      <span className="mt-0.5 block text-[10px] font-bold opacity-70">
                        {posterTextStyle.shadowEnabled ? "开启" : "关闭"}
                      </span>
                    </button>
                  </div>
                  {isPosterTextStyleOpen && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span>横向位置</span>
                          <span>{Math.round(posterTextStyle.cardXPercent)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          step="1"
                          value={posterTextStyle.cardXPercent}
                          onChange={(event) =>
                            updatePosterTextStyle({ cardXPercent: Number(event.target.value) })
                          }
                          className="w-full accent-(--neo-green)"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span>纵向位置</span>
                          <span>{Math.round(posterTextStyle.cardYPercent)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="78"
                          step="1"
                          value={posterTextStyle.cardYPercent}
                          onChange={(event) =>
                            updatePosterTextStyle({ cardYPercent: Number(event.target.value) })
                          }
                          className="w-full accent-(--neo-green)"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span>卡片宽度</span>
                          <span>{Math.round(posterTextStyle.cardWidthPercent)}%</span>
                        </div>
                        <input
                          type="range"
                          min="48"
                          max="92"
                          step="1"
                          value={posterTextStyle.cardWidthPercent}
                          onChange={(event) =>
                            updatePosterTextStyle({ cardWidthPercent: Number(event.target.value) })
                          }
                          className="w-full accent-(--neo-green)"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span>整体字号</span>
                          <span>{Math.round(posterTextStyle.fontScalePercent)}%</span>
                        </div>
                        <input
                          type="range"
                          min="75"
                          max="125"
                          step="1"
                          value={posterTextStyle.fontScalePercent}
                          onChange={(event) =>
                            updatePosterTextStyle({ fontScalePercent: Number(event.target.value) })
                          }
                          className="w-full accent-(--neo-green)"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span>卡片透明度</span>
                          <span>{Math.round(posterTextStyle.cardOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="35"
                          max="100"
                          step="1"
                          value={Math.round(posterTextStyle.cardOpacity * 100)}
                          onChange={(event) =>
                            updatePosterTextStyle({
                              cardOpacity: Number(event.target.value) / 100,
                            })
                          }
                          className="w-full accent-(--neo-green)"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <PosterColorControl
                          label="标题色"
                          value={posterTextStyle.titleColor}
                          colors={posterTextColors}
                          onChange={(value) => updatePosterTextStyle({ titleColor: value })}
                        />
                        <PosterColorControl
                          label="正文色"
                          value={posterTextStyle.quoteColor}
                          colors={posterTextColors}
                          onChange={(value) => updatePosterTextStyle({ quoteColor: value })}
                        />
                        <PosterColorControl
                          label="辅助色"
                          value={posterTextStyle.noteColor}
                          colors={posterMutedTextColors}
                          onChange={(value) => updatePosterTextStyle({ noteColor: value })}
                        />
                        <PosterColorControl
                          label="描边"
                          value={posterTextStyle.strokeColor}
                          colors={coverTitleStrokeColors}
                          onChange={(value) => updatePosterTextStyle({ strokeColor: value })}
                        />
                        <PosterColorControl
                          label="卡片"
                          value={posterTextStyle.cardBackgroundColor}
                          colors={posterCardColors}
                          onChange={(value) =>
                            updatePosterTextStyle({ cardBackgroundColor: value })
                          }
                        />
                        <PosterColorControl
                          label="强调色"
                          value={posterTextStyle.accentColor}
                          colors={posterAccentColors}
                          onChange={(value) => updatePosterTextStyle({ accentColor: value })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onResetPosterTextStyle}
                        className="neo-button neo-button-ghost w-full px-3 py-2 text-xs"
                      >
                        恢复默认贴图样式
                      </button>
                    </div>
                  )}
                </section>
              )}

              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <button
                  type="button"
                  onClick={onGeneratePoster}
                  disabled={
                    !posterManualText.trim() ||
                    Boolean(runningTask) ||
                    !coverGenerationConfigStatus.isConfigured
                  }
                  className="neo-button neo-button-primary w-full px-4 py-3 flex items-center justify-center gap-2"
                >
                  {runningTask === "poster" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  {runningTask === "poster" ? "正在生成贴图..." : "生成公众号贴图"}
                </button>
                <p className="px-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                  {posterTextMode === "canvas"
                    ? "中文由工具叠加，避免模型生成错字；贴图不会自动插入正文。"
                    : "模型直接生成完整贴图；贴图不会自动插入正文。"}
                </p>
              </section>

              <PosterResultCard
                posterGenerationResult={posterGenerationResult}
                runningTask={runningTask}
                onCopyText={copyPlainText}
                onCopyImage={copyImageToClipboard}
                copiedMaterialIds={copiedMaterialIds}
                onRegenerate={onGeneratePoster}
              />

              <PosterLibrary
                items={posterLibraryItems}
                isLoading={isLoadingPosterLibrary}
                onCopyText={copyPlainText}
                copiedMaterialIds={copiedMaterialIds}
                onDelete={onDeletePosterLibraryItem}
                onClear={onClearPosterLibrary}
              />
            </div>
          )}

          {workflowModule === "podcast" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-(--neo-line) bg-white p-3">
                <div className="text-[11px] font-black neo-text-muted">脚本模块</div>
                <div className="mt-1 text-lg font-black text-(--neo-ink)">AI 播客</div>
                <p className="mt-1 text-xs font-bold leading-relaxed neo-text-muted">
                  根据当前初稿生成播客口播脚本，后续可接 TTS 生成音频。
                </p>
              </div>
              <button
                type="button"
                onClick={onGeneratePodcastScript}
                disabled={!inputText.trim() || Boolean(runningTask)}
                className="neo-button neo-button-primary w-full px-4 py-3 flex items-center justify-center gap-2"
              >
                {runningTask === "podcast" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic2 className="h-4 w-4" />
                )}
                {runningTask === "podcast" ? "正在生成播客脚本..." : "生成播客脚本"}
              </button>
              {podcastScript ? (
                <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                  <h3 className="text-sm font-black">{podcastScript.title}</h3>
                  <p className="text-xs font-bold leading-relaxed">{podcastScript.intro}</p>
                  {podcastScript.segments.map((segment) => (
                    <div key={segment.heading} className="rounded-lg border border-(--neo-line) bg-white p-2">
                      <div className="text-xs font-black">{segment.heading}</div>
                      <p className="mt-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                        {segment.narration}
                      </p>
                    </div>
                  ))}
                  <p className="text-xs font-bold leading-relaxed">{podcastScript.outro}</p>
                  <button
                    type="button"
                    onClick={() =>
                      copyPlainText(
                        [
                          podcastScript.title,
                          podcastScript.intro,
                          ...podcastScript.segments.flatMap((segment) => [
                            segment.heading,
                            segment.narration,
                          ]),
                          podcastScript.outro,
                        ].join("\n\n"),
                        "podcast-script",
                      )
                    }
                    className="neo-button neo-button-secondary w-full py-2 text-xs"
                  >
                    {copiedMaterialIds.includes("podcast-script") ? "脚本已复制" : "复制播客脚本"}
                  </button>
                </section>
              ) : (
                <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-4 text-sm font-bold neo-text-muted">
                  尚未生成播客脚本。
                </section>
              )}
            </div>
          )}

          {workflowModule === "video" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-(--neo-line) bg-white p-3">
                <div className="text-[11px] font-black neo-text-muted">脚本模块</div>
                <div className="mt-1 text-lg font-black text-(--neo-ink)">AI 视频</div>
                <p className="mt-1 text-xs font-bold leading-relaxed neo-text-muted">
                  根据当前初稿生成短视频分镜，后续可接视频生成模型。
                </p>
              </div>
              <button
                type="button"
                onClick={onGenerateVideoScript}
                disabled={!inputText.trim() || Boolean(runningTask)}
                className="neo-button neo-button-primary w-full px-4 py-3 flex items-center justify-center gap-2"
              >
                {runningTask === "video" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                {runningTask === "video" ? "正在生成视频分镜..." : "生成视频分镜"}
              </button>
              {videoScript ? (
                <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                  <h3 className="text-sm font-black">{videoScript.title}</h3>
                  {videoScript.scenes.map((scene, index) => (
                    <div
                      key={`${scene.shot}-${scene.narration.slice(0, 24)}`}
                      className="rounded-lg border border-(--neo-line) bg-white p-2"
                    >
                      <div className="text-xs font-black">
                        {index + 1}. {scene.shot}
                      </div>
                      <p className="mt-1 text-[11px] font-bold leading-relaxed">
                        画面：{scene.visual}
                      </p>
                      <p className="mt-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                        旁白：{scene.narration}
                      </p>
                      <p className="mt-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                        字幕：{scene.subtitle}
                      </p>
                    </div>
                  ))}
                  {videoScript.summary && (
                    <p className="text-xs font-bold leading-relaxed">{videoScript.summary}</p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      copyPlainText(
                        [
                          videoScript.title,
                          ...videoScript.scenes.flatMap((scene, index) => [
                            `${index + 1}. ${scene.shot}`,
                            `画面：${scene.visual}`,
                            `旁白：${scene.narration}`,
                            `字幕：${scene.subtitle}`,
                          ]),
                          videoScript.summary,
                        ].join("\n\n"),
                        "video-script",
                      )
                    }
                    className="neo-button neo-button-secondary w-full py-2 text-xs"
                  >
                    {copiedMaterialIds.includes("video-script") ? "分镜已复制" : "复制视频分镜"}
                  </button>
                </section>
              ) : (
                <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-4 text-sm font-bold neo-text-muted">
                  尚未生成视频分镜。
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
