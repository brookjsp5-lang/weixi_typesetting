import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  FileCheck2,
  Image as ImageIcon,
  Loader2,
  PenLine,
  Send,
  Settings,
  Sparkles,
  Tags,
  Wand2,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type {
  ActiveTab,
  AiTaskType,
  FormatDraft,
  FormatTweaks,
  ImageAssistResult,
  PromptTemplate,
  PublishCheckItem,
  PublishOptimizationResult,
  PublishStepId,
  PublishWorkflowStep,
  RewriteDraft,
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
  runningTask: AiTaskType | null;
  publishWorkflowSteps: PublishWorkflowStep[];
  onPublishPreparation: () => Promise<void>;
  isPreparingPublish: boolean;
  publishPreparationMessage: string;
  onAiFormat: () => void;
  formatDraft: FormatDraft;
  onApplyFormatDraft: () => void;
  onDiscardFormatDraft: () => void;
  onRewrite: (promptTemplate?: PromptTemplate) => void;
  hasAppliedRewrite: boolean;
  onPublishOptimize: () => void;
  onImageAssist: () => void;
  imageAssistResult: ImageAssistResult;
  onInsertImage: () => void;
  onOpenAiConfig: () => void;
  promptTemplates: PromptTemplate[];
  selectedPrompt?: PromptTemplate;
  selectedPromptId: string;
  setSelectedPromptId: React.Dispatch<React.SetStateAction<string>>;
  onSavePrompt: (draft: Pick<PromptTemplate, "id" | "name" | "prompt">) => void;
  onDeletePrompt: (id: string) => void;
  rewriteDraft: RewriteDraft;
  onApplyRewrite: () => void;
  onDiscardRewrite: () => void;
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
  rewrite: "按提示词生成改写稿，确认后再替换初稿。",
  format: "整理 Markdown 结构，并选择模板和主题细节。",
  image: "生成封面和正文配图方向，再插入本地或在线图片。",
  check: "生成标题、摘要、关键词，并检查发布风险。",
  publish: "复制正文和发布物料到公众号后台。",
};

function TextBox({
  label,
  text,
  maxHeight = "max-h-40",
}: {
  label: string;
  text: string;
  maxHeight?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-black neo-text-muted">{label}</div>
      <div
        className={`${maxHeight} overflow-y-auto rounded-lg border border-(--neo-line) bg-white p-2 text-xs leading-relaxed whitespace-pre-wrap`}
      >
        {text}
      </div>
    </div>
  );
}

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
        本步完成条件
      </div>
      {text}
    </section>
  );
}

