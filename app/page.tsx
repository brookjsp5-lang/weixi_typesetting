"use client";

import { type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { usePosterPromptTemplates } from "./_hooks/use-poster-prompt-templates";
import { usePosterLibrary } from "./_hooks/use-poster-library";
import { usePromptTemplates } from "./_hooks/use-prompt-templates";
import { useScrollSync } from "./_hooks/use-scroll-sync";
import { useTheme } from "./_hooks/use-theme";
import { useToast } from "./_hooks/use-toast";
import { useWordCount } from "./_hooks/use-word-count";
import {
  DEFAULT_COVER_TITLE_STYLE,
  normalizeCoverTitleStyle,
} from "./_lib/cover-title-layout";
import { normalizeConsecutiveImageBlocks } from "./_lib/draft-utils";
import { aiStorageKeys, sampleText } from "./_lib/formatter-constants";
import {
  DEFAULT_POSTER_TEXT_STYLE,
  normalizePosterTextStyle,
} from "./_lib/poster-text-style";
import {
  createPublishWorkflowSteps,
  getCoverGenerationConfigStatus,
  runPublishChecks,
} from "./_lib/workflow-utils";
import type {
  ActiveTab,
  CoverTitleStyle,
  FormatTweaks,
  ImageTextMode,
  PosterTextStyle,
  PublishStepId,
} from "./_types/formatter";
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
  const [coverTextMode, setCoverTextMode] = useState<ImageTextMode>("canvas");
  const [coverTitleStyle, setCoverTitleStyle] = useState<CoverTitleStyle>(
    DEFAULT_COVER_TITLE_STYLE,
  );
  const [posterTextMode, setPosterTextMode] = useState<ImageTextMode>("canvas");
  const [posterTextStyle, setPosterTextStyle] = useState<PosterTextStyle>(
    DEFAULT_POSTER_TEXT_STYLE,
  );

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageCounterRef = useRef(0);

  const { toast, showToast } = useToast();
  const normalizedInputText = useMemo(
    () => normalizeConsecutiveImageBlocks(inputText),
    [inputText],
  );
  const setNormalizedInputText = useCallback((value: SetStateAction<string>) => {
    setInputText((previous) => {
      const nextValue = typeof value === "function" ? value(previous) : value;
      return normalizeConsecutiveImageBlocks(nextValue);
    });
  }, []);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const aiSettings = useAiSettings(showToast);
  const promptSettings = usePromptTemplates(showToast);
  const coverPromptSettings = useCoverPromptTemplates(showToast);
  const posterPromptSettings = usePosterPromptTemplates(showToast);
  const posterLibrary = usePosterLibrary(showToast);
  const wordCount = useWordCount(inputText);
  const copyToClipboard = useClipboardCopy(showToast);
  const { syncScroll, setSyncScroll, previewRef, handleInputScroll, handlePreviewScroll } =
    useScrollSync(inputRef);
  const draftAutosave = useDraftAutosave({
    inputText,
    setInputText: setNormalizedInputText,
    imageMap,
    setImageMap,
    imageCounterRef,
    showToast,
  });

  const markdownTools = useMarkdownTools({
    inputText,
    setInputText: setNormalizedInputText,
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
    const savedCoverTextMode = localStorage.getItem(aiStorageKeys.coverTextMode);
    if (savedCoverTextMode === "canvas" || savedCoverTextMode === "model") {
      setCoverTextMode(savedCoverTextMode);
    }

    const savedCoverTitleStyle = localStorage.getItem(aiStorageKeys.coverTitleStyle);
    if (savedCoverTitleStyle) {
      try {
        setCoverTitleStyle(normalizeCoverTitleStyle(JSON.parse(savedCoverTitleStyle)));
      } catch {
        setCoverTitleStyle(DEFAULT_COVER_TITLE_STYLE);
      }
    }

    const savedPosterTextMode = localStorage.getItem(aiStorageKeys.posterTextMode);
    if (savedPosterTextMode === "canvas" || savedPosterTextMode === "model") {
      setPosterTextMode(savedPosterTextMode);
    }

    const savedPosterTextStyle = localStorage.getItem(aiStorageKeys.posterTextStyle);
    if (savedPosterTextStyle) {
      try {
        setPosterTextStyle(normalizePosterTextStyle(JSON.parse(savedPosterTextStyle)));
      } catch {
        setPosterTextStyle(DEFAULT_POSTER_TEXT_STYLE);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(aiStorageKeys.workflowTab, publishStep);
  }, [publishStep]);

  useEffect(() => {
    localStorage.setItem(aiStorageKeys.coverTextMode, coverTextMode);
  }, [coverTextMode]);

  useEffect(() => {
    localStorage.setItem(
      aiStorageKeys.coverTitleStyle,
      JSON.stringify(normalizeCoverTitleStyle(coverTitleStyle)),
    );
  }, [coverTitleStyle]);

  useEffect(() => {
    localStorage.setItem(aiStorageKeys.posterTextMode, posterTextMode);
  }, [posterTextMode]);

  useEffect(() => {
    localStorage.setItem(
      aiStorageKeys.posterTextStyle,
      JSON.stringify(normalizePosterTextStyle(posterTextStyle)),
    );
  }, [posterTextStyle]);

  const aiWorkflow = useAiWorkflow({
    inputText: normalizedInputText,
    setInputText: setNormalizedInputText,
    aiProviderType: aiSettings.aiProviderType,
    aiBaseUrl: aiSettings.aiBaseUrl,
    aiApiKey: aiSettings.aiApiKey,
    aiModel: aiSettings.aiModel,
    aiImageBaseUrl: aiSettings.aiImageBaseUrl,
    aiImageApiKey: aiSettings.aiImageApiKey,
    aiImageModel: aiSettings.aiImageModel,
    coverTextMode,
    coverTitleStyle,
    coverPrompt: coverPromptSettings.selectedCoverPrompt?.prompt || "",
    posterTextMode,
    posterTextStyle,
    posterPrompt: posterPromptSettings.selectedPosterPrompt?.prompt || "",
    posterPromptName: posterPromptSettings.selectedPosterPrompt?.name || "",
    onPosterGenerated: posterLibrary.savePoster,
    setShowAiConfigModal: aiSettings.setShowAiConfigModal,
    showToast,
  });

  const currentTemplate =
    allTemplates.find((template) => template.id === currentTemplateId) || allTemplates[0];

  const outputHtml = useMemo(() => {
    if (!normalizedInputText.trim()) return "";

    const processedText = normalizedInputText.replace(
      /!\[(.*?)\]\(#(img-\d+)\)/g,
      (match, alt, imageId) => {
        const base64 = imageMap.get(imageId);
        return base64 ? `![${alt}](${base64})` : match;
      },
    );

    return renderArticle(processedText, currentTemplate, formatTweaks);
  }, [normalizedInputText, currentTemplate, formatTweaks, imageMap]);

  const publishChecks = useMemo(
    () => runPublishChecks(inputText, { hasCoverImage: aiWorkflow.hasGeneratedCover }),
    [inputText, aiWorkflow.hasGeneratedCover],
  );
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
        hasPosterGenerated: false,
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
    setNormalizedInputText(sampleText);
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
              onGeneratePoster={aiWorkflow.runPosterGeneration}
              coverGenerationResult={aiWorkflow.coverGenerationResult}
              coverTextMode={coverTextMode}
              setCoverTextMode={setCoverTextMode}
              coverTitleStyle={coverTitleStyle}
              onCoverTitleStyleChange={(style) =>
                setCoverTitleStyle(normalizeCoverTitleStyle(style))
              }
              onResetCoverTitleStyle={() => setCoverTitleStyle(DEFAULT_COVER_TITLE_STYLE)}
              selectedCoverTitle={aiWorkflow.selectedCoverTitle}
              onSelectCoverTitle={aiWorkflow.recomposeCoverTitle}
              posterGenerationResult={aiWorkflow.posterGenerationResult}
              posterTextMode={posterTextMode}
              setPosterTextMode={setPosterTextMode}
              posterTextStyle={posterTextStyle}
              onPosterTextStyleChange={(style) =>
                setPosterTextStyle(normalizePosterTextStyle(style))
              }
              onResetPosterTextStyle={() => setPosterTextStyle(DEFAULT_POSTER_TEXT_STYLE)}
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
              posterPromptTemplates={posterPromptSettings.posterPromptTemplates}
              selectedPosterPrompt={posterPromptSettings.selectedPosterPrompt}
              selectedPosterPromptId={posterPromptSettings.selectedPosterPromptId}
              setSelectedPosterPromptId={posterPromptSettings.setSelectedPosterPromptId}
              onSavePosterPrompt={posterPromptSettings.savePosterPromptTemplate}
              onDeletePosterPrompt={posterPromptSettings.deletePosterPromptTemplate}
              posterLibraryItems={posterLibrary.posters}
              isLoadingPosterLibrary={posterLibrary.isLoadingPosters}
              onDeletePosterLibraryItem={posterLibrary.deletePoster}
              onClearPosterLibrary={posterLibrary.clearPosters}
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
              podcastScript={aiWorkflow.podcastScript}
              onGeneratePodcastScript={aiWorkflow.runPodcastScript}
              videoScript={aiWorkflow.videoScript}
              onGenerateVideoScript={aiWorkflow.runVideoScript}
            />
          </div>
        </div>

        <AppFooter />
      </div>
    </main>
  );
}
