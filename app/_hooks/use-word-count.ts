import { useMemo } from "react";
import type { WordCount } from "../_types/formatter";

export function useWordCount(inputText: string): WordCount {
  return useMemo(() => {
    const text = inputText.trim();
    if (!text) return { chars: 0, words: 0, lines: 0, readTime: 0 };

    const chars = text.length;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const words = chineseChars + englishWords;
    const lines = text.split("\n").filter((line) => line.trim()).length;
    const readTime = Math.max(1, Math.ceil(words / 300));

    return { chars, words, lines, readTime };
  }, [inputText]);
}
