const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const createImageTestError = (err: unknown) => {
  const message = err instanceof Error ? err.message : "";

  if (/auth|api key|unauthorized|401/i.test(message)) {
    return Response.json({ error: "生图 API Key 无效或没有权限" }, { status: 401 });
  }

  if (/model|not found|404|unsupported|image/i.test(message)) {
    return Response.json({ error: "当前配置不支持真实生图，将使用备用封面草图" }, { status: 400 });
  }

  if (/quota|credit|billing|insufficient|payment|429/i.test(message)) {
    return Response.json({ error: "生图额度不足或请求过于频繁" }, { status: 429 });
  }

  if (/network|fetch|timeout|ECONN|ENOTFOUND|ETIMEDOUT/i.test(message)) {
    return Response.json({ error: "无法连接到生图接口，将使用备用封面草图" }, { status: 502 });
  }

  return Response.json({ error: "当前配置不支持真实生图，将使用备用封面草图" }, { status: 500 });
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

    const endpoint = `${normalizeBaseUrl(trimmedBaseUrl)}/images/generations`;
    const requestBody = {
      model: trimmedModel,
      prompt: "生成一张简洁的测试图片，白底，写有 OK 两个字。",
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    };

    let imageResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trimmedApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!imageResponse.ok && imageResponse.status === 400) {
      imageResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trimmedApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: trimmedModel,
          prompt: requestBody.prompt,
          n: 1,
          size: "1024x1024",
        }),
      });
    }

    const data = (await imageResponse.json().catch(() => null)) as {
      data?: Array<{ b64_json?: string; url?: string }>;
      error?: { message?: string } | string;
    } | null;

    if (!imageResponse.ok) {
      const message = typeof data?.error === "string" ? data.error : data?.error?.message || "";
      throw new Error(message || `image test failed: ${imageResponse.status}`);
    }

    const image = data?.data?.[0];
    if (!image?.b64_json && !image?.url) {
      return Response.json({ error: "生图接口未返回图片，将使用备用封面草图" }, { status: 502 });
    }

    return Response.json({ ok: true, message: "生图配置可用" });
  } catch (err: unknown) {
    console.error("AI image test error:", err instanceof Error ? err.message : err);
    return createImageTestError(err);
  }
}
