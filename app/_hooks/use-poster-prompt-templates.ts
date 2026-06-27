"use client";

import { useEffect, useState } from "react";
import { aiStorageKeys } from "../_lib/formatter-constants";
import { createDefaultPosterPromptTemplates } from "../_lib/workflow-utils";
import type { PosterPromptTemplate } from "../_types/formatter";
import type { ShowToast } from "./use-toast";

const readPosterPromptTemplates = (): PosterPromptTemplate[] => {
  const raw = localStorage.getItem(aiStorageKeys.posterPrompts);
  if (!raw) return createDefaultPosterPromptTemplates();

  try {
    const parsed = JSON.parse(raw) as PosterPromptTemplate[];
    if (!Array.isArray(parsed) || parsed.length === 0) return createDefaultPosterPromptTemplates();
    const validTemplates = parsed.filter((item) => item.id && item.name && item.prompt);
    return validTemplates.length > 0 ? validTemplates : createDefaultPosterPromptTemplates();
  } catch {
    return createDefaultPosterPromptTemplates();
  }
};

export function usePosterPromptTemplates(showToast: ShowToast) {
  const [posterPromptTemplates, setPosterPromptTemplates] = useState<PosterPromptTemplate[]>([]);
  const [selectedPosterPromptId, setSelectedPosterPromptId] = useState("");

  useEffect(() => {
    const templates = readPosterPromptTemplates();
    const storedSelectedId = localStorage.getItem(aiStorageKeys.selectedPosterPromptId) || "";
    const selectedExists = templates.some((template) => template.id === storedSelectedId);
    setPosterPromptTemplates(templates);
    setSelectedPosterPromptId(selectedExists ? storedSelectedId : templates[0]?.id || "");
  }, []);

  useEffect(() => {
    if (posterPromptTemplates.length === 0) return;
    localStorage.setItem(aiStorageKeys.posterPrompts, JSON.stringify(posterPromptTemplates));
  }, [posterPromptTemplates]);

  useEffect(() => {
    if (!selectedPosterPromptId) return;
    localStorage.setItem(aiStorageKeys.selectedPosterPromptId, selectedPosterPromptId);
  }, [selectedPosterPromptId]);

  const selectedPosterPrompt =
    posterPromptTemplates.find((template) => template.id === selectedPosterPromptId) ||
    posterPromptTemplates[0];

  const savePosterPromptTemplate = (
    draft: Pick<PosterPromptTemplate, "id" | "name" | "prompt">,
  ) => {
    const name = draft.name.trim();
    const prompt = draft.prompt.trim();
    if (!name || !prompt) {
      showToast("请填写贴图提示词名称和内容", "error");
      return;
    }

    const now = new Date().toISOString();
    const id = draft.id || `poster-prompt-${Date.now()}`;
    setPosterPromptTemplates((current) => {
      const source = current.length > 0 ? current : createDefaultPosterPromptTemplates();
      const exists = source.some((template) => template.id === id);
      if (exists) {
        return source.map((template) =>
          template.id === id ? { ...template, name, prompt, updatedAt: now } : template,
        );
      }
      return [...source, { id, name, prompt, createdAt: now, updatedAt: now }];
    });
    setSelectedPosterPromptId(id);
    showToast("贴图提示词已保存");
  };

  const deletePosterPromptTemplate = (id: string) => {
    setPosterPromptTemplates((current) => {
      const next = current.filter((template) => template.id !== id);
      const fallback = next.length > 0 ? next : createDefaultPosterPromptTemplates();
      setSelectedPosterPromptId(fallback[0]?.id || "");
      return fallback;
    });
    showToast("贴图提示词已删除");
  };

  return {
    posterPromptTemplates,
    selectedPosterPrompt,
    selectedPosterPromptId,
    setSelectedPosterPromptId,
    savePosterPromptTemplate,
    deletePosterPromptTemplate,
  };
}
