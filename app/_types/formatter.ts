export type ActiveTab = "input" | "preview" | "workflow";

export type WorkflowTab = "ai" | "templates" | "checks" | "publish";

export type AiProviderType =
  | "openrouter"
  | "deepseek"
  | "volcengine"
  | "dashscope"
  | "moonshot"
  | "zhipu"
  | "openai"
  | "anthropic"
  | "custom";

export type AiTaskType = "format" | "rewrite" | "publishOptimize";

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

export type RewriteDraft = {
  original: string;
  rewritten: string;
  promptName: string;
} | null;

export type PublishCheckStatus = "success" | "warning" | "neutral";

export type PublishCheckItem = {
  id: string;
  label: string;
  status: PublishCheckStatus;
  message: string;
};

export type PublishOptimizationResult = {
  titles: string[];
  summary: string;
  keywords: string[];
  recommendedTemplateId?: string;
  recommendedCategory?: string;
  recommendedThemeColor?: string;
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
