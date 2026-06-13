import { useEffect, useState } from "react";
import { aiStorageKeys } from "../_lib/formatter-constants";
import { createDefaultCoverPromptTemplates } from "../_lib/workflow-utils";
import type { CoverPromptTemplate } from "../_types/formatter";
import type { ShowToast } from "./use-toast";

const readCoverPromptTemplates = (): CoverPromptTemplate[] => {
  const raw = localStorage.getItem(aiStorageKeys.coverPrompts);
  if (!raw) return createDefaultCoverPromptTemplates();

  try {
    const parsed = JSON.parse(raw) as CoverPromptTemplate[];
    if (!Array.isArray(parsed) || parsed.length === 0) return createDefaultCoverPromptTemplates();
    const validTemplates = parsed.filter((item) => item.id && item.name && item.prompt);
    return validTemplates.length > 0 ? validTemplates : createDefaultCoverPromptTemplates();
  } catch {
    return createDefaultCoverPromptTemplates();
  }
};

export function useCoverPromptTemplates(showToast: ShowToast) {
  const [coverPromptTemplates, setCoverPromptTemplates] = useState<CoverPromptTemplate[]>([]);
  const [selectedCoverPromptId, setSelectedCoverPromptId] = useState("");

  useEffect(() => {
    const templates = readCoverPromptTemplates();
    const storedSelectedId = localStorage.getItem(aiStorageKeys.selectedCoverPromptId) || "";
    const selectedExists = templates.some((template) => template.id === storedSelectedId);
    setCoverPromptTemplates(templates);
    setSelectedCoverPromptId(selectedExists ? storedSelectedId : templates[0]?.id || "");
  }, []);

  useEffect(() => {
    if (coverPromptTemplates.length === 0) return;
    localStorage.setItem(aiStorageKeys.coverPrompts, JSON.stringify(coverPromptTemplates));
  }, [coverPromptTemplates]);

  useEffect(() => {
    if (!selectedCoverPromptId) return;
    localStorage.setItem(aiStorageKeys.selectedCoverPromptId, selectedCoverPromptId);
  }, [selectedCoverPromptId]);

  const selectedCoverPrompt =
    coverPromptTemplates.find((template) => template.id === selectedCoverPromptId) ||
    coverPromptTemplates[0];

  const saveCoverPromptTemplate = (draft: Pick<CoverPromptTemplate, "id" | "name" | "prompt">) => {
    const name = draft.name.trim();
    const prompt = draft.prompt.trim();
    if (!name || !prompt) {
      showToast("请填写生图提示词名称和内容", "error");
      return;
    }

    const now = new Date().toISOString();
    const id = draft.id || `cover-prompt-${Date.now()}`;
    setCoverPromptTemplates((current) => {
      const source = current.length > 0 ? current : createDefaultCoverPromptTemplates();
      const exists = source.some((template) => template.id === id);
      if (exists) {
        return source.map((template) =>
          template.id === id ? { ...template, name, prompt, updatedAt: now } : template,
        );
      }
      return [...source, { id, name, prompt, createdAt: now, updatedAt: now }];
    });
    setSelectedCoverPromptId(id);
    showToast("生图提示词已保存");
  };

  const deleteCoverPromptTemplate = (id: string) => {
    setCoverPromptTemplates((current) => {
      const next = current.filter((template) => template.id !== id);
      const fallback = next.length > 0 ? next : createDefaultCoverPromptTemplates();
      setSelectedCoverPromptId(fallback[0]?.id || "");
      return fallback;
    });
    showToast("生图提示词已删除");
  };

  return {
    coverPromptTemplates,
    selectedCoverPrompt,
    selectedCoverPromptId,
    setSelectedCoverPromptId,
    saveCoverPromptTemplate,
    deleteCoverPromptTemplate,
  };
}
