import { useCallback } from "react";
import type React from "react";

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
}: UseMarkdownToolsParams) {
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
        inputText.substring(0, start) +
        prefix +
        textToInsert +
        suffix +
        inputText.substring(end);

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
      const newText = inputText.substring(0, start) + prefix + textToInsert + inputText.substring(end);

      setInputText(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.scrollTop = scrollTop;
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
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
      const newText = inputText.substring(0, start) + prefix + textToInsert + inputText.substring(end);

      setInputText(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.scrollTop = scrollTop;
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
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
    [
      imageCounterRef,
      imageDesc,
      inputRef,
      inputText,
      setImageMap,
      setInputText,
      setShowImageModal,
    ],
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

              setInputText((prev) => prev.substring(0, start) + imageMarkdown + prev.substring(end));

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
    [imageCounterRef, inputRef, setImageMap, setInputText],
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
