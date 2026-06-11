import {
  CheckCircle2,
  Clipboard,
  FileCheck2,
  Loader2,
  PenLine,
  Send,
  Settings,
  Sparkles,
  Tags,
  Wand2,
  X,
} from "lucide-react";
import { useState } from "react";
import type React from "react";
import type {
  ActiveTab,
  AiTaskType,
  FormatTweaks,
  PromptTemplate,
  PublishCheckItem,
  PublishOptimizationResult,
  RewriteDraft,
  WorkflowTab,
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
  workflowTab: WorkflowTab;
  setWorkflowTab: React.Dispatch<React.SetStateAction<WorkflowTab>>;
  inputText: string;
  runningTask: AiTaskType | null;
  onAiFormat: () => void;
  onRewrite: (promptTemplate?: PromptTemplate) => void;
  onPublishOptimize: () => void;
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

const workflowTabs: Array<{ id: WorkflowTab; label: string }> = [
  { id: "ai", label: "AI" },
  { id: "templates", label: "模板" },
  { id: "checks", label: "检查" },
  { id: "publish", label: "发布" },
];

const statusClassNames = {
  success: "bg-(--neo-green)",
  warning: "bg-(--neo-yellow)",
  neutral: "bg-(--neo-surface)",
} as const;

export function WorkflowPane({
  activeTab,
  workflowTab,
  setWorkflowTab,
  inputText,
  runningTask,
  onAiFormat,
  onRewrite,
  onPublishOptimize,
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

  const loadPromptForEdit = (template: PromptTemplate) => {
    setPromptDraftId(template.id);
    setPromptName(template.name);
    setPromptBody(template.prompt);
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

  const copyPlainText = async (text: string) => {
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
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
              发布工作流
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
          <div className="grid grid-cols-4 gap-2">
            {workflowTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWorkflowTab(tab.id)}
                className={`py-2 text-xs font-black ${
                  workflowTab === tab.id ? "neo-tab neo-tab-active" : "neo-tab"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-(--neo-surface) custom-scrollbar">
          {workflowTab === "ai" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={onAiFormat}
                  disabled={!inputText.trim() || Boolean(runningTask)}
                  className="neo-button neo-button-pink px-4 py-3 flex items-center justify-center gap-2"
                >
                  {runningTask === "format" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  AI 一键排版
                </button>
                <button
                  type="button"
                  onClick={onPublishOptimize}
                  disabled={!inputText.trim() || Boolean(runningTask)}
                  className="neo-button neo-button-primary px-4 py-3 flex items-center justify-center gap-2"
                >
                  {runningTask === "publishOptimize" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileCheck2 className="w-4 h-4" />
                  )}
                  生成发布优化
                </button>
              </div>

              <section className="border border-(--neo-line) rounded-xl p-3 bg-(--neo-surface) space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-black flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5" />
                    提示词改写
                  </h3>
                  <button
                    type="button"
                    disabled={!selectedPrompt || Boolean(runningTask)}
                    onClick={() => onRewrite(selectedPrompt)}
                    className="neo-button neo-button-secondary px-3 py-1.5 text-xs"
                  >
                    {runningTask === "rewrite" ? "改写中..." : "按提示词改写"}
                  </button>
                </div>
                <select
                  value={selectedPromptId}
                  onChange={(e) => setSelectedPromptId(e.target.value)}
                  className="neo-input w-full px-3 py-2 text-sm"
                >
                  {promptTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs neo-text-muted font-bold leading-relaxed">
                  {selectedPrompt?.prompt || "选择一个提示词后，可生成改写稿并确认应用。"}
                </p>
              </section>

              {rewriteDraft && (
                <section className="border border-(--neo-line) rounded-xl p-3 bg-(--neo-cyan) text-(--neo-ink) space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-black">改写草稿 · {rewriteDraft.promptName}</h3>
                    <button type="button" onClick={onDiscardRewrite} className="neo-toolbar-button p-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto bg-white border border-(--neo-line) rounded-lg p-2 text-xs leading-relaxed whitespace-pre-wrap">
                    {rewriteDraft.rewritten}
                  </div>
                  <button
                    type="button"
                    onClick={onApplyRewrite}
                    className="neo-button neo-button-primary w-full py-2"
                  >
                    应用到编辑区
                  </button>
                </section>
              )}

              <section className="border border-(--neo-line) rounded-xl p-3 bg-(--neo-surface) space-y-2">
                <h3 className="text-xs font-black flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5" />
                  保存提示词
                </h3>
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
                  <button type="button" onClick={savePrompt} className="neo-button neo-button-primary flex-1 py-2 text-xs">
                    保存
                  </button>
                  <button type="button" onClick={clearPromptDraft} className="neo-button neo-button-ghost px-3 py-2 text-xs">
                    清空
                  </button>
                </div>
                <div className="space-y-2 pt-1">
                  {promptTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between gap-2 border border-(--neo-line) rounded-lg p-2"
                    >
                      <button
                        type="button"
                        onClick={() => loadPromptForEdit(template)}
                        className="text-left text-xs font-black underline truncate"
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
              </section>
            </div>
          )}

          {workflowTab === "templates" && (
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
          )}

          {workflowTab === "checks" && (
            <div className="space-y-3">
              {publishChecks.map((item) => (
                <div key={item.id} className="border border-(--neo-line) rounded-xl p-3 bg-(--neo-surface)">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-3 h-3 rounded-full border border-(--neo-line) ${statusClassNames[item.status]}`}
                    />
                    <h3 className="text-sm font-black">{item.label}</h3>
                  </div>
                  <p className="text-xs neo-text-muted font-bold leading-relaxed">{item.message}</p>
                </div>
              ))}
            </div>
          )}

          {workflowTab === "publish" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={onCopy}
                disabled={!inputText.trim()}
                className="neo-button neo-button-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <Clipboard className="w-4 h-4" />
                复制到公众号后台
              </button>

              {publishOptimization ? (
                <>
                  <section className="border border-(--neo-line) rounded-xl p-3 bg-(--neo-surface) space-y-2">
                    <h3 className="text-xs font-black">标题候选</h3>
                    {publishOptimization.titles.map((title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => copyPlainText(title)}
                        className="w-full text-left border border-(--neo-line) rounded-lg p-2 text-xs font-bold hover:bg-(--neo-cyan)"
                      >
                        {title}
                      </button>
                    ))}
                  </section>

                  <section className="border border-(--neo-line) rounded-xl p-3 bg-(--neo-surface) space-y-2">
                    <h3 className="text-xs font-black">摘要</h3>
                    <p className="text-xs neo-text-muted font-bold leading-relaxed">
                      {publishOptimization.summary}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyPlainText(publishOptimization.summary)}
                      className="neo-button neo-button-ghost px-3 py-1.5 text-xs"
                    >
                      复制摘要
                    </button>
                  </section>

                  <section className="border border-(--neo-line) rounded-xl p-3 bg-(--neo-surface) space-y-2">
                    <h3 className="text-xs font-black flex items-center gap-1.5">
                      <Tags className="w-3.5 h-3.5" />
                      关键词/标签
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {publishOptimization.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="border border-(--neo-line) rounded-full bg-(--neo-cyan) px-2 py-1 text-xs font-bold text-(--neo-ink)"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="border border-(--neo-line) rounded-xl p-3 bg-(--neo-surface) space-y-2">
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

                  {publishOptimization.suggestions.length > 0 && (
                    <section className="border border-(--neo-line) rounded-xl p-3 bg-(--neo-surface) space-y-2">
                      <h3 className="text-xs font-black">发布建议</h3>
                      <div className="space-y-2">
                        {publishOptimization.suggestions.map((suggestion) => (
                          <p
                            key={suggestion}
                            className="text-xs neo-text-muted font-bold leading-relaxed"
                          >
                            {suggestion}
                          </p>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <div className="border border-(--neo-line) rounded-xl p-4 text-sm font-bold neo-text-muted">
                  在 AI 标签页点击“生成发布优化”，这里会显示标题、摘要、关键词和模板建议。
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
