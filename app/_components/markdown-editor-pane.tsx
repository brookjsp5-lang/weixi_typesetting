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
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type React from "react";
import { isWechatImportedHtmlDraft } from "../_lib/draft-utils";
import { getMarkdownShortcutAction } from "../_lib/markdown-shortcut";
import type { ActiveTab, WordCount } from "../_types/formatter";

type MarkdownEditorPaneProps = {
  activeTab: ActiveTab;
  inputText: string;
  renderedInputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  onRenderedHtmlDraftChange: (value: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputScroll: (e: React.UIEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  wordCount: WordCount;
  draftSaveStatusText: string;
  htmlDraftRevision: number;
  wechatArticleUrl: string;
  setWechatArticleUrl: React.Dispatch<React.SetStateAction<string>>;
  isImportingWechatArticle: boolean;
  onImportWechatArticle: (url: string) => void;
  insertMarkdown: (prefix: string, suffix?: string, placeholder?: string) => void;
  insertHeading: (level: number) => void;
  insertList: (type: "ul" | "ol") => void;
  insertQuote: () => void;
  insertCodeBlock: () => void;
  insertLink: () => void;
  insertImage: () => void;
  onRestoreSample: () => void;
};

type DraftToolbarProps = {
  onHeading: (level: number) => void;
  onBold: () => void;
  onItalic: () => void;
  onStrike: () => void;
  onUnorderedList: () => void;
  onOrderedList: () => void;
  onQuote: () => void;
  onInlineCode: () => void;
  onCodeBlock: () => void;
  onLink: () => void;
  onImage: () => void;
  onDivider: () => void;
};

const keepEditorSelection = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
};

function DraftToolbar({
  onHeading,
  onBold,
  onItalic,
  onStrike,
  onUnorderedList,
  onOrderedList,
  onQuote,
  onInlineCode,
  onCodeBlock,
  onLink,
  onImage,
  onDivider,
}: DraftToolbarProps) {
  return (
    <div className="bg-(--neo-surface) px-3 py-2 border-b border-(--neo-line) flex flex-wrap items-center gap-2 shrink-0">
      <div className="flex items-center gap-1 mr-2">
        <button
          type="button"
          onMouseDown={keepEditorSelection}
          onClick={() => onHeading(1)}
          className="neo-toolbar-button p-1.5 text-sm"
          data-tooltip="一级标题"
          title="一级标题"
        >
          H1
        </button>
        <button
          type="button"
          onMouseDown={keepEditorSelection}
          onClick={() => onHeading(2)}
          className="neo-toolbar-button p-1.5 text-sm"
          data-tooltip="二级标题"
          title="二级标题"
        >
          H2
        </button>
        <button
          type="button"
          onMouseDown={keepEditorSelection}
          onClick={() => onHeading(3)}
          className="neo-toolbar-button p-1.5 text-sm"
          data-tooltip="三级标题"
          title="三级标题"
        >
          H3
        </button>
      </div>
      <div className="w-px h-6 bg-(--neo-line) mx-1" />
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onBold}
        className="neo-toolbar-button p-1.5"
        data-tooltip="加粗"
        title="加粗 (Ctrl+B)"
      >
        B
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onItalic}
        className="neo-toolbar-button p-1.5 italic"
        data-tooltip="斜体"
        title="斜体 (Ctrl+I)"
      >
        I
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onStrike}
        className="neo-toolbar-button p-1.5 line-through"
        data-tooltip="删除线"
        title="删除线"
      >
        S
      </button>
      <div className="w-px h-6 bg-(--neo-line) mx-1" />
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onUnorderedList}
        className="neo-toolbar-button p-1.5"
        data-tooltip="无序列表"
        title="无序列表"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onOrderedList}
        className="neo-toolbar-button p-1.5"
        data-tooltip="有序列表"
        title="有序列表"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onQuote}
        className="neo-toolbar-button p-1.5"
        data-tooltip="引用"
        title="引用"
      >
        <Quote className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-(--neo-line) mx-1" />
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onInlineCode}
        className="neo-toolbar-button p-1.5 font-mono text-sm"
        data-tooltip="行内代码"
        title="行内代码"
      >
        {"</>"}
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onCodeBlock}
        className="neo-toolbar-button p-1.5"
        data-tooltip="代码块"
        title="代码块"
      >
        <Code2 className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-(--neo-line) mx-1" />
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onLink}
        className="neo-toolbar-button p-1.5"
        data-tooltip="链接"
        title="链接"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onImage}
        className="neo-toolbar-button p-1.5"
        data-tooltip="图片"
        title="图片"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={onDivider}
        className="neo-toolbar-button p-1.5"
        data-tooltip="分隔线"
        title="分隔线"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const RICH_SELECTED_ATTR = "data-typezen-selected";
