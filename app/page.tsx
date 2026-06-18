"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AiConfigModal } from "./_components/ai-config-modal";
import { AppFooter } from "./_components/app-footer";
import { AppHeader } from "./_components/app-header";
import { ImageInsertModal } from "./_components/image-insert-modal";
import { MarkdownEditorPane } from "./_components/markdown-editor-pane";
import { PreviewPane } from "./_components/preview-pane";
import { RewardModal } from "./_components/reward-modal";
import { Toast } from "./_components/toast";
import { WorkflowPane } from "./_components/workflow-pane";
import { useAiSettings } from "./_hooks/use-ai-settings";
import { useAiWorkflow } from "./_hooks/use-ai-workflow";
import { useClipboardCopy } from "./_hooks/use-clipboard-copy";
import { useCoverPromptTemplates } from "./_hooks/use-cover-prompt-templates";
import { useDraftAutosave } from "./_hooks/use-draft-autosave";
import { useMarkdownTools } from "./_hooks/use-markdown-tools";
import { usePromptTemplates } from "./_hooks/use-prompt-templates";
import { useScrollSync } from "./_hooks/use-scroll-sync";
import { useTheme } from "./_hooks/use-theme";
import { useToast } from "./_hooks/use-toast";
import { useWordCount } from "./_hooks/use-word-count";
import { aiStorageKeys, sampleText } from "./_lib/formatter-constants";
import {
  createPublishWorkflowSteps,
  getCoverGenerationConfigStatus,
  runPublishChecks,
} from "./_lib/workflow-utils";
import type { ActiveTab, FormatTweaks, PublishStepId } from "./_types/formatter";
import { allTemplates, groupedTemplates, renderArticle } from "./template-engine";

const DEFAULT_FORMAT_TWEAKS: FormatTweaks = {
  fontSize: 16,
  lineHeight: 1.8,
  paragraphSpacing: 16,
  firstLineIndent: false,
  pagePaddingTop: 16,
  pagePaddingRight: 16,
  pagePaddingBottom: 16,
  pagePaddingLeft: 16,
  letterSpacing: 0,
  imageRadius: 8,
  themeColor: "#ff6f9f",
  h1Layout: "center",
  h2Layout: "left",
};

const legacyWorkflowStepMap: Record<string, PublishStepId> = {
  ai: "rewrite",
  templates: "format",
  checks: "check",
  publish: "publish",
};

const isPublishStepId = (value: string | null): value is PublishStepId =>
  value === "draft" ||
  value === "rewrite" ||
  value === "format" ||
  value === "image" ||
  value === "check" ||
  value === "publish";

