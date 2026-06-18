import type React from "react";
import { useCallback } from "react";
import { htmlToMarkdownDraft, localizeRemoteMarkdownImages } from "../_lib/draft-utils";
import type { ShowToast } from "./use-toast";

type UseMarkdownToolsParams = {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imageCounterRef: React.MutableRefObject<number>;
  setImageMap: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  imageUrl: string;
  imageDesc: string;
  setImageUrl: React.Dispatch<React.SetStateAction<string>>;
  setImageDesc: React.Dispatch<React.SetStateAction<string>>;
  setShowImageModal: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: ShowToast;
};

export function useMarkdownTools({
  inputText,
  setInputText,
  inputRef,
  fileInputRef,
  imageCounterRef,
  setImageMap,
  imageUrl,
  imageDesc,
  setImageUrl,
  setImageDesc,
  setShowImageModal,
  showToast,
}: UseMarkdownToolsParams) {
  const importRemoteImage = useCallback(async (url: string) => {
    const response = await fetch("/api/import-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) return "";

    const result = (await response.json()) as { dataUrl?: string };
    return result.dataUrl || "";
  }, []);

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = prefix, placeholder: string = "") => {
      const textarea = inputRef.current;
      if (!textarea) return;

      const scrollTop = textarea.scrollTop;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = inputText.substring(start, end);
      const textToInsert = selectedText || placeholder;
      const newText =
        inputText.substring(0, start) + prefix + textToInsert + suffix + inputText.substring(end);

      setInputText(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.scrollTop = scrollTop;
        const newCursorPos = start + prefix.length + textToInsert.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [inputRef, inputText, setInputText],
  );

  const insertHeading = useCallback(
    (level: number) => {
      const textarea = inputRef.current;
      if (!textarea) return;

      const scrollTop = textarea.scrollTop;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = inputText.substring(start, end);
      const prefix = "#".repeat(level) + " ";
      const textToInsert = selectedText || "标题";
      const newText =
        inputText.substring(0, start) + prefix + textToInsert + inputText.substring(end);

      setInputText(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.scrollTop = scrollTop;
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + textToInsert.length,
        );
      }, 0);
    },
    [inputRef, inputText, setInputText],
  );

  const insertList = useCallback(
    (type: "ul" | "ol") => {
      const textarea = inputRef.current;
      if (!textarea) return;

      const scrollTop = textarea.scrollTop;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = inputText.substring(start, end);
      const prefix = type === "ul" ? "- " : "1. ";
      const textToInsert = selectedText || "列表项";
      const newText =
        inputText.substring(0, start) + prefix + textToInsert + inputText.substring(end);

      setInputText(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.scrollTop = scrollTop;
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + textToInsert.length,
        );
      }, 0);
    },
    [inputRef, inputText, setInputText],
  );

  const insertCodeBlock = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const scrollTop = textarea.scrollTop;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputText.substring(start, end);
    const codeBlock = "```javascript\n" + (selectedText || "代码") + "\n```";
    const newText = inputText.substring(0, start) + codeBlock + inputText.substring(end);

    setInputText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = scrollTop;
      const newCursorPos = start + 14 + (selectedText || "代码").length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [inputRef, inputText, setInputText]);

  const insertLink = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const scrollTop = textarea.scrollTop;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputText.substring(start, end);
    const linkText = selectedText || "链接文字";
    const linkMarkdown = `[${linkText}](url)`;
    const newText = inputText.substring(0, start) + linkMarkdown + inputText.substring(end);

    setInputText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = scrollTop;
      const urlStart = start + linkText.length + 3;
      textarea.setSelectionRange(urlStart, urlStart + 3);
    }, 0);
  }, [inputRef, inputText, setInputText]);

  const insertImage = useCallback(() => {
    setImageUrl("");
    setImageDesc("");
    setShowImageModal(true);
  }, [setImageDesc, setImageUrl, setShowImageModal]);

  const handleLocalImage = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const textarea = inputRef.current;
      const scrollTop = textarea?.scrollTop ?? 0;
      const start = textarea?.selectionStart ?? 0;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const imageId = `img-${++imageCounterRef.current}`;
        const desc = imageDesc || "图片";

        setImageMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(imageId, base64);
          return newMap;
        });

        const currentTextarea = inputRef.current;
        if (currentTextarea) {
          const currentEnd = currentTextarea.selectionEnd ?? start;
          const imageMarkdown = `![${desc}](#${imageId})`;
          const newText =
            inputText.substring(0, start) + imageMarkdown + inputText.substring(currentEnd);

          setInputText(newText);

          setTimeout(() => {
            currentTextarea.focus();
            currentTextarea.scrollTop = scrollTop;
            currentTextarea.setSelectionRange(
              start + imageMarkdown.length,
              start + imageMarkdown.length,
            );
          }, 0);
        }

        setShowImageModal(false);
      };
      reader.readAsDataURL(file);
    },
    [imageCounterRef, imageDesc, inputRef, inputText, setImageMap, setInputText, setShowImageModal],
  );

  const handleOnlineImage = useCallback(() => {
    if (!imageUrl.trim()) return;

    const textarea = inputRef.current;
    if (!textarea) return;

    const scrollTop = textarea.scrollTop;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const desc = imageDesc || "图片";
    const imageMarkdown = `![${desc}](${imageUrl.trim()})`;
    const newText = inputText.substring(0, start) + imageMarkdown + inputText.substring(end);

    setInputText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.scrollTop = scrollTop;
      textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
    }, 0);

    setShowImageModal(false);
  }, [imageDesc, imageUrl, inputRef, inputText, setInputText, setShowImageModal]);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const html = e.clipboardData?.getData("text/html");
      if (html?.trim()) {
        const textarea = inputRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const scrollTop = textarea.scrollTop;
          const localImages = new Map<string, string>();
          const result = htmlToMarkdownDraft(html, (dataUrl) => {
            const imageId = `img-${++imageCounterRef.current}`;
            localImages.set(imageId, dataUrl);
            return `#${imageId}`;
          });

          if (result.markdown) {
            const localized = await localizeRemoteMarkdownImages(
              result.markdown,
              importRemoteImage,
              (dataUrl) => {
                const imageId = `img-${++imageCounterRef.current}`;
                localImages.set(imageId, dataUrl);
                return `#${imageId}`;
              },
            );
            const markdownToInsert = localized.markdown;
            e.preventDefault();
            const prefix = inputText.substring(0, start);
            const suffix = inputText.substring(end);
            const spacerBefore = prefix && !prefix.endsWith("\n") ? "\n\n" : "";
            const spacerAfter = suffix && !suffix.startsWith("\n") ? "\n\n" : "";
            const nextCursor = start + spacerBefore.length + markdownToInsert.length;
            if (localImages.size > 0) {
              setImageMap((prev) => {
                const next = new Map(prev);
                localImages.forEach((value, key) => {
                  next.set(key, value);
                });
                return next;
              });
            }
            setInputText((prev) => {
              return `${prefix}${spacerBefore}${markdownToInsert}${spacerAfter}${suffix}`;
            });
            setTimeout(() => {
              textarea.focus();
              textarea.scrollTop = scrollTop;
              textarea.setSelectionRange(nextCursor, nextCursor);
            }, 0);
            if (localized.localizedCount > 0) {
              showToast(`已导入 ${localized.localizedCount} 张图片，可在预览中正常显示`, "success");
            }
            const failedImages = result.skippedImages + localized.failedCount;
            if (failedImages > 0) {
              showToast(`已导入文字，${failedImages} 张图片因权限或地址不可用未导入`, "error");
            }
            return;
          }
        }
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const imageId = `img-${++imageCounterRef.current}`;

            setImageMap((prev) => {
              const newMap = new Map(prev);
              newMap.set(imageId, base64);
              return newMap;
            });

            const textarea = inputRef.current;
            if (textarea) {
              const scrollTop = textarea.scrollTop;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const imageMarkdown = `\n![图片](#${imageId})\n`;

              setInputText(
                (prev) => prev.substring(0, start) + imageMarkdown + prev.substring(end),
              );

              setTimeout(() => {
                textarea.focus();
                textarea.scrollTop = scrollTop;
                textarea.setSelectionRange(
                  start + imageMarkdown.length,
                  start + imageMarkdown.length,
                );
              }, 0);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    },
    [imageCounterRef, importRemoteImage, inputRef, inputText, setImageMap, setInputText, showToast],
  );

  return {
    insertMarkdown,
    insertHeading,
    insertList,
    insertCodeBlock,
    insertLink,
    insertImage,
    handleLocalImage,
    handleFileChange,
    handleOnlineImage,
    handlePaste,
  };
}