const VISUAL_ELEMENT_SELECTOR = "img, video, table, blockquote, pre, hr";

type DeletedVisualTarget = {
  path: number[];
  signatures: string[];
};

type DeletedVisualHistory = {
  html: string;
  targets: DeletedVisualTarget[];
};

type CommitEditorHtmlOptions = {
  detectDeletedVisuals?: boolean;
};

function isDeleteKey(event: Pick<KeyboardEvent | React.KeyboardEvent, "key">) {
  return event.key === "Backspace" || event.key === "Delete";
}

function isUndoKey(
  event: Pick<KeyboardEvent | React.KeyboardEvent, "ctrlKey" | "metaKey" | "shiftKey" | "key">,
) {
  return (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
}

function serializeRichEditorHtml(editor: HTMLElement) {
  const clone = editor.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(`[${RICH_SELECTED_ATTR}]`).forEach((element) => {
    element.removeAttribute(RICH_SELECTED_ATTR);
  });
  return clone.innerHTML;
}

function isImageOnlyWrapper(element: HTMLElement) {
  return !element.textContent?.trim() && Boolean(element.querySelector("img"));
}

function isSelectionInsideRichEditor(selection: Selection, editor: HTMLElement) {
  if (selection.rangeCount === 0) return false;

  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  return Boolean(anchorNode && focusNode && editor.contains(anchorNode) && editor.contains(focusNode));
}

function isRichEditorKeyContext(editor: HTMLElement) {
  const activeElement = document.activeElement;
  return !activeElement || activeElement === document.body || activeElement === editor || editor.contains(activeElement);
}

function findRichDeletableElement(target: EventTarget | null, editor: HTMLElement) {
  if (!(target instanceof HTMLElement)) return null;

  const visualTarget = target.closest(VISUAL_ELEMENT_SELECTOR);
  if (!(visualTarget instanceof HTMLElement) || !editor.contains(visualTarget)) return null;

  if (visualTarget.tagName.toLowerCase() !== "img") {
    return visualTarget;
  }

  let deletableElement = visualTarget;
  let parent = deletableElement.parentElement;
  while (parent && parent !== editor && editor.contains(parent) && isImageOnlyWrapper(parent)) {
    deletableElement = parent;
    parent = parent.parentElement;
  }

  return deletableElement;
}

function getElementPath(root: HTMLElement, element: HTMLElement) {
  const path: number[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== root) {
    const parent: HTMLElement | null = current.parentElement;
    if (!parent) return [];

    const index = Array.prototype.indexOf.call(parent.children, current);
    if (index < 0) return [];
    path.unshift(index);
    current = parent;
  }

  return current === root ? path : [];
}

function findElementByPath(root: HTMLElement, path: number[]) {
  let current: Element = root;

  for (const index of path) {
    const next = current.children.item(index);
    if (!(next instanceof HTMLElement)) return null;
    current = next;
  }

  return current instanceof HTMLElement && current !== root ? current : null;
}

function getImageSignatures(element: HTMLElement) {
  const signatures = new Set<string>();
  const addSignature = (name: string, value: string | null) => {
    const normalizedValue = value?.trim();
    if (normalizedValue) signatures.add(`${name}:${normalizedValue}`);
  };
  const addImage = (image: HTMLImageElement) => {
    addSignature("src", image.getAttribute("src"));
    addSignature("data-src", image.getAttribute("data-src"));
    addSignature("current-src", image.currentSrc);
  };

  if (element instanceof HTMLImageElement) {
    addImage(element);
  }
  element.querySelectorAll("img").forEach((image) => {
    addImage(image);
  });

  return Array.from(signatures);
}

function elementHasImageSignature(element: HTMLElement, signatures: string[]) {
  if (signatures.length === 0) return true;

  return Array.from(element.querySelectorAll("img"))
    .concat(element instanceof HTMLImageElement ? [element] : [])
    .some((image) => {
      const values = [
        `src:${image.getAttribute("src") || ""}`,
        `data-src:${image.getAttribute("data-src") || ""}`,
        `current-src:${image.currentSrc || ""}`,
      ];
      return values.some((value) => signatures.includes(value));
    });
}

function createDeletedVisualTarget(editor: HTMLElement, element: HTMLElement): DeletedVisualTarget {
  return {
    path: getElementPath(editor, element),
    signatures: getImageSignatures(element),
  };
}

function findDeletedVisualTargetElement(editor: HTMLElement, target: DeletedVisualTarget) {
  const pathElement = findElementByPath(editor, target.path);
  if (pathElement && elementHasImageSignature(pathElement, target.signatures)) {
    return pathElement;
  }

  if (target.signatures.length === 0) return null;

  for (const image of Array.from(editor.querySelectorAll("img"))) {
    if (!elementHasImageSignature(image, target.signatures)) continue;
    return findRichDeletableElement(image, editor) || image;
  }

  return null;
}

function removeDeletedVisualTargets(editor: HTMLElement, targets: DeletedVisualTarget[]) {
  let removed = false;

  for (const target of targets) {
    const element = findDeletedVisualTargetElement(editor, target);
    if (!element || !editor.contains(element) || element === editor) continue;
    element.remove();
    removed = true;
  }

  return removed;
}

function getDeletedVisualTargetKey(target: DeletedVisualTarget) {
  return `${target.path.join(".")}|${target.signatures.join("|")}`;
}

function collectDeletedVisualTargets(previousHtml: string, nextHtml: string) {
  if (!previousHtml || previousHtml === nextHtml) return [];

  const previousRoot = document.createElement("div");
  const nextRoot = document.createElement("div");
  previousRoot.innerHTML = previousHtml;
  nextRoot.innerHTML = nextHtml;

  const deletedTargets: DeletedVisualTarget[] = [];
  const seenTargets = new Set<string>();

  previousRoot.querySelectorAll(VISUAL_ELEMENT_SELECTOR).forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    const deletableElement = findRichDeletableElement(element, previousRoot) || element;
    const target = createDeletedVisualTarget(previousRoot, deletableElement);
    const targetKey = getDeletedVisualTargetKey(target);
    if (seenTargets.has(targetKey)) return;
    seenTargets.add(targetKey);

    if (findDeletedVisualTargetElement(nextRoot, target)) return;
    deletedTargets.push(target);
  });

  return deletedTargets;
}

