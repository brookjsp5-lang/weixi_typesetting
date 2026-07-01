import assert from "node:assert/strict";
import test from "node:test";

import {
  buildImageGenerationRequestBodies,
  createImageGenerationErrorMessage,
  getUnsupportedImageModelMessage,
  parseImageGenerationResult,
  remoteImageToDataUrl,
  resolveImageGenerationEndpoint,
} from "../app/_lib/cover-image-api.js";

test("resolveImageGenerationEndpoint appends images/generations to a base URL", () => {
  assert.equal(
    resolveImageGenerationEndpoint("https://ark.cn-beijing.volces.com/api/v3"),
    "https://ark.cn-beijing.volces.com/api/v3/images/generations",
  );
});

test("resolveImageGenerationEndpoint keeps a complete images/generations endpoint", () => {
  assert.equal(
    resolveImageGenerationEndpoint("https://ark.cn-beijing.volces.com/api/v3/images/generations/"),
    "https://ark.cn-beijing.volces.com/api/v3/images/generations",
  );
});

test("resolveImageGenerationEndpoint uses OpenRouter images endpoint", () => {
  assert.equal(
    resolveImageGenerationEndpoint("https://openrouter.ai/api/v1"),
    "https://openrouter.ai/api/v1/images",
  );
  assert.equal(
    resolveImageGenerationEndpoint("https://openrouter.ai/api/v1/images/"),
    "https://openrouter.ai/api/v1/images",
  );
});

test("resolveImageGenerationEndpoint keeps a complete DashScope image endpoint", () => {
  assert.equal(
    resolveImageGenerationEndpoint(
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation/",
    ),
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
  );
});

test("resolveImageGenerationEndpoint keeps a complete MiniMax image_generation endpoint", () => {
  assert.equal(
    resolveImageGenerationEndpoint("https://api.minimaxi.com/v1/image_generation/"),
    "https://api.minimaxi.com/v1/image_generation",
  );
  assert.equal(
    resolveImageGenerationEndpoint("https://api.minimax.io/v1"),
    "https://api.minimax.io/v1/image_generation",
  );
});

test("buildImageGenerationRequestBodies uses Volcengine url response payload", () => {
  const [payload] = buildImageGenerationRequestBodies({
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3/images/generations",
    model: "doubao-seedream-4-5-251128",
    prompt: "测试封面",
    providerType: "volcengine",
  });

  assert.deepEqual(payload, {
    model: "doubao-seedream-4-5-251128",
    prompt: "测试封面",
    response_format: "url",
    size: "2K",
    stream: false,
    watermark: true,
    sequential_image_generation: "disabled",
  });
});

test("buildImageGenerationRequestBodies keeps generic OpenAI-compatible payloads", () => {
  const payloads = buildImageGenerationRequestBodies({
    baseUrl: "https://example.com/v1",
    model: "gpt-image-1",
    prompt: "测试封面",
    providerType: "custom",
  });

  assert.deepEqual(payloads, [
    {
      model: "gpt-image-1",
      prompt: "测试封面",
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    },
    {
      model: "gpt-image-1",
      prompt: "测试封面",
      n: 1,
      size: "1024x1024",
    },
  ]);
});

test("buildImageGenerationRequestBodies uses OpenAI image payload", () => {
  const [payload] = buildImageGenerationRequestBodies({
    baseUrl: "https://api.openai.com/v1/images/generations",
    model: "gpt-image-2",
    prompt: "测试封面",
    providerType: "openai",
  });

  assert.deepEqual(payload, {
    model: "gpt-image-2",
    prompt: "测试封面",
    n: 1,
    size: "1536x1024",
  });
});

test("buildImageGenerationRequestBodies uses OpenRouter image payload", () => {
  const [payload] = buildImageGenerationRequestBodies({
    baseUrl: "https://openrouter.ai/api/v1/images",
    model: "bytedance-seed/seedream-4.5",
    prompt: "测试封面",
    providerType: "openrouter",
  });

  assert.deepEqual(payload, {
    model: "bytedance-seed/seedream-4.5",
    prompt: "测试封面",
    aspect_ratio: "16:9",
    n: 1,
  });
});

test("buildImageGenerationRequestBodies uses DashScope qwen-image payload", () => {
  const [payload] = buildImageGenerationRequestBodies({
    baseUrl: "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
    model: "qwen-image-2.0-pro",
    prompt: "测试封面",
    providerType: "dashscope",
  });

  assert.deepEqual(payload, {
    model: "qwen-image-2.0-pro",
    input: {
      messages: [
        {
          role: "user",
          content: [{ text: "测试封面" }],
        },
      ],
    },
    parameters: {
      n: 1,
      size: "2688*1536",
    },
  });
});

