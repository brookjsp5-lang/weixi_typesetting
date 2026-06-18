const IMAGE_GENERATIONS_PATH = "/images/generations";

export function resolveImageGenerationEndpoint(baseUrl) {
  const normalized = String(baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
  if (!normalized) return "";
  if (new RegExp(`${IMAGE_GENERATIONS_PATH}$`, "i").test(normalized)) return normalized;
  return `${normalized}${IMAGE_GENERATIONS_PATH}`;
}

export function isVolcengineImageConfig({ baseUrl = "", providerType = "" } = {}) {
  const value = `${providerType} ${baseUrl}`.toLowerCase();
  return (
    value.includes("volcengine") ||
    value.includes("volces.com") ||
    value.includes("doubao") ||
    value.includes("ark.cn-")
  );
}

export function buildImageGenerationRequestBodies({ baseUrl, model, prompt, providerType }) {
  if (isVolcengineImageConfig({ baseUrl, providerType })) {
    return [
      {
        model,
        prompt,
        response_format: "url",
        size: "2K",
        stream: false,
        watermark: true,
        sequential_image_generation: "disabled",
      },
    ];
  }

  return [
    {
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    },
    {
      model,
      prompt,
      n: 1,
      size: "1024x1024",
    },
  ];
}

export function parseImageGenerationResult(data) {
  const image = data?.data?.[0];
  if (image?.b64_json) return `data:image/png;base64,${image.b64_json}`;
  return image?.url || "";
}

export function getImageGenerationRawError(data) {
  if (!data) return "";
  if (typeof data.error === "string") return data.error;
  return data.error?.message || data.message || "";
}

export function createImageGenerationErrorMessage(data, status, fallbackMessage) {
  const rawMessage = getImageGenerationRawError(data);
  if (rawMessage) return `真实图片生成失败：${rawMessage}`;
  if (status === 401 || status === 403) return "生图 API Key 无效或没有权限。";
  if (status === 429) return "生图额度不足或请求过于频繁。";
  return fallbackMessage || "真实图片生成失败，请检查接口、模型和额度。";
}

export async function requestImageGeneration({ baseUrl, apiKey, model, prompt, providerType }) {
  const endpoint = resolveImageGenerationEndpoint(baseUrl);
  const requestBodies = buildImageGenerationRequestBodies({
    baseUrl,
    model,
    prompt,
    providerType,
  });

  let lastResponse = null;
  let lastData = null;
  let lastRequestBody = requestBodies[0];

  for (const requestBody of requestBodies) {
    lastRequestBody = requestBody;
    const imageResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const data = await imageResponse.json().catch(() => null);

    if (imageResponse.ok) {
      return {
        data,
        imageUrl: parseImageGenerationResult(data),
        response: imageResponse,
        requestBody,
      };
    }

    lastResponse = imageResponse;
    lastData = data;

    if (imageResponse.status !== 400) break;
  }

  return {
    data: lastData,
    imageUrl: "",
    response: lastResponse,
    requestBody: lastRequestBody,
  };
}
