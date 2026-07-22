import { useCallback, useEffect, useMemo, useState } from "react";
import { aiStorageKeys } from "../_lib/formatter-constants";
import type { ReversePromptRequirementTemplate } from "../_types/formatter";
import type { ShowToast } from "./use-toast";

const createRequirementName = (requirement: string) => {
  const firstLine = requirement
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return (firstLine || "逆向提示词要求").slice(0, 24);
};

const readReversePromptRequirements = (): ReversePromptRequirementTemplate[] => {
  const raw = localStorage.getItem(aiStorageKeys.reversePromptRequirements);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ReversePromptRequirementTemplate[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item.id && item.name && item.requirement);
  } catch {
    return [];
  }
};

export function useReversePromptRequirements(showToast: ShowToast) {
  const [requirementTemplates, setRequirementTemplates] = useState<
    ReversePromptRequirementTemplate[]
  >([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState("");
  const [requirement, setRequirement] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const templates = readReversePromptRequirements();
    const savedRequirement =
      localStorage.getItem(aiStorageKeys.reversePromptRequirementDraft) || "";
    const savedSelectedId =
      localStorage.getItem(aiStorageKeys.selectedReversePromptRequirementId) || "";
    const validSelectedId = templates.some((template) => template.id === savedSelectedId)
      ? savedSelectedId
      : "";

    setRequirementTemplates(templates);
    setRequirement(savedRequirement);
    setSelectedRequirementId(validSelectedId);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(
      aiStorageKeys.reversePromptRequirements,
      JSON.stringify(requirementTemplates),
    );
  }, [isLoaded, requirementTemplates]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(aiStorageKeys.reversePromptRequirementDraft, requirement);
  }, [isLoaded, requirement]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(
      aiStorageKeys.selectedReversePromptRequirementId,
      selectedRequirementId,
    );
  }, [isLoaded, selectedRequirementId]);

  const selectedRequirementTemplate = useMemo(
    () => requirementTemplates.find((template) => template.id === selectedRequirementId),
    [requirementTemplates, selectedRequirementId],
  );

  const selectRequirementTemplate = useCallback(
    (id: string) => {
      setSelectedRequirementId(id);
      const template = requirementTemplates.find((item) => item.id === id);
      if (template) setRequirement(template.requirement);
    },
    [requirementTemplates],
  );

  const saveCurrentRequirement = useCallback(() => {
    const trimmedRequirement = requirement.trim();
    if (!trimmedRequirement) {
      showToast("请先填写逆向提示词要求", "error");
      return;
    }

    const now = new Date().toISOString();
    const existingId = selectedRequirementTemplate?.id || "";
    const id = existingId || `reverse-prompt-requirement-${Date.now()}`;
    const name = createRequirementName(trimmedRequirement);
    const isUpdating = Boolean(existingId);

    setRequirementTemplates((current) => {
      if (current.some((template) => template.id === id)) {
        return current.map((template) =>
          template.id === id
            ? { ...template, name, requirement: trimmedRequirement, updatedAt: now }
            : template,
        );
      }

      return [
        ...current,
        { id, name, requirement: trimmedRequirement, createdAt: now, updatedAt: now },
      ];
    });
    setSelectedRequirementId(id);
    showToast(isUpdating ? "逆向提示词要求已更新" : "逆向提示词要求已保存");
  }, [requirement, selectedRequirementTemplate, showToast]);

  const deleteCurrentRequirement = useCallback(() => {
    if (!selectedRequirementId) {
      showToast("请先选择要删除的逆向提示词要求", "error");
      return;
    }

    setRequirementTemplates((current) =>
      current.filter((template) => template.id !== selectedRequirementId),
    );
    setSelectedRequirementId("");
    setRequirement("");
    showToast("逆向提示词要求已删除");
  }, [selectedRequirementId, showToast]);

  return {
    requirement,
    requirementTemplates,
    selectedRequirementId,
    selectedRequirementTemplate,
    setRequirement,
    selectRequirementTemplate,
    saveCurrentRequirement,
    deleteCurrentRequirement,
  };
}