test("buildImageGenerationRequestBodies uses MiniMax image_generation payload", () => {
  const [payload] = buildImageGenerationRequestBodies({
    baseUrl: "https://api.minimaxi.com/v1/image_generation",
    model: "image-01",
    prompt: "测试封面",
    providerType: "minimax",
  });

  assert.deepEqual(payload, {
    model: "image-01",
    prompt: "测试封面",
    aspect_ratio: "16:9",
    response_format: "url",
    n: 1,
    prompt_optimizer: true,
  });
});

test("buildImageGenerationRequestBodies limits MiniMax prompts to official max length", () => {
  const longPrompt = "封面标题与风格要求".repeat(200);
  const [payload] = buildImageGenerationRequestBodies({
    baseUrl: "https://api.minimaxi.com/v1/image_generation",
    model: "image-01",
    prompt: longPrompt,
    providerType: "minimax",
  });

  assert.equal(payload.prompt.length, 1500);
  assert.equal(payload.prompt, longPrompt.slice(0, 1500));
});

test("buildImageGenerationRequestBodies disables MiniMax prompt optimizer in model text mode", () => {
  const [payload] = buildImageGenerationRequestBodies({
    baseUrl: "https://api.minimaxi.com/v1/image_generation",
    model: "image-01",
    prompt: "必须显示标题",
    providerType: "minimax",
    textMode: "model",
  });

  assert.equal(payload.prompt_optimizer, false);
});

test("getUnsupportedImageModelMessage rejects MiniMax text models as image models", () => {
  assert.match(
    getUnsupportedImageModelMessage({ providerType: "minimax", model: "MiniMax-M3" }),
    /MiniMax-M3 是文本 \/ Coding 模型/,
  );
  assert.equal(
    getUnsupportedImageModelMessage({ providerType: "minimax", model: "image-01" }),
    "",
  );
  assert.equal(
    getUnsupportedImageModelMessage({ providerType: "minimax", model: "image-01-live" }),
    "",
  );
});

test("buildImageGenerationRequestBodies uses Zhipu GLM image payload", () => {
  const [payload] = buildImageGenerationRequestBodies({
    baseUrl: "https://open.bigmodel.cn/api/paas/v4/images/generations",
    model: "glm-image",
    prompt: "测试封面",
    providerType: "zhipu",
  });

  assert.deepEqual(payload, {
    model: "glm-image",
    prompt: "测试封面",
    size: "1728x960",
    quality: "hd",
  });
});

test("parseImageGenerationResult supports url and b64_json results", () => {
  assert.equal(
    parseImageGenerationResult({ data: [{ url: "https://example.com/cover.png" }] }),
    "https://example.com/cover.png",
  );
  assert.equal(
    parseImageGenerationResult({ data: [{ b64_json: "abc123" }] }),
    "data:image/png;base64,abc123",
  );
  assert.equal(
    parseImageGenerationResult({ data: { image_urls: ["https://example.com/minimax-cover.png"] } }),
    "https://example.com/minimax-cover.png",
  );
  assert.equal(
    parseImageGenerationResult({
      output: {
        choices: [
          {
            message: {
              content: [{ image: "https://example.com/qwen-cover.png" }],
            },
          },
        ],
      },
    }),
    "https://example.com/qwen-cover.png",
  );
});

test("createImageGenerationErrorMessage preserves concrete provider errors", () => {
  assert.equal(
    createImageGenerationErrorMessage({ error: { message: "invalid api key" } }, 401),
    "真实图片生成失败：invalid api key",
  );
  assert.equal(
    createImageGenerationErrorMessage(
      { base_resp: { status_code: 1008, status_msg: "prompt length exceeds limit" } },
      200,
    ),
    "真实图片生成失败：prompt length exceeds limit",
  );
});

test("remoteImageToDataUrl converts reachable image urls", async () => {
  const fetcher = async () =>
    new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/png" },
    });

  assert.equal(
    await remoteImageToDataUrl("https://example.com/image.png", fetcher),
    "data:image/png;base64,AQID",
  );
});

test("remoteImageToDataUrl fails clearly for inaccessible image urls", async () => {
  const fetcher = async () => new Response("not found", { status: 404 });

  await assert.rejects(
    () => remoteImageToDataUrl("https://example.com/missing.png", fetcher),
    /图片链接不可访问/,
  );
});