type RichHtmlDraftEditorProps = {
  editorRef: React.RefObject<HTMLDivElement | null>;
  renderedValue: string;
  onChange: (value: string) => void;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
};

function RichHtmlDraftEditor({
  editorRef,
  renderedValue,
  onChange,
  onScroll,
}: RichHtmlDraftEditorProps) {
  const lastHtmlRef = useRef(renderedValue);
  const selectedElementRef = useRef<HTMLElement | null>(null);
  const deletedHtmlStackRef = useRef<DeletedVisualHistory[]>([]);
  const activeDeletedVisualTargetsRef = useRef<DeletedVisualTarget[]>([]);
  const pendingLocalHtmlRef = useRef("");

  const clearSelectedElement = useCallback(() => {
    selectedElementRef.current?.removeAttribute(RICH_SELECTED_ATTR);
    selectedElementRef.current = null;
  }, []);

  const selectVisualElement = useCallback(
    (element: HTMLElement) => {
      clearSelectedElement();
      element.setAttribute(RICH_SELECTED_ATTR, "true");
      selectedElementRef.current = element;
    },
    [clearSelectedElement],
  );

  const refreshActiveDeletedVisualTargets = useCallback(() => {
    activeDeletedVisualTargetsRef.current = deletedHtmlStackRef.current.flatMap(
      (history) => history.targets,
    );
  }, []);

  const pruneDeletedVisualTargets = useCallback((editor: HTMLElement) => {
    return removeDeletedVisualTargets(editor, activeDeletedVisualTargetsRef.current);
  }, []);

  const commitEditorHtml = useCallback(
    (editor: HTMLElement, options: CommitEditorHtmlOptions = {}) => {
      const previousHtml = lastHtmlRef.current;
      pruneDeletedVisualTargets(editor);
      let nextHtml = serializeRichEditorHtml(editor);
      if (options.detectDeletedVisuals !== false) {
        const deletedTargets = collectDeletedVisualTargets(previousHtml, nextHtml);
        if (deletedTargets.length > 0) {
          deletedHtmlStackRef.current.push({
            html: previousHtml,
            targets: deletedTargets,
          });
          refreshActiveDeletedVisualTargets();
          pruneDeletedVisualTargets(editor);
          nextHtml = serializeRichEditorHtml(editor);
        }
      }
      pendingLocalHtmlRef.current = nextHtml;
      lastHtmlRef.current = nextHtml;
      onChange(nextHtml);
      window.requestAnimationFrame(() => {
        if (serializeRichEditorHtml(editor) !== nextHtml) {
          clearSelectedElement();
          editor.innerHTML = nextHtml;
        }
      });
    },
    [clearSelectedElement, onChange, pruneDeletedVisualTargets, refreshActiveDeletedVisualTargets],
  );

  const restoreDeletedHtml = useCallback(
    (editor: HTMLElement) => {
      const previousHtml = deletedHtmlStackRef.current.pop();
      if (!previousHtml) return false;
      refreshActiveDeletedVisualTargets();

      clearSelectedElement();
      editor.innerHTML = previousHtml.html;
      pendingLocalHtmlRef.current = previousHtml.html;
      lastHtmlRef.current = previousHtml.html;
      onChange(previousHtml.html);
      return true;
    },
    [clearSelectedElement, onChange, refreshActiveDeletedVisualTargets],
  );

  const deleteSelectedElement = useCallback(
    (editor: HTMLElement) => {
      const selectedElement = selectedElementRef.current;
      if (!selectedElement || !editor.contains(selectedElement)) return false;

      deletedHtmlStackRef.current.push({
        html: serializeRichEditorHtml(editor),
        targets: [createDeletedVisualTarget(editor, selectedElement)],
      });
      refreshActiveDeletedVisualTargets();
      selectedElement.remove();
      selectedElementRef.current = null;
      commitEditorHtml(editor, { detectDeletedVisuals: false });
      return true;
    },
    [commitEditorHtml, refreshActiveDeletedVisualTargets],
  );

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const currentHtml = serializeRichEditorHtml(editor);
    const pendingLocalHtml = pendingLocalHtmlRef.current;

    if (pendingLocalHtml && currentHtml === pendingLocalHtml && renderedValue !== pendingLocalHtml) {
      return;
    }

    if (pendingLocalHtml && renderedValue === pendingLocalHtml) {
      pendingLocalHtmlRef.current = "";
    }

    if (lastHtmlRef.current === renderedValue && currentHtml === renderedValue) {
      lastHtmlRef.current = renderedValue;
      return;
    }

    clearSelectedElement();
    editor.innerHTML = renderedValue;
    if (pruneDeletedVisualTargets(editor)) {
      commitEditorHtml(editor);
      return;
    }
    lastHtmlRef.current = renderedValue;
  }, [clearSelectedElement, commitEditorHtml, editorRef, pruneDeletedVisualTargets, renderedValue]);

  const handleVisualElementClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!editor) return;

      const deletableElement = findRichDeletableElement(event.target, editor);
      if (!deletableElement) {
        clearSelectedElement();
        return;
      }

      event.preventDefault();
      selectVisualElement(deletableElement);
      editor.focus({ preventScroll: true });
    },
    [clearSelectedElement, editorRef, selectVisualElement],
  );

  const handleVisualElementDelete = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!editor) return;

      if (isUndoKey(event)) {
        if (restoreDeletedHtml(editor)) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      if (!isDeleteKey(event)) return;

      if (deleteSelectedElement(editor)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      selectedElementRef.current = null;
      const selection = window.getSelection();
      if (!(selection && !selection.isCollapsed && isSelectionInsideRichEditor(selection, editor))) {
        return;
      }

      event.preventDefault();
      selection.deleteFromDocument();
      event.stopPropagation();
      commitEditorHtml(editor);
    },
    [commitEditorHtml, deleteSelectedElement, editorRef, restoreDeletedHtml],
  );

  useEffect(() => {
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      const editor = editorRef.current;
      if (!editor) return;
      if (!isRichEditorKeyContext(editor)) return;

      if (isUndoKey(event) && restoreDeletedHtml(editor)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (selectedElementRef.current && isDeleteKey(event) && deleteSelectedElement(editor)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown, true);
    const handleDocumentPointerDown = (event: PointerEvent) => {
      const editor = editorRef.current;
      if (!editor || !(event.target instanceof Node) || editor.contains(event.target)) return;
      clearSelectedElement();
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [clearSelectedElement, deleteSelectedElement, editorRef, restoreDeletedHtml]);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={(event) => {
        commitEditorHtml(event.currentTarget);
      }}
      onClick={handleVisualElementClick}
      onKeyDownCapture={handleVisualElementDelete}
      onKeyDown={handleVisualElementDelete}
      onScroll={onScroll}
      className="rich-html-draft-editor flex-1 w-full overflow-y-auto custom-scrollbar bg-white p-4 lg:p-6 text-(--neo-ink) focus:outline-none [&_*]:max-w-full [&_img]:h-auto [&_img]:max-w-full"
    />
  );
}

export function MarkdownEditorPane({
  activeTab,
  inputText,
  renderedInputText,
  setInputText,
  onRenderedHtmlDraftChange,
  inputRef,
  onInputScroll,
  onPaste,
  wordCount,
  draftSaveStatusText,
  htmlDraftRevision,
  wechatArticleUrl,
  setWechatArticleUrl,
  isImportingWechatArticle,
  onImportWechatArticle,
  insertMarkdown,
  insertHeading,
  insertList,
  insertQuote,
  insertCodeBlock,
  insertLink,
  insertImage,
  onRestoreSample,
}: MarkdownEditorPaneProps) {
  const isImportedHtmlDraft = isWechatImportedHtmlDraft(inputText);
  const richEditorRef = useRef<HTMLDivElement>(null);

  const handleMarkdownShortcut = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const action = getMarkdownShortcutAction(event);
      if (!action) return;

      event.preventDefault();
      if (action === "bold") {
        insertMarkdown("**", "**", "加粗");
        return;
      }

      insertMarkdown("*", "*", "斜体");
    },
    [insertMarkdown],
  );

  const syncRichEditorHtml = useCallback(() => {
    const editor = richEditorRef.current;
    if (!editor) return;

    onRenderedHtmlDraftChange(serializeRichEditorHtml(editor));
  }, [onRenderedHtmlDraftChange]);

  const runRichEditorCommand = useCallback(
    (command: string, value?: string) => {
      const editor = richEditorRef.current;
      if (!editor) return;

      editor.focus();
      document.execCommand(command, false, value);
      syncRichEditorHtml();
    },
    [syncRichEditorHtml],
  );

  const getRichSelectedText = useCallback((fallback: string) => {
    const editor = richEditorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return fallback;

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    if (
      anchorNode &&
      focusNode &&
      editor.contains(anchorNode) &&
      editor.contains(focusNode)
    ) {
      return selection.toString() || fallback;
    }

    return fallback;
  }, []);

  const insertRichEditorHtml = useCallback(
    (html: string) => {
      const editor = richEditorRef.current;
      if (!editor) return;

      editor.focus();
      document.execCommand("insertHTML", false, html);
      syncRichEditorHtml();
    },
    [syncRichEditorHtml],
  );

  const handleRichHeading = useCallback(
    (level: number) => runRichEditorCommand("formatBlock", `H${level}`),
    [runRichEditorCommand],
  );

  const handleRichBold = useCallback(
    () => runRichEditorCommand("bold"),
    [runRichEditorCommand],
  );

  const handleRichItalic = useCallback(
    () => runRichEditorCommand("italic"),
    [runRichEditorCommand],
  );

  const handleRichStrike = useCallback(
    () => runRichEditorCommand("strikeThrough"),
    [runRichEditorCommand],
  );

  const handleRichUnorderedList = useCallback(
    () => runRichEditorCommand("insertUnorderedList"),
    [runRichEditorCommand],
  );

  const handleRichOrderedList = useCallback(
    () => runRichEditorCommand("insertOrderedList"),
    [runRichEditorCommand],
  );

  const handleRichQuote = useCallback(
    () => runRichEditorCommand("formatBlock", "BLOCKQUOTE"),
    [runRichEditorCommand],
  );

  const handleRichInlineCode = useCallback(() => {
    const text = escapeHtml(getRichSelectedText("代码"));
    insertRichEditorHtml(`<code>${text}</code>`);
  }, [getRichSelectedText, insertRichEditorHtml]);

  const handleRichCodeBlock = useCallback(() => {
    const text = escapeHtml(getRichSelectedText("代码"));
    insertRichEditorHtml(`<pre><code>${text}</code></pre>`);
  }, [getRichSelectedText, insertRichEditorHtml]);

  const handleRichLink = useCallback(() => {
    const text = escapeHtml(getRichSelectedText("链接文字"));
    insertRichEditorHtml(`<a href="url">${text}</a>`);
  }, [getRichSelectedText, insertRichEditorHtml]);

  const handleRichDivider = useCallback(() => {
    insertRichEditorHtml("<hr />");
  }, [insertRichEditorHtml]);

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
          <DraftToolbar
            onHeading={handleRichHeading}
            onBold={handleRichBold}
            onItalic={handleRichItalic}
            onStrike={handleRichStrike}
            onUnorderedList={handleRichUnorderedList}
            onOrderedList={handleRichOrderedList}
            onQuote={handleRichQuote}
            onInlineCode={handleRichInlineCode}
            onCodeBlock={handleRichCodeBlock}
            onLink={handleRichLink}
            onImage={insertImage}
            onDivider={handleRichDivider}
          />
          <div className="bg-(--neo-surface) px-3 py-2 border-b border-(--neo-line) flex flex-wrap items-center gap-2 shrink-0 text-xs font-bold text-(--neo-muted)">
            <span className="text-(--neo-ink)">公众号原文可视化编辑</span>
            <span>可直接点击正文修改文字，原排版会随内容一起保存。</span>
          </div>
          <RichHtmlDraftEditor
            key={`wechat-html-${htmlDraftRevision}`}
            editorRef={richEditorRef}
            renderedValue={renderedInputText}
            onChange={onRenderedHtmlDraftChange}
            onScroll={(event) =>
              onInputScroll(event as unknown as React.UIEvent<HTMLTextAreaElement>)
            }
          />
        </>
      ) : (
        <>
          <DraftToolbar
            onHeading={insertHeading}
            onBold={() => insertMarkdown("**", "**", "加粗")}
            onItalic={() => insertMarkdown("*", "*", "斜体")}
            onStrike={() => insertMarkdown("~~", "~~", "删除线")}
            onUnorderedList={() => insertList("ul")}
            onOrderedList={() => insertList("ol")}
            onQuote={insertQuote}
            onInlineCode={() => insertMarkdown("`", "`", "代码")}
            onCodeBlock={insertCodeBlock}
            onLink={insertLink}
            onImage={insertImage}
            onDivider={() => insertMarkdown("---\n", "", "")}
          />

          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleMarkdownShortcut}
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
