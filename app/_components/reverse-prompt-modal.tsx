import { Loader2, Wand2, X } from "lucide-react";

export type ReversePromptTarget = "rewrite" | "cover" | "poster";

export const reversePromptTargetLabels: Record<ReversePromptTarget, string> = {
  rewrite: "正文改写提示词",
  cover: "AI 生图提示词",
  poster: "公众号贴图提示词",
};

type ReversePromptModalProps = {
  open: boolean;
  requirement: string;
  article: string;
  target: ReversePromptTarget;
  isGenerating: boolean;
  onRequirementChange: (value: string) => void;
  onArticleChange: (value: string) => void;
  onTargetChange: (value: ReversePromptTarget) => void;
  onGenerate: () => void;
  onClose: () => void;
};

export function ReversePromptModal({
  open,
  requirement,
  article,
  target,
  isGenerating,
  onRequirementChange,
  onArticleChange,
  onTargetChange,
  onGenerate,
  onClose,
}: ReversePromptModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center neo-modal-backdrop p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border-2 border-(--neo-ink) bg-white shadow-[8px_8px_0_var(--neo-ink)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-(--neo-ink) bg-(--neo-yellow) px-4 py-3">
          <div className="flex items-center gap-2 text-base font-black text-(--neo-ink)">
            <Wand2 className="h-5 w-5" />
            逆向生成提示词
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neo-button neo-button-ghost p-2"
            aria-label="关闭逆向提示词弹窗"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[78vh] space-y-4 overflow-y-auto p-4">
          <label className="block space-y-2">
            <span className="text-sm font-black text-(--neo-ink)">目标类型</span>
            <select
              value={target}
              onChange={(event) => onTargetChange(event.target.value as ReversePromptTarget)}
              className="neo-input w-full px-3 py-2 text-sm"
            >
              {Object.entries(reversePromptTargetLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-black text-(--neo-ink)">逆向提示词要求</span>
            <textarea
              value={requirement}
              onChange={(event) => onRequirementChange(event.target.value)}
              className="neo-input min-h-28 w-full resize-y px-3 py-2 text-sm leading-relaxed"
              placeholder="例如：提炼这篇文章的写作方法，生成可复用的正文改写提示词；或提炼封面视觉风格，生成 AI 生图提示词。"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-black text-(--neo-ink)">需要逆向的文章</span>
            <textarea
              value={article}
              onChange={(event) => onArticleChange(event.target.value)}
              className="neo-input min-h-56 w-full resize-y px-3 py-2 text-sm leading-relaxed"
              placeholder="粘贴一篇希望反推提示词的文章，也可以使用当前编辑区内容。"
            />
          </label>

          <div className="rounded-xl border border-(--neo-line) bg-(--neo-surface) p-3 text-xs font-bold leading-relaxed neo-text-muted">
            生成结果会直接添加到所选提示词库，并自动选中新模板。
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
              className="neo-button neo-button-primary flex-1 px-4 py-3 inline-flex items-center justify-center gap-2 text-sm"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {isGenerating ? "正在生成提示词..." : "生成并添加到提示词库"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="neo-button neo-button-ghost px-4 py-3 text-sm"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
