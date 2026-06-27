export type ActiveTab = "input" | "preview" | "workflow";

export type PublishStepId = "draft" | "rewrite" | "format" | "image" | "check" | "publish";

export type WorkflowTab = PublishStepId;

export type AiProviderType =
  | "openrouter"
  | "deepseek"
  | "volcengine"
  | "dashscope"
  | "qwen"
  | "minimax"
  | "mimo"
  | "moonshot"
  | "zhipu"
  | "openai"
  | "anthropic"
  | "custom";

export type AiTaskType = "format" | "rewrite" | "publishOptimize";

export type RunningAiTaskType = AiTaskType | "cover" | "poster";

export type ProviderPreset = {
  id: AiProviderType;
  name: string;
  baseUrl: string;
  defaultModel: string;
  apiKeyUrl: string;
  modelHelp: string;
};

export type H1LayoutType = "left" | "center" | "right";

export type FormatTweaks = {
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  firstLineIndent: boolean;
  pagePaddingTop: number;
  pagePaddingRight: number;
  pagePaddingBottom: number;
  pagePaddingLeft: number;
  letterSpacing: number;
  imageRadius: number;
  themeColor?: string;
  h1Layout: H1LayoutType;
  h2Layout: H1LayoutType;
};

export type OpenRouterModel = {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  promptPrice: string;
  completionPrice: string;
  isFree: boolean;
};

export type PromptTemplate = {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
};

export type CoverPromptTemplate = {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
};

export type PosterPromptTemplate = {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
};

export type RewriteDraft = {
  original: string;
  rewritten: string;
  promptName: string;
} | null;

export type FormatDraft = {
  original: string;
  formatted: string;
} | null;

export type AppliedAiChange = {
  taskType: "format" | "rewrite";
  original: string;
  applied: string;
  label: string;
  appliedAt: string;
} | null;

export type PublishCheckStatus = "success" | "warning" | "neutral";

export type PublishCheckItem = {
  id: string;
  label: string;
  status: PublishCheckStatus;
  message: string;
};

export type PublishWorkflowStep = {
  id: PublishStepId;
  label: string;
  status: "pending" | "active" | "warning" | "done";
  description: string;
};

export type CoverGenerationResult = {
  imageUrl: string;
  prompt: string;
  titleHint: string;
  createdAt: string;
  source?: "ai";
  warning?: string;
} | null;

export type PosterTextBrief = {
  title: string;
  quote: string;
  note: string;
  backgroundPrompt: string;
};

export type PosterGenerationResult = {
  imageUrl: string;
  backgroundImageUrl: string;
  prompt: string;
  brief: PosterTextBrief;
  createdAt: string;
  source?: "ai";
  warning?: string;
} | null;

export type PublishOptimizationResult = {
  titles: string[];
  summary: string;
  keywords: string[];
  suggestions: string[];
} | null;

export type ToastType = "success" | "error";

export type ToastState = {
  message: string;
  type: ToastType;
} | null;

export type WordCount = {
  chars: number;
  words: number;
  lines: number;
  readTime: number;
};
