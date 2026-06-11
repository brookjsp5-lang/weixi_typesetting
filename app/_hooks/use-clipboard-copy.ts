import { useCallback } from "react";
import type { ShowToast } from "./use-toast";

export function useClipboardCopy(showToast: ShowToast) {
  return useCallback(
    async (html: string) => {
      if (!html) {
        showToast("请先生成排版内容", "error");
        return false;
      }

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const plainText = tempDiv.innerText || tempDiv.textContent || "";

      try {
        if (navigator.clipboard && window.ClipboardItem) {
          const clipboardItem = new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plainText], { type: "text/plain" }),
          });
          await navigator.clipboard.write([clipboardItem]);
          showToast("已复制！可直接粘贴到微信后台");
          return true;
        }
      } catch (err) {
        console.error("Clipboard API copy failed, falling back to execCommand:", err);
      }

      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);

      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      try {
        document.execCommand("copy");
        showToast("已复制！可直接粘贴到微信后台");
      } catch (err) {
        console.error("Copy failed:", err);
        showToast("复制失败，请重试", "error");
        return false;
      } finally {
        selection?.removeAllRanges();
        document.body.removeChild(tempDiv);
      }

      return true;
    },
    [showToast],
  );
}
