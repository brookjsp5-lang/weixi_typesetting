import {
  Code2,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
} from "lucide-react";
import { useEffect, useRef } from "react";
import type React from "react";
import { isWechatImportedHtmlDraft } from "../_lib/draft-utils";
import type { ActiveTab, WordCount } from "../_types/formatter";

type MarkdownEditorPaneProps = {
  activeTab: ActiveTab;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputScroll: (e: React.UIEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  wordCount: WordCount;
  draftSaveStatusText: string;
  wechatArticleUrl: string;
  setWechatArticleUrl: React.Dispatch<React.SetStateAction<string>>;
  isImportingWechatArticle: boolean;
  onImportWechatArticle: (url: string) => void;
  insertMarkdown: (prefix: string, suffix?: string, placeholder?: string) => void;
  insertHeading: (level: number) => void;
  insertList: (type: "ul" | "ol") => void;
  insertCodeBlock: () => void;
  insertLink: () => void;
  insertImage: () => void;
  onRestoreSample: () => void;
};

type RichHtmlDraftEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
};

function RichHtmlDraftEditor({ value, onChange, onScroll }: RichHtmlDraftEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef(value);
  const initialHtmlRef = useRef(value);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastHtmlRef.current || editor.innerHTML === value) return;

    editor.innerHTML = value;
    lastHtmlRef.current = value;
  }, [value]);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={(event) => {
        const nextHtml = event.currentTarget.innerHTML;
        lastHtmlRef.current = nextHtml;
        onChange(nextHtml);
      }}
      onScroll={onScroll}
      className="flex-1 w-full overflow-y-auto custom-scrollbar bg-white p-4 lg:p-6 text-(--neo-ink) focus:outline-none [&_*]:max-w-full [&_img]:h-auto [&_img]:max-w-full"
      dangerouslySetInnerHTML={{ __html: initialHtmlRef.current }}
    />
  );
}

