import { useEffect, useState } from "react";
import { aiStorageKeys } from "../_lib/formatter-constants";
import { createDefaultPromptTemplates } from "../_lib/workflow-utils";
import type { PromptTemplate } from "../_types/formatter";
import type { ShowToast } from "./use-toast";

const readPromptTemplates = (): PromptTemplate[] => {
  const raw = localStorage.getItem(aiStorageKeys.prompts);
  if (!raw) return createDefaultPromptTemplates();

  try {
    const parsed = JSON.parse(raw) as PromptTemplate[];
    if (!Array.isArray(parsed) || parsed.length === 0) return createDefaultPromptTemplates();
    return parsed.filter((item) => item.id && item.name && item.prompt);
  } catch {
    return createDefaultPromptTemplates();
  }
};

export function usePromptTemplates(showToast: ShowToast) {
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState("");

  useEffect(() => {
    const templates = readPromptTemplates();
    setPromptTemplates(templates);
    setSelectedPromptId(templates[0]?.id || "");
  }, []);

  useEffect(() => {
    if (promptTemplates.length === 0) return;
    localStorage.setItem(aiStorageKeys.prompts, JSON.stringify(promptTemplates));
  }, [promptTemplates]);

  const selectedPrompt =
    promptTemplates.find((template) => template.id === selectedPromptId) || promptTemplates[0];

  const savePromptTemplate = (draft: Pick<PromptTemplate, "id" | "name" | "prompt">) => {
    const name = draft.name.trim();
    const prompt = draft.prompt.trim();
    if (!name || !prompt) {
      showToast("请填写提示词名称和内容", "error");
      return;
    }

    const now = new Date().toISOString();
    const id = draft.id || `prompt-${Date.now()}`;
    setPromptTemplates((current) => {
      const exists = current.some((template) => template.id === id);
      if (exists) {
        return current.map((template) =>
          template.id === id ? { ...template, name, prompt, updatedAt: now } : template,
        );
      }
      return [...current, { id, name, prompt, createdAt: now, updatedAt: now }];
    });
    setSelectedPromptId(id);
    showToast("提示词已保存");
  };

  const deletePromptTemplate = (id: string) => {
    setPromptTemplates((current) => {
      const next = current.filter((template) => template.id !== id);
      const fallback = next.length > 0 ? next : createDefaultPromptTemplates();
      setSelectedPromptId(fallback[0]?.id || "");
      return fallback;
    });
    showToast("提示词已删除");
  };

  return {
    promptTemplates,
    selectedPrompt,
    selectedPromptId,
    setSelectedPromptId,
    savePromptTemplate,
    deletePromptTemplate,
  };
}
