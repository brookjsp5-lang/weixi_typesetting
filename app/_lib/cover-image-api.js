const IMAGE_GENERATIONS_PATH = "/images/generations";
const OPENROUTER_IMAGES_PATH = "/images";
const DASHSCOPE_IMAGE_GENERATION_PATH = "/services/aigc/multimodal-generation/generation";
const MINIMAX_IMAGE_GENERATION_PATH = "/image_generation";
const MINIMAX_PROMPT_MAX_LENGTH = 1500;

function limitText(value, maxLength) {
  const text = String(value || "");
  if (text.length <= maxLength) return text;
  return Array.from(text).slice(0, maxLength).join("");
}

export function resolveImageGenerationEndpoint(baseUrl) {
  const normalized = String(baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
  if (!normalized) return "";
  if (new RegExp(`${DASHSCOPE_IMAGE_GENERATION_PATH}$`, "i").test(normalized)) {
    return normalized;
  }
  if (new RegExp(`${MINIMAX_IMAGE_GENERATION_PATH}$`, "i").test(normalized)) return normalized;
  if (/api\.minimax(?:i)?\.(?:com|io)\/v1$/i.test(normalized)) {
    return `${normalized}${MINIMAX_IMAGE_GENERATION_PATH}`;
  }
  if (/openrouter\.ai\/api\/v1$/i.test(normalized)) return `${normalized}${OPENROUTER_IMAGES_PATH}`;
  if (/openrouter\.ai\/api\/v1\/images$/i.test(normalized)) return normalized;
  if (new RegExp(`${IMAGE_GENERATIONS_PATH}$`, "i").test(normalized)) return normalized;
  return `${normalized}${IMAGE_GENERATIONS_PATH}`;
}

export function isOpenRouterImageConfig({ baseUrl = "", providerType = "" } = {}) {
  const value = `${providerType} ${baseUrl}`.toLowerCase();
  return value.includes("openrouter");
}

export function isOpenAIImageConfig({ baseUrl = "", providerType = "" } = {}) {
  const value = `${providerType} ${baseUrl}`.toLowerCase();
  return value.includes("openai") || value.includes("api.openai.com");
}

export function isDashScopeImageConfig({ baseUrl = "", providerType = "" } = {}) {
  const value = `${providerType} ${baseUrl}`.toLowerCase();
  return (
    value.includes("dashscope") ||
    value.includes("qwen") ||
    value.includes("dashscope.aliyuncs.com")
  );
}

export function isMiniMaxImageConfig({ baseUrl = "", providerType = "" } = {}) {
  const value = `${providerType} ${baseUrl}`.toLowerCase();
  return value.includes("minimax") || value.includes("minimaxi.com");
}

export function getUnsupportedImageModelMessage({ providerType = "", model = "" } = {}) {
  const provider = String(providerType || "").toLowerCase();
  const normalizedModel = String(model || "").trim();
  const lowerModel = normalizedModel.toLowerCase();
  if (
    provider === "minimax" &&
    /^minimax-(m|text|abab)|^abab|m3$|m2\.7$|minimax-m3$/i.test(lowerModel)
  ) {
    return `${normalizedModel || "MiniMax-M3"} 是文本 / Coding 模型，不是生图模型。请将封面生图模型改为 image-01 或 image-01-live。`;
  }
  return "";
}

export function isZhipuImageConfig({ baseUrl = "", providerType = "" } = {}) {
  const value = `${providerType} ${baseUrl}`.toLowerCase();
  return (
    value.includes("zhipu") ||
    value.includes("bigmodel") ||
    value.includes("open.bigmodel.cn")
  );
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

export function buildImageGenerationRequestBodies({
  baseUrl,
  model,
  prompt,
  providerType,
  textMode = "canvas",
  imageLayout = "cover",
}) {
  const isPosterLayout = imageLayout === "poster";
  const isCanvasTextMode = textMode !== "model";

  if (isOpenRouterImageConfig({ baseUrl, providerType })) {
    return [
      {
        model,
        prompt,
        aspect_ratio: isPosterLayout ? "3:4" : "16:9",
        n: 1,
      },
    ];
  }

  if (isOpenAIImageConfig({ baseUrl, providerType })) {
    return [
      {
        model,
        prompt,
        n: 1,
        size: isPosterLayout ? "1024x1536" : "1536x1024",
      },
    ];
  }

  if (isDashScopeImageConfig({ baseUrl, providerType })) {
    const createDashScopePayload = (size) => {
      const parameters = {
        n: 1,
        size,
      };
      if (isPosterLayout && isCanvasTextMode) parameters.prompt_extend = false;
      return {
        model,
        input: {
          messages: [
            {
              role: "user",
              content: [{ text: prompt }],
            },
          ],
        },
        parameters,
      };
    };

    return isPosterLayout
      ? [createDashScopePayload("1728*2368"), createDashScopePayload("1104*1472")]
      : [createDashScopePayload("2688*1536")];
  }

  if (isMiniMaxImageConfig({ baseUrl, providerType })) {
    return [
      {
        model,
        prompt: limitText(prompt, MINIMAX_PROMPT_MAX_LENGTH),
        aspect_ratio: isPosterLayout ? "3:4" : "16:9",
        response_format: "url",
        n: 1,
        prompt_optimizer: isPosterLayout ? !isCanvasTextMode : textMode !== "model",
      },
    ];
  }

  if (isZhipuImageConfig({ baseUrl, providerType })) {
    return [
      {
        model,
        prompt,
        size: isPosterLayout ? "1088x1472" : "1728x960",
        quality: "hd",
      },
    ];
  }

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

  const squarePayloads = [
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

  if (!isPosterLayout) return squarePayloads;

  return [
    {
      model,
      prompt,
      n: 1,
      size: "1024x1536",
      response_format: "b64_json",
    },
    {
      model,
      prompt,
      n: 1,
      size: "1024x1536",
    },
    ...squarePayloads,
  ];
}

export function parseImageGenerationResult(data) {
  const image = data?.data?.[0];
  if (image?.b64_json) return `data:image/png;base64,${image.b64_json}`;
  if (data?.data?.image_base64) return `data:image/png;base64,${data.data.image_base64}`;
  if (Array.isArray(data?.data?.image_urls) && data.data.image_urls[0]) {
    return data.data.image_urls[0];
  }
  if (data?.data?.image_url) return data.data.image_url;
  const contentItems = data?.output?.choices?.[0]?.message?.content;
  if (Array.isArray(contentItems)) {
    const imageItem = contentItems.find((item) => item?.image);
    if (imageItem?.image) return imageItem.image;
  }
  return image?.url || "";
}

export async function remoteImageToDataUrl(imageUrl, fetchImpl = fetch) {
  if (!/^https?:\/\//i.test(String(imageUrl || ""))) return imageUrl;

  const response = await fetchImpl(imageUrl);
  if (!response.ok) {
    throw new Error(`图片链接不可访问（HTTP ${response.status}）`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  if (!/^image\//i.test(contentType)) {
    throw new Error(`图片链接返回的不是图片（${contentType}）`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export function getImageGenerationRawError(data) {
  if (!data) return "";
  if (typeof data.error === "string") return data.error;
  const baseResp = data.base_resp || data.baseResp;
  const statusCode = baseResp?.status_code ?? baseResp?.statusCode;
  const statusMessage = baseResp?.status_msg || baseResp?.statusMessage;
  if (statusMessage && statusCode !== 0 && statusCode !== "0") return statusMessage;
  return data.error?.message || data.message || "";
}

export function createImageGenerationErrorMessage(data, status, fallbackMessage) {
  const rawMessage = getImageGenerationRawError(data);
  if (rawMessage) return `真实图片生成失败：${rawMessage}`;
  if (status === 401 || status === 403) return "生图 API Key 无效或没有权限。";
  if (status === 429) return "生图额度不足或请求过于频繁。";
  return fallbackMessage || "真实图片生成失败，请检查接口、模型和额度。";
}

export async function requestImageGeneration({
  baseUrl,
  apiKey,
  model,
  prompt,
  providerType,
  textMode = "canvas",
  imageLayout = "cover",
}) {
  const endpoint = resolveImageGenerationEndpoint(baseUrl);
  const requestBodies = buildImageGenerationRequestBodies({
    baseUrl,
    model,
    prompt,
    providerType,
    textMode,
    imageLayout,
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
