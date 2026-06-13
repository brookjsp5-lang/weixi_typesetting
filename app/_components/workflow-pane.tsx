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
  PenLine,
  Send,
  Settings,
  Sparkles,
  Tags,
  Undo2,
  Wand2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type {
  ActiveTab,
  AppliedAiChange,
  CoverGenerationResult,
  FormatTweaks,
  PromptTemplate,
  PublishCheckItem,
  PublishOptimizationResult,
  PublishStepId,
  PublishWorkflowStep,
  RunningAiTaskType,
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
  coverGenerationResult: CoverGenerationResult;
  onOpenAiConfig: () => void;
  promptTemplates: PromptTemplate[];
  selectedPrompt?: PromptTemplate;
  selectedPromptId: string;
  setSelectedPromptId: React.Dispatch<React.SetStateAction<string>>;
  onSavePrompt: (draft: Pick<PromptTemplate, "id" | "name" | "prompt">) => void;
  onDeletePrompt: (id: string) => void;
  publishChecks: PublishCheckItem[];
  publishOptimization: PublishOptimizationResult;
  onApplyRecommendation: () => void;
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
};

const publishStepOrder: PublishStepId[] = [
  "draft",
  "rewrite",
  "format",
  "image",
  "check",
  "publish",
];

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
  draft: "先把文章内容放进左侧初稿。",
  rewrite: "按提示词直接优化初稿，不满意可以还原。",
  format: "整理 Markdown 结构，并选择模板和主题细节。",
  image: "生成公众号封面图，并同步准备标题、摘要和关键词建议。",
  check: "集中查看标题、摘要、关键词和封面图。",
  publish: "复制正文和发布物料到公众号后台。",
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
  copiedMaterialIds,
}: {
  coverGenerationResult: CoverGenerationResult;
  runningTask: RunningAiTaskType | null;
  onCopyText: (text: string, id: string) => void;
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
        {coverGenerationResult.source === "fallback" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
            备用草图
          </span>
        )}
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
      <div className="flex gap-2">
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
          onClick={() => onCopyText(coverGenerationResult.prompt, "cover-prompt")}
          className="neo-button neo-button-ghost flex-1 py-1.5 text-xs"
        >
          {copiedMaterialIds.includes("cover-prompt") ? "提示词已复制" : "复制提示词"}
        </button>
      </div>
    </section>
  );
}

