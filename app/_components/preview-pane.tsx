import type React from "react";
import type { ActiveTab } from "../_types/formatter";

type PreviewPaneProps = {
  activeTab: ActiveTab;
  previewRef: React.RefObject<HTMLDivElement | null>;
  onPreviewScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  outputHtml: string;
};

const emptyPreviewHtml =
  '<div class="neo-preview-empty">这里空空如也，请在左侧输入内容</div>';

export function PreviewPane({
  activeTab,
  previewRef,
  onPreviewScroll,
  outputHtml,
}: PreviewPaneProps) {
  return (
    <div
      ref={previewRef}
      onScroll={onPreviewScroll}
      className={`flex-[1.2] flex-col overflow-y-auto ${activeTab === "preview" ? "flex" : "hidden md:flex"} custom-scrollbar`}
    >
      <div className="flex-1 neo-panel-strong flex justify-center py-6 px-4 md:py-8">
        <div className="neo-phone-shell h-fit min-h-[667px] w-full max-w-[375px] shrink-0 relative transition-all duration-300 transform origin-top p-1.5">
          <div className="absolute top-0 inset-x-0 h-7 flex justify-between items-center px-6 z-10 pointer-events-none">
            <div className="text-[10px] font-medium text-(--neo-muted)">9:41</div>
            <div className="neo-phone-notch w-24 h-5 rounded-b-xl absolute left-1/2 -translate-x-1/2" />
            <div className="flex gap-1">
              <div className="neo-phone-notch w-3 h-2 rounded-sm" />
              <div className="neo-phone-notch w-3 h-2 rounded-sm" />
            </div>
          </div>
          <div className="neo-phone-status-strip pt-10 pb-2 px-4 text-center rounded-t-4xl">
            <div className="text-sm font-bold text-(--neo-ink) truncate">文章预览</div>
          </div>
          <div className="neo-phone-screen-area w-full rounded-b-4xl overflow-hidden flex flex-col pt-2 pb-6">
            <div className="flex-1 overflow-visible">
              <div
                className="w-full prose-img:max-w-full"
                dangerouslySetInnerHTML={{
                  __html: outputHtml || emptyPreviewHtml,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