export default function Home() {
  const [inputText, setInputText] = useState(sampleText);
  const [activeTab, setActiveTab] = useState<ActiveTab>("input");
  const [publishStep, setPublishStep] = useState<PublishStepId>("draft");
  const [currentTemplateId, setCurrentTemplateId] = useState<string>("neo-brutalism-0");
  const [currentCategory, setCurrentCategory] = useState<string>("neo-brutalism");
  const [formatTweaks, setFormatTweaks] = useState<FormatTweaks>(DEFAULT_FORMAT_TWEAKS);
  const [showReward, setShowReward] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map());
  const [imageUrl, setImageUrl] = useState("");
  const [imageDesc, setImageDesc] = useState("");
  const [hasCopiedForPublish, setHasCopiedForPublish] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageCounterRef = useRef(0);

  const { toast, showToast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const aiSettings = useAiSettings(showToast);
  const promptSettings = usePromptTemplates(showToast);
  const coverPromptSettings = useCoverPromptTemplates(showToast);
  const wordCount = useWordCount(inputText);
  const copyToClipboard = useClipboardCopy(showToast);
  const { syncScroll, setSyncScroll, previewRef, handleInputScroll, handlePreviewScroll } =
    useScrollSync(inputRef);
  const draftAutosave = useDraftAutosave({
    inputText,
    setInputText,
    imageMap,
    setImageMap,
    imageCounterRef,
    showToast,
  });

  const markdownTools = useMarkdownTools({
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
  });

  useEffect(() => {
    const savedStep = localStorage.getItem(aiStorageKeys.workflowTab);
    if (isPublishStepId(savedStep)) {
      setPublishStep(savedStep);
      return;
    }

    if (savedStep && legacyWorkflowStepMap[savedStep]) {
      setPublishStep(legacyWorkflowStepMap[savedStep]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(aiStorageKeys.workflowTab, publishStep);
  }, [publishStep]);

  const aiWorkflow = useAiWorkflow({
    inputText,
    setInputText,
    aiProviderType: aiSettings.aiProviderType,
    aiBaseUrl: aiSettings.aiBaseUrl,
    aiApiKey: aiSettings.aiApiKey,
    aiModel: aiSettings.aiModel,
    aiImageBaseUrl: aiSettings.aiImageBaseUrl,
    aiImageApiKey: aiSettings.aiImageApiKey,
    aiImageModel: aiSettings.aiImageModel,
    coverPrompt: coverPromptSettings.selectedCoverPrompt?.prompt || "",
    setShowAiConfigModal: aiSettings.setShowAiConfigModal,
    showToast,
  });

  const currentTemplate =
    allTemplates.find((template) => template.id === currentTemplateId) || allTemplates[0];

  const outputHtml = useMemo(() => {
    if (!inputText.trim()) return "";

    const processedText = inputText.replace(/!\[(.*?)\]\(#(img-\d+)\)/g, (match, alt, imageId) => {
      const base64 = imageMap.get(imageId);
      return base64 ? `![${alt}](${base64})` : match;
    });

    return renderArticle(processedText, currentTemplate, formatTweaks);
  }, [inputText, currentTemplate, formatTweaks, imageMap]);

  const publishChecks = useMemo(() => runPublishChecks(inputText), [inputText]);
  const coverGenerationConfigStatus = useMemo(
    () =>
      getCoverGenerationConfigStatus({
        textBaseUrl: aiSettings.aiBaseUrl,
        textApiKey: aiSettings.aiApiKey,
        imageBaseUrl: aiSettings.aiImageBaseUrl,
        imageApiKey: aiSettings.aiImageApiKey,
        imageModel: aiSettings.aiImageModel,
      }),
    [
      aiSettings.aiBaseUrl,
      aiSettings.aiApiKey,
      aiSettings.aiImageBaseUrl,
      aiSettings.aiImageApiKey,
      aiSettings.aiImageModel,
    ],
  );

  useEffect(() => {
    setHasCopiedForPublish(false);
  }, [outputHtml]);

  const publishWorkflowSteps = useMemo(
    () =>
      createPublishWorkflowSteps({
        hasContent: Boolean(inputText.trim()),
        hasRewriteDraft: Boolean(aiWorkflow.rewriteDraft),
        hasAppliedRewrite: aiWorkflow.hasAppliedRewrite,
        hasFormatDraft: Boolean(aiWorkflow.formatDraft),
        hasAppliedFormat: aiWorkflow.hasAppliedFormat,
        hasCoverGenerated: aiWorkflow.hasGeneratedCover,
        hasCheckWarnings: publishChecks.some((item) => item.status === "warning"),
        hasPublishOptimization: Boolean(aiWorkflow.publishOptimization),
        hasCopied: hasCopiedForPublish,
      }),
    [
      inputText,
      aiWorkflow.rewriteDraft,
      aiWorkflow.hasAppliedRewrite,
      aiWorkflow.formatDraft,
      aiWorkflow.hasAppliedFormat,
      aiWorkflow.hasGeneratedCover,
      publishChecks,
      aiWorkflow.publishOptimization,
      hasCopiedForPublish,
    ],
  );

  const handleCopy = async () => {
    const copied = await copyToClipboard(outputHtml);
    if (copied) setHasCopiedForPublish(true);
  };

  const handleRestoreSample = () => {
    imageCounterRef.current = 0;
    setImageMap(new Map());
    setInputText(sampleText);
  };

  return (
    <main className="min-h-screen flex flex-col neo-app-bg font-sans relative overflow-x-hidden">
      <Toast toast={toast} />

      <ImageInsertModal
        open={showImageModal}
        imageDesc={imageDesc}
        setImageDesc={setImageDesc}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        onClose={() => setShowImageModal(false)}
        onLocalImage={markdownTools.handleLocalImage}
        onOnlineImage={markdownTools.handleOnlineImage}
      />

      <AiConfigModal
        open={aiSettings.showAiConfigModal}
        aiProviderType={aiSettings.aiProviderType}
        setAiProviderType={aiSettings.setAiProviderType}
        aiBaseUrl={aiSettings.aiBaseUrl}
        setAiBaseUrl={aiSettings.setAiBaseUrl}
        aiApiKey={aiSettings.aiApiKey}
        setAiApiKey={aiSettings.setAiApiKey}
        aiModel={aiSettings.aiModel}
        setAiModel={aiSettings.setAiModel}
        aiImageBaseUrl={aiSettings.aiImageBaseUrl}
        setAiImageBaseUrl={aiSettings.setAiImageBaseUrl}
        aiImageApiKey={aiSettings.aiImageApiKey}
        setAiImageApiKey={aiSettings.setAiImageApiKey}
        aiImageModel={aiSettings.aiImageModel}
        setAiImageModel={aiSettings.setAiImageModel}
        onClose={() => aiSettings.setShowAiConfigModal(false)}
        onSave={aiSettings.saveAiSettings}
        onClear={aiSettings.clearAiSettings}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={markdownTools.handleFileChange}
        className="hidden"
      />

      <RewardModal open={showReward} onClose={() => setShowReward(false)} />

      <div className="h-screen flex flex-col overflow-hidden shrink-0">
        <AppHeader
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onShowReward={() => setShowReward(true)}
          onCopy={handleCopy}
          hasContent={Boolean(inputText.trim())}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-4 lg:gap-6 h-full">
            <MarkdownEditorPane
              activeTab={activeTab}
              inputText={inputText}
              setInputText={setInputText}
              inputRef={inputRef}
              onInputScroll={handleInputScroll}
              onPaste={markdownTools.handlePaste}
              wordCount={wordCount}
              draftSaveStatusText={draftAutosave.draftSaveStatusText}
              insertMarkdown={markdownTools.insertMarkdown}
              insertHeading={markdownTools.insertHeading}
              insertList={markdownTools.insertList}
              insertCodeBlock={markdownTools.insertCodeBlock}
              insertLink={markdownTools.insertLink}
              insertImage={markdownTools.insertImage}
              onRestoreSample={handleRestoreSample}
            />

            <PreviewPane
              activeTab={activeTab}
              previewRef={previewRef}
              onPreviewScroll={handlePreviewScroll}
              outputHtml={outputHtml}
            />

            <WorkflowPane
              activeTab={activeTab}
              publishStep={publishStep}
              setPublishStep={setPublishStep}
              inputText={inputText}
              wordCount={wordCount}
              runningTask={aiWorkflow.runningTask}
              publishWorkflowSteps={publishWorkflowSteps}
              onAiFormat={aiWorkflow.runFormat}
              onRewrite={aiWorkflow.runRewrite}
              hasAppliedRewrite={aiWorkflow.hasAppliedRewrite}
              appliedAiChange={aiWorkflow.appliedAiChange}
              onRestoreAiChange={aiWorkflow.restoreAppliedAiChange}
              onPublishOptimize={aiWorkflow.runPublishOptimize}
              onGenerateCover={aiWorkflow.runCoverGeneration}
              coverGenerationResult={aiWorkflow.coverGenerationResult}
              coverGenerationConfigStatus={coverGenerationConfigStatus}
              onOpenAiConfig={() => aiSettings.setShowAiConfigModal(true)}
              promptTemplates={promptSettings.promptTemplates}
              selectedPrompt={promptSettings.selectedPrompt}
              selectedPromptId={promptSettings.selectedPromptId}
              setSelectedPromptId={promptSettings.setSelectedPromptId}
              onSavePrompt={promptSettings.savePromptTemplate}
              onDeletePrompt={promptSettings.deletePromptTemplate}
              coverPromptTemplates={coverPromptSettings.coverPromptTemplates}
              selectedCoverPrompt={coverPromptSettings.selectedCoverPrompt}
              selectedCoverPromptId={coverPromptSettings.selectedCoverPromptId}
              setSelectedCoverPromptId={coverPromptSettings.setSelectedCoverPromptId}
              onSaveCoverPrompt={coverPromptSettings.saveCoverPromptTemplate}
              onDeleteCoverPrompt={coverPromptSettings.deleteCoverPromptTemplate}
              publishChecks={publishChecks}
              publishOptimization={aiWorkflow.publishOptimization}
              onCopy={handleCopy}
              allTemplatesCount={allTemplates.length}
              groupedTemplates={groupedTemplates}
              currentCategory={currentCategory}
              setCurrentCategory={setCurrentCategory}
              currentTemplateId={currentTemplateId}
              setCurrentTemplateId={setCurrentTemplateId}
              formatTweaks={formatTweaks}
              setFormatTweaks={setFormatTweaks}
              onResetFormatTweaks={() => setFormatTweaks(DEFAULT_FORMAT_TWEAKS)}
              syncScroll={syncScroll}
              setSyncScroll={setSyncScroll}
            />
          </div>
        </div>

        <AppFooter />
      </div>
    </main>
  );
}