function PublishMaterials({
  publishOptimization,
  coverGenerationResult,
  onApplyRecommendation,
  onCopyText,
  copiedMaterialIds,
  showCover = true,
  compact = false,
}: {
  publishOptimization: PublishOptimizationResult;
  coverGenerationResult: CoverGenerationResult;
  onApplyRecommendation: () => void;
  onCopyText: (text: string, id: string) => void;
  copiedMaterialIds: string[];
  showCover?: boolean;
  compact?: boolean;
}) {
  const coverSection =
    showCover && coverGenerationResult?.imageUrl?.trim() ? (
      <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
        <h3 className="text-xs font-black flex items-center gap-1.5">
          封面图
          {coverGenerationResult.source === "fallback" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
              备用草图
            </span>
          )}
        </h3>
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
        <div className="flex gap-2">
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
            onClick={() => onCopyText(coverGenerationResult.prompt, "cover-prompt")}
            className="neo-button neo-button-ghost flex-1 py-1.5 text-xs"
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
          生成后会显示标题候选、摘要、关键词和模板建议。
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

      {!compact && (
        <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
          <h3 className="text-xs font-black">模板建议</h3>
          <p className="text-xs neo-text-muted font-bold">
            推荐分类：{publishOptimization.recommendedCategory || "未指定"}
          </p>
          <button
            type="button"
            onClick={onApplyRecommendation}
            className="neo-button neo-button-secondary w-full py-2 text-xs flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            应用推荐
          </button>
        </section>
      )}

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
    { label: "正文 HTML", done: hasCopiedBody },
    { label: "封面图", done: Boolean(coverGenerationResult) },
    {
      label: "标题",
      done: copiedMaterialIds.some((id) => id.startsWith("title:")),
    },
    { label: "摘要", done: copiedMaterialIds.includes("summary") },
    {
      label: "关键词",
      done: copiedMaterialIds.some((id) => id.startsWith("keyword:")),
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
            {item.done ? "已复制" : "待复制"} · {item.label}
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
  coverGenerationResult,
  onOpenAiConfig,
  promptTemplates,
  selectedPrompt,
  selectedPromptId,
  setSelectedPromptId,
  onSavePrompt,
  onDeletePrompt,
  publishChecks,
  publishOptimization,
  onApplyRecommendation,
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
}: WorkflowPaneProps) {
  const [promptDraftId, setPromptDraftId] = useState("");
  const [promptName, setPromptName] = useState("");
  const [promptBody, setPromptBody] = useState("");
  const [isPromptManagerOpen, setIsPromptManagerOpen] = useState(false);
  const [isFormatSettingsOpen, setIsFormatSettingsOpen] = useState(true);
  const [copiedMaterialIds, setCopiedMaterialIds] = useState<string[]>([]);

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

  const copyPlainText = async (text: string, id = "text") => {
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopiedMaterialIds((current) => (current.includes(id) ? current : [...current, id]));
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
              发布向导
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
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-(--neo-surface) custom-scrollbar">
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
                text="左侧初稿已有正文，建议包含一个清晰标题。"
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
                text="可选步骤：需要改写时，选择提示词后直接更新左侧初稿，可随时还原。"
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
                  选择提示词后会直接改写左侧初稿；不满意可点击下方还原。
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
              <CompletionCard
                done={formatReady}
                text="点击 AI 一键排版后会直接整理左侧初稿，不满意可还原。"
              />
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
                    整理 Markdown 结构，不改写正文；结果会直接更新初稿。
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
                  imageReady
                    ? "公众号封面图已生成，结果显示在下方。"
                    : "点击生成封面图，并在下方看到封面预览。"
                }
              />
              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <button
                  type="button"
                  onClick={onGenerateCover}
                  disabled={!inputText.trim() || Boolean(runningTask)}
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
                  会先生成标题、摘要和关键词建议，再调用支持生图的模型生成封面图。
                </p>
              </section>

              <CoverResultCard
                coverGenerationResult={coverGenerationResult}
                runningTask={runningTask}
                onCopyText={copyPlainText}
                copiedMaterialIds={copiedMaterialIds}
              />

              {coverGenerationResult || publishOptimization ? (
                <PublishMaterials
                  publishOptimization={publishOptimization}
                  coverGenerationResult={coverGenerationResult}
                  onApplyRecommendation={onApplyRecommendation}
                  onCopyText={copyPlainText}
                  copiedMaterialIds={copiedMaterialIds}
                  showCover={false}
                  compact
                />
              ) : (
                <div className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-4 text-sm font-bold neo-text-muted">
                  生成封面时会同步准备标题、摘要和关键词建议，成功后会继续显示在这里。
                </div>
              )}

              <StepActions currentStep={publishStep} setPublishStep={setPublishStep} />
            </div>
          )}

          {publishStep === "check" && (
            <div className="space-y-4">
              <CompletionCard done={materialsReady} text="已生成标题候选、摘要和关键词。" />
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
                  生成标题、摘要、关键词和发布建议。
                </p>
              </section>

              <PublishMaterials
                publishOptimization={publishOptimization}
                coverGenerationResult={coverGenerationResult}
                onApplyRecommendation={onApplyRecommendation}
                onCopyText={copyPlainText}
                copiedMaterialIds={copiedMaterialIds}
              />

              <StepActions currentStep={publishStep} setPublishStep={setPublishStep} />
            </div>
          )}

          {publishStep === "publish" && (
            <div className="space-y-4">
              <CompletionCard
                done={hasCopiedBody}
                text="正文 HTML 已复制；标题、摘要和关键词按需复制。"
              />
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
                  正文样式会复制为公众号可粘贴的 HTML。
                </p>
              </section>

              <PublishMaterials
                publishOptimization={publishOptimization}
                coverGenerationResult={coverGenerationResult}
                onApplyRecommendation={onApplyRecommendation}
                onCopyText={copyPlainText}
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
                  先生成发布物料
                </button>
              )}

              <StepActions currentStep={publishStep} setPublishStep={setPublishStep} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
