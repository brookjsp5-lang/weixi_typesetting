import { CircleDollarSign, Copy, Moon, Sun, Wand2 } from "lucide-react";
import type React from "react";
import type { ActiveTab } from "../_types/formatter";

type AppHeaderProps = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onShowReward: () => void;
  onOpenReversePrompt: () => void;
  onCopy: () => void;
  hasContent: boolean;
  activeTab: ActiveTab;
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
};

export function AppHeader({
  isDarkMode,
  toggleDarkMode,
  onShowReward,
  onOpenReversePrompt,
  onCopy,
  hasContent,
  activeTab,
  setActiveTab,
}: AppHeaderProps) {
  return (
    <header className="bg-(--neo-app-header) border-b border-(--neo-line) sticky top-0 z-20 backdrop-blur-xl shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="TypeZen"
            width={40}
            height={40}
            className="w-10 h-10 p-1 border border-(--neo-line) rounded-xl shadow-sm bg-white"
          />
          <h1 className="text-lg sm:text-2xl font-black tracking-tight text-(--neo-on-header)">
            WX · 公众号排版助手
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenReversePrompt}
            className="neo-button neo-button-secondary px-3 py-2 inline-flex items-center gap-2 text-sm font-black"
            title="逆向生成提示词"
          >
            <Wand2 className="w-5 h-5" />
            <span className="hidden lg:inline">逆向提示词</span>
          </button>
          <button
            onClick={toggleDarkMode}
            className="neo-button neo-button-ghost p-2"
            title={isDarkMode ? "切换到亮色模式" : "切换到暗黑模式"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={onShowReward}
            className="neo-button neo-button-pink p-2"
            title="赞赏支持"
          >
            <CircleDollarSign className="w-5 h-5" />
          </button>
          <button
            onClick={onCopy}
            className="neo-button neo-button-primary px-4 py-2 sm:px-6 sm:py-2.5 flex items-center gap-2 text-sm sm:text-base"
            disabled={!hasContent}
          >
            <Copy className="w-5 h-5 hidden sm:block" />
            一键复制发布
          </button>
        </div>
      </div>

      <div className="flex gap-2 bg-(--neo-sub-header) border-t border-(--neo-line) p-2 md:hidden">
        <button
          onClick={() => setActiveTab("input")}
          className={`flex-1 py-2 text-sm font-black ${activeTab === "input" ? "neo-tab neo-tab-active" : "neo-tab"}`}
        >
          编辑
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-2 text-sm font-black ${activeTab === "preview" ? "neo-tab neo-tab-active" : "neo-tab"}`}
        >
          预览
        </button>
        <button
          onClick={() => setActiveTab("workflow")}
          className={`flex-1 py-2 text-sm font-black ${activeTab === "workflow" ? "neo-tab neo-tab-active" : "neo-tab"}`}
        >
          工作流
        </button>
      </div>
    </header>
  );
}