export function MarkdownEditorPane({
  activeTab,
  inputText,
  setInputText,
  inputRef,
  onInputScroll,
  onPaste,
  wordCount,
  draftSaveStatusText,
  wechatArticleUrl,
  setWechatArticleUrl,
  isImportingWechatArticle,
  onImportWechatArticle,
  insertMarkdown,
  insertHeading,
  insertList,
  insertCodeBlock,
  insertLink,
  insertImage,
  onRestoreSample,
}: MarkdownEditorPaneProps) {
  const isImportedHtmlDraft = isWechatImportedHtmlDraft(inputText);

  return (
    <div
      className={`flex-[1.2] flex-col neo-panel overflow-hidden ${activeTab === "input" ? "flex" : "hidden md:flex"}`}
    >
      <div className="neo-strip px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 shrink-0 min-w-0">
        <span className="text-xs sm:text-sm font-black text-(--neo-on-header) flex items-center gap-2 uppercase shrink-0 min-w-0">
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate">初稿</span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-end w-full sm:w-auto">
          <button
            onClick={onRestoreSample}
            className="neo-button neo-button-secondary text-xs px-2 sm:px-2.5 py-1 whitespace-nowrap shrink-0"
            title="恢复示例 Markdown"
          >
            <span className="hidden max-[340px]:inline">恢复示例</span>
            <span className="inline max-[340px]:hidden">恢复示例内容</span>
          </button>
        </div>
      </div>

      <div className="bg-(--neo-surface) px-3 py-2 border-b border-(--neo-line) shrink-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <LinkIcon className="h-4 w-4 shrink-0 text-(--neo-ink)" />
            <span className="shrink-0 text-xs font-black text-(--neo-ink)">公众号链接</span>
            <input
              type="url"
              value={wechatArticleUrl}
              onChange={(event) => setWechatArticleUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !isImportingWechatArticle) {
                  onImportWechatArticle(wechatArticleUrl);
                }
              }}
              className="neo-input h-9 min-w-0 flex-1 px-3 py-1.5 text-xs"
              placeholder="https://mp.weixin.qq.com/s/..."
            />
          </label>
          <button
            type="button"
            onClick={() => onImportWechatArticle(wechatArticleUrl)}
            disabled={isImportingWechatArticle}
            className="neo-button neo-button-secondary inline-flex h-9 shrink-0 items-center justify-center gap-2 px-3 text-xs"
            title="导入公众号文章到初稿"
          >
            {isImportingWechatArticle ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LinkIcon className="h-3.5 w-3.5" />
            )}
            {isImportingWechatArticle ? "导入中..." : "导入公众号"}
          </button>
        </div>
      </div>

      {isImportedHtmlDraft ? (
        <>
          <div className="bg-(--neo-surface) px-3 py-2 border-b border-(--neo-line) flex flex-wrap items-center gap-2 shrink-0 text-xs font-bold text-(--neo-muted)">
            <span className="text-(--neo-ink)">公众号原文可视化编辑</span>
            <span>可直接点击正文修改文字，原排版会随内容一起保存。</span>
          </div>
          <RichHtmlDraftEditor
            value={inputText}
            onChange={(value) => setInputText(value)}
            onScroll={(event) =>
              onInputScroll(event as unknown as React.UIEvent<HTMLTextAreaElement>)
            }
          />
        </>
      ) : (
        <>
          <div className="bg-(--neo-surface) px-3 py-2 border-b border-(--neo-line) flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => insertHeading(1)}
                className="neo-toolbar-button p-1.5 text-sm"
                data-tooltip="一级标题"
                title="一级标题"
              >
                H1
              </button>
              <button
                onClick={() => insertHeading(2)}
                className="neo-toolbar-button p-1.5 text-sm"
                data-tooltip="二级标题"
                title="二级标题"
              >
                H2
              </button>
              <button
                onClick={() => insertHeading(3)}
                className="neo-toolbar-button p-1.5 text-sm"
                data-tooltip="三级标题"
                title="三级标题"
              >
                H3
              </button>
            </div>
            <div className="w-px h-6 bg-(--neo-line) mx-1" />
            <button
              onClick={() => insertMarkdown("**", "**", "加粗")}
              className="neo-toolbar-button p-1.5"
              data-tooltip="加粗"
              title="加粗 (Ctrl+B)"
            >
              B
            </button>
            <button
              onClick={() => insertMarkdown("*", "*", "斜体")}
              className="neo-toolbar-button p-1.5 italic"
              data-tooltip="斜体"
              title="斜体 (Ctrl+I)"
            >
              I
            </button>
            <button
              onClick={() => insertMarkdown("~~", "~~", "删除线")}
              className="neo-toolbar-button p-1.5 line-through"
              data-tooltip="删除线"
              title="删除线"
            >
              S
            </button>
            <div className="w-px h-6 bg-(--neo-line) mx-1" />
            <button
              onClick={() => insertList("ul")}
              className="neo-toolbar-button p-1.5"
              data-tooltip="无序列表"
              title="无序列表"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertList("ol")}
              className="neo-toolbar-button p-1.5"
              data-tooltip="有序列表"
              title="有序列表"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdown("> ", "", "引用内容")}
              className="neo-toolbar-button p-1.5"
              data-tooltip="引用"
              title="引用"
            >
              <Quote className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-(--neo-line) mx-1" />
            <button
              onClick={() => insertMarkdown("`", "`", "代码")}
              className="neo-toolbar-button p-1.5 font-mono text-sm"
              data-tooltip="行内代码"
              title="行内代码"
            >
              {"</>"}
            </button>
            <button
              onClick={insertCodeBlock}
              className="neo-toolbar-button p-1.5"
              data-tooltip="代码块"
              title="代码块"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-(--neo-line) mx-1" />
            <button
              onClick={insertLink}
              className="neo-toolbar-button p-1.5"
              data-tooltip="链接"
              title="链接"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              onClick={insertImage}
              className="neo-toolbar-button p-1.5"
              data-tooltip="图片"
              title="图片"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertMarkdown("---\n", "", "")}
              className="neo-toolbar-button p-1.5"
              data-tooltip="分隔线"
              title="分隔线"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onScroll={onInputScroll}
            onPaste={onPaste}
            className="flex-1 w-full p-4 lg:p-6 resize-none focus:outline-none text-(--neo-ink) leading-relaxed font-mono text-[14px] bg-(--neo-surface) overflow-y-auto custom-scrollbar"
            placeholder="支持标准 Markdown 语法：&#10;# 标题支持1-6级&#10;> 引用内容&#10;- 列表项1&#10;- 列表项2&#10;**加粗文字**"
          />
        </>
      )}

      <div className="bg-(--neo-section-header) px-4 py-2 border-t border-(--neo-line) flex items-center justify-between text-xs text-(--neo-muted) shrink-0 font-bold">
        <div className="flex items-center gap-4">
          <span>
            字符: <strong>{wordCount.chars}</strong>
          </span>
          <span>
            字数: <strong>{wordCount.words}</strong>
          </span>
          <span>
            预计阅读: <strong>{wordCount.readTime}分钟</strong>
          </span>
        </div>
        <span className="text-right">{draftSaveStatusText || "支持直接粘贴图片"}</span>
      </div>
    </div>
  );
}