function PublishPreparationCard({
  disabled,
  isPreparingPublish,
  publishPreparationMessage,
  preparationItems,
  onPublishPreparation,
}: {
  disabled: boolean;
  isPreparingPublish: boolean;
  publishPreparationMessage: string;
  preparationItems: Array<{ label: string; done: boolean }>;
  onPublishPreparation: () => Promise<void>;
}) {
  return (
    <section className="mb-3 rounded-xl border border-(--neo-line) bg-(--neo-cyan) p-3 space-y-3">
      <div>
        <h3 className="text-sm font-black text-(--neo-ink)">一键发布准备</h3>
        <p className="mt-1 text-xs font-bold leading-relaxed neo-text-muted">
          生成排版稿、配图建议、标题摘要关键词，不自动替换正文。
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {preparationItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-2 text-center text-[10px] font-black ${
              item.done
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-(--neo-line) bg-white text-(--neo-muted)"
            }`}
          >
            <div>{item.label}</div>
            <div className="mt-0.5 opacity-75">{item.done ? "已准备" : "待生成"}</div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void onPublishPreparation()}
        disabled={disabled || isPreparingPublish}
        className="neo-button neo-button-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPreparingPublish ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isPreparingPublish ? "准备中..." : "一键生成发布准备"}
      </button>
      {publishPreparationMessage && (
        <p className="text-[11px] font-bold leading-relaxed neo-text-muted">
          {publishPreparationMessage}
        </p>
      )}
    </section>
  );
}

function PublishMaterials({
  publishOptimization,
  onApplyRecommendation,
  onCopyText,
  copiedMaterialIds,
  compact = false,
}: {
  publishOptimization: PublishOptimizationResult;
  onApplyRecommendation: () => void;
  onCopyText: (text: string, id: string) => void;
  copiedMaterialIds: string[];
  compact?: boolean;
}) {
  if (!publishOptimization) {
    return (
      <div className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-4 text-sm font-bold neo-text-muted">
        生成后会显示标题候选、摘要、关键词和模板建议。
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
  copiedMaterialIds,
}: {
  hasCopiedBody: boolean;
  publishOptimization: PublishOptimizationResult;
  copiedMaterialIds: string[];
}) {
  const checklist = [
    { label: "正文 HTML", done: hasCopiedBody },
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
  onPublishPreparation,
  isPreparingPublish,
  publishPreparationMessage,
  onAiFormat,
  formatDraft,
  onApplyFormatDraft,
  onDiscardFormatDraft,
  onRewrite,
  hasAppliedRewrite,
  onPublishOptimize,
  onImageAssist,
  imageAssistResult,
  onInsertImage,
  onOpenAiConfig,
  promptTemplates,
  selectedPrompt,
  selectedPromptId,
  setSelectedPromptId,
  onSavePrompt,
  onDeletePrompt,
  rewriteDraft,
  onApplyRewrite,
  onDiscardRewrite,
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
  const [isFormatSettingsOpen, setIsFormatSettingsOpen] = useState(false);
  const [copiedMaterialIds, setCopiedMaterialIds] = useState<string[]>([]);

  const headingCount = (inputText.match(/^#{1,6}\s+.+$/gm) || []).length;
  const imageCount = (inputText.match(/!\[[^\]]*]\([^)]+\)/g) || []).length;
  const linkCount = Math.max(0, (inputText.match(/\[[^\]]+]\([^)]+\)/g) || []).length - imageCount);
  const currentStepLabel =
    publishWorkflowSteps.find((step) => step.id === publishStep)?.label || "发布工作流";
  const getStepStatus = (stepId: PublishStepId) =>
    publishWorkflowSteps.find((step) => step.id === stepId)?.status || "pending";
  const formatReady = Boolean(formatDraft) || getStepStatus("format") === "done";
  const imageReady = Boolean(imageAssistResult);
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

          <PublishPreparationCard
            disabled={!inputText.trim() || Boolean(runningTask) || isPreparingPublish}
            isPreparingPublish={isPreparingPublish}
            publishPreparationMessage={publishPreparationMessage}
            onPublishPreparation={onPublishPreparation}
            preparationItems={[
              { label: "排版稿", done: formatReady },
              { label: "配图建议", done: imageReady },
              { label: "发布物料", done: materialsReady },
            ]}
          />

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
                done={Boolean(rewriteDraft) || hasAppliedRewrite}
                text="可选步骤：需要改写时，先生成改写稿，再确认应用到初稿。"
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
                </div>
                <button
                  type="button"
                  disabled={!selectedPrompt || Boolean(runningTask) || isPreparingPublish}
                  onClick={() => onRewrite(selectedPrompt)}
                  className="neo-button neo-button-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Wand2 className="h-4 w-4" />
                  {runningTask === "rewrite" ? "改写中..." : "按提示词改写"}
                </button>
                <p className="text-xs neo-text-muted font-bold leading-relaxed">
                  选择提示词后生成改写稿，确认满意后再替换初稿。
                </p>
                {hasAppliedRewrite && (
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2 text-xs font-bold text-emerald-700">
                    已应用过改写稿
                  </div>
                )}
              </section>

              {rewriteDraft && (
                <section className="rounded-xl border border-(--neo-line) bg-(--neo-cyan) p-3 text-(--neo-ink) space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-black">改写草稿 · {rewriteDraft.promptName}</h3>
                    <button
                      type="button"
                      onClick={onDiscardRewrite}
                      className="neo-toolbar-button p-1"
                      title="取消改写稿"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <TextBox label="原文" text={rewriteDraft.original} maxHeight="max-h-28" />
                  <TextBox label="改写后" text={rewriteDraft.rewritten} />
                  <button
                    type="button"
                    onClick={onApplyRewrite}
                    className="neo-button neo-button-primary w-full py-2"
                  >
                    应用到初稿
                  </button>
                </section>
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
                text="已生成排版稿并应用，或已有排版稿等待确认。"
              />
              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={onAiFormat}
                    disabled={!inputText.trim() || Boolean(runningTask) || isPreparingPublish}
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
                    整理 Markdown 结构，不改写正文。
                  </p>
                </div>
              </section>

              {formatDraft && (
                <section className="rounded-xl border border-(--neo-line) bg-(--neo-cyan) p-3 text-(--neo-ink) space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-black">排版稿确认</h3>
                    <button
                      type="button"
                      onClick={onDiscardFormatDraft}
                      className="neo-toolbar-button p-1"
                      title="取消排版稿"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <TextBox label="原文" text={formatDraft.original} maxHeight="max-h-28" />
                  <TextBox label="排版后" text={formatDraft.formatted} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onApplyFormatDraft}
                      className="neo-button neo-button-primary flex-1 py-2 text-xs"
                    >
                      应用排版
                    </button>
                    <button
                      type="button"
                      onClick={onDiscardFormatDraft}
                      className="neo-button neo-button-ghost px-3 py-2 text-xs"
                    >
                      取消
                    </button>
                  </div>
                </section>
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
              <CompletionCard done={imageReady} text="已生成封面和正文配图建议。" />
              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <button
                  type="button"
                  onClick={onImageAssist}
                  disabled={!inputText.trim() || Boolean(runningTask) || isPreparingPublish}
                  className="neo-button neo-button-primary w-full px-4 py-3 flex items-center justify-center gap-2"
                >
                  {runningTask === "imageAssist" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  生成配图建议
                </button>
                <p className="px-1 text-[11px] font-bold leading-relaxed neo-text-muted">
                  生成封面和正文配图提示词，不直接创建图片。
                </p>
                <button
                  type="button"
                  onClick={onInsertImage}
                  className="neo-button neo-button-secondary w-full py-2 text-xs flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  插入本地/在线图片
                </button>
              </section>

              {imageAssistResult ? (
                <div className="space-y-3">
                  <section className="rounded-xl border border-(--neo-line) bg-(--neo-cyan) p-3 space-y-2">
                    <h3 className="text-xs font-black">封面提示词</h3>
                    <p className="text-xs font-bold leading-relaxed">
                      {imageAssistResult.coverPrompt}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyPlainText(imageAssistResult.coverPrompt)}
                      className="neo-button neo-button-ghost px-3 py-1.5 text-xs"
                    >
                      复制封面提示词
                    </button>
                  </section>

                  <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
                    <h3 className="text-xs font-black">正文配图提示词</h3>
                    {imageAssistResult.articleImagePrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => copyPlainText(prompt)}
                        className="w-full rounded-lg border border-(--neo-line) p-2 text-left text-xs font-bold hover:bg-(--neo-cyan)"
                      >
                        {prompt}
                      </button>
                    ))}
                  </section>

                  <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
                    <h3 className="text-xs font-black">图片描述</h3>
                    <div className="flex flex-wrap gap-2">
                      {imageAssistResult.imageDescriptions.map((description) => (
                        <button
                          key={description}
                          type="button"
                          onClick={() => copyPlainText(description)}
                          className="rounded-full border border-(--neo-line) bg-white px-2 py-1 text-xs font-bold"
                        >
                          {description}
                        </button>
                      ))}
                    </div>
                  </section>

                  {imageAssistResult.insertSuggestions.length > 0 && (
                    <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-2">
                      <h3 className="text-xs font-black">插入建议</h3>
                      {imageAssistResult.insertSuggestions.map((suggestion) => (
                        <p
                          key={suggestion}
                          className="text-xs neo-text-muted font-bold leading-relaxed"
                        >
                          {suggestion}
                        </p>
                      ))}
                    </section>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-4 text-sm font-bold neo-text-muted">
                  生成后会出现封面提示词、正文配图方向和图片描述。
                </div>
              )}

              <StepActions currentStep={publishStep} setPublishStep={setPublishStep} />
            </div>
          )}

          {publishStep === "check" && (
            <div className="space-y-4">
              <CompletionCard
                done={materialsReady}
                text="已生成标题候选、摘要、关键词，并查看发布检查项。"
              />
              <section className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 space-y-3">
                <button
                  type="button"
                  onClick={onPublishOptimize}
                  disabled={!inputText.trim() || Boolean(runningTask) || isPreparingPublish}
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

              <div className="space-y-3">
                {publishChecks.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-3 h-3 rounded-full border border-(--neo-line) ${
                          statusClassNames[item.status]
                        }`}
                      />
                      <h3 className="text-sm font-black">{item.label}</h3>
                    </div>
                    <p className="text-xs neo-text-muted font-bold leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>

              <PublishMaterials
                publishOptimization={publishOptimization}
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
                onApplyRecommendation={onApplyRecommendation}
                onCopyText={copyPlainText}
                copiedMaterialIds={copiedMaterialIds}
                compact
              />

              <PublishChecklist
                hasCopiedBody={hasCopiedBody}
                publishOptimization={publishOptimization}
                copiedMaterialIds={copiedMaterialIds}
              />

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
