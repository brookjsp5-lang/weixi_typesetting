export type WechatArticleUrlResult = {
  url: string;
  error: string;
};

export type WechatArticleHtmlResult = {
  title: string;
  html: string;
};

export function normalizeWechatArticleUrl(rawUrl: string): WechatArticleUrlResult;

export function extractWechatArticleHtml(html: string): WechatArticleHtmlResult;
