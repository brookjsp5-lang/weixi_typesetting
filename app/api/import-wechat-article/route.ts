import {
  extractWechatArticleHtml,
  normalizeWechatArticleUrl,
} from "../../_lib/wechat-article-import";

const MAX_ARTICLE_HTML_BYTES = 5 * 1024 * 1024;

const createError = (message: string, status = 400) =>
  Response.json({ error: message }, { status });

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const { url: articleUrl, error } = normalizeWechatArticleUrl(body.url || "");

    if (error) return createError(error);

    const response = await fetch(articleUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.6",
        "User-Agent":
          "Mozilla/5.0 (compatible; TypeZenWechatImporter/1.0; +https://weixi-typesetting.vercel.app)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return createError("公众号文章加载失败，请确认链接可以公开访问", 422);
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    if (contentType && !contentType.includes("text/html")) {
      return createError("该链接返回的不是公众号文章页面", 422);
    }

    const contentLength = Number(response.headers.get("content-length") || "0");
    if (contentLength > MAX_ARTICLE_HTML_BYTES) {
      return createError("公众号文章内容过大，暂不支持直接导入", 413);
    }

    const html = await response.text();
    if (new TextEncoder().encode(html).byteLength > MAX_ARTICLE_HTML_BYTES) {
      return createError("公众号文章内容过大，暂不支持直接导入", 413);
    }

    const article = extractWechatArticleHtml(html);
    if (!article.html.trim()) {
      return createError("未识别到公众号正文内容", 422);
    }

    return Response.json({
      html: article.html,
      title: article.title,
      sourceUrl: articleUrl,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return createError("公众号文章加载超时，请稍后重试", 504);
    }

    console.error("Import WeChat article error:", error);
    return createError("公众号文章导入失败，请稍后重试", 500);
  }
}
