const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^\[?::1\]?$/i,
];

const isBlockedHost = (hostname: string) =>
  PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));

const createError = (message: string, status = 400) =>
  Response.json({ error: message }, { status });

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const rawUrl = typeof body.url === "string" ? body.url.trim() : "";

    if (!rawUrl) {
      return createError("缺少图片地址");
    }

    let imageUrl: URL;
    try {
      imageUrl = new URL(rawUrl);
    } catch {
      return createError("图片地址格式不正确");
    }

    if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") {
      return createError("只支持导入 http 或 https 图片");
    }

    if (isBlockedHost(imageUrl.hostname)) {
      return createError("不支持导入本地或内网图片地址");
    }

    const imageResponse = await fetch(imageUrl.toString(), {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; WXTypesettingImageImporter/1.0; +https://weixi-typesetting.vercel.app)",
      },
      redirect: "follow",
    });

    if (!imageResponse.ok) {
      return createError("图片下载失败，请确认图片地址可访问", 422);
    }

    const contentType = imageResponse.headers.get("content-type")?.split(";")[0]?.trim() || "";
    if (!contentType.startsWith("image/")) {
      return createError("该地址返回的不是图片文件", 422);
    }

    const contentLength = Number(imageResponse.headers.get("content-length") || "0");
    if (contentLength > MAX_IMAGE_BYTES) {
      return createError("图片过大，请控制在 8MB 以内", 413);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    if (imageBuffer.byteLength > MAX_IMAGE_BYTES) {
      return createError("图片过大，请控制在 8MB 以内", 413);
    }

    const dataUrl = `data:${contentType};base64,${imageBuffer.toString("base64")}`;
    return Response.json({ dataUrl, contentType, bytes: imageBuffer.byteLength });
  } catch (error) {
    console.error("Import image error:", error);
    return createError("图片导入失败，请稍后重试", 500);
  }
}
