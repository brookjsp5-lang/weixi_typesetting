import {
  createImageGenerationErrorMessage,
  requestImageGeneration,
} from "../../_lib/cover-image-api";

const createImageTestError = (err: unknown) => {
  const message = err instanceof Error ? err.message : "";

  if (/auth|api key|unauthorized|401/i.test(message)) {
    return Response.json({ error: "生图 API Key 无效或没有权限" }, { status: 401 });
  }

  if (/model|not found|404|unsupported|image/i.test(message)) {
    return Response.json({ error: `真实图片生成失败：${message}` }, { status: 400 });
  }

  if (/quota|credit|billing|insufficient|payment|429/i.test(message)) {
    return Response.json({ error: "生图额度不足或请求过于频繁" }, { status: 429 });
  }

  if (/network|fetch|timeout|ECONN|ENOTFOUND|ETIMEDOUT/i.test(message)) {
    return Response.json({ error: "无法连接到生图接口，请检查生图 API 地址" }, { status: 502 });
  }

  return Response.json({ error: "真实图片生成失败，请检查接口、模型和额度" }, { status: 500 });
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { baseUrl, apiKey, model } = body as {
      baseUrl?: string;
      apiKey?: string;
      model?: string;
    };

    const trimmedBaseUrl = baseUrl?.trim();
    const trimmedApiKey = apiKey?.trim();
    const trimmedModel = model?.trim();

    if (!trimmedModel) {
      return Response.json({ error: "请先填写生图模型" }, { status: 400 });
    }

    if (!trimmedBaseUrl) {
      return Response.json(
        { error: "请先填写生图 API 地址，或使用文本 API 地址作为回退" },
        { status: 400 },
      );
    }

    if (!trimmedApiKey) {
      return Response.json(
        { error: "请先填写生图 API Key，或使用文本 API Key 作为回退" },
        { status: 400 },
      );
    }

    const result = await requestImageGeneration({
      baseUrl: trimmedBaseUrl,
      apiKey: trimmedApiKey,
      model: trimmedModel,
      prompt: "生成一张简洁的测试图片，白底，写有 OK 两个字。",
    });

    if (!result.response?.ok) {
      return Response.json(
        {
          error: createImageGenerationErrorMessage(
            result.data,
            result.response?.status || 500,
            "真实图片生成失败，请检查接口、模型和额度",
          ),
        },
        { status: result.response?.status || 500 },
      );
    }

    if (!result.imageUrl) {
      return Response.json(
        {
          error: createImageGenerationErrorMessage(
            result.data,
            result.response?.status || 502,
            "生图接口未返回图片，请更换生图模型后重试",
          ),
        },
        { status: 502 },
      );
    }

    return Response.json({ ok: true, message: "生图配置可用" });
  } catch (err: unknown) {
    console.error("AI image test error:", err instanceof Error ? err.message : err);
    return createImageTestError(err);
  }
}
