import assert from "node:assert/strict";
import test from "node:test";

import {
  buildImageGenerationRequestBodies,
  createImageGenerationErrorMessage,
  parseImageGenerationResult,
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
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-image-1",
    prompt: "测试封面",
    providerType: "openai",
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

test("parseImageGenerationResult supports url and b64_json results", () => {
  assert.equal(
    parseImageGenerationResult({ data: [{ url: "https://example.com/cover.png" }] }),
    "https://example.com/cover.png",
  );
  assert.equal(
    parseImageGenerationResult({ data: [{ b64_json: "abc123" }] }),
    "data:image/png;base64,abc123",
  );
});

test("createImageGenerationErrorMessage preserves concrete provider errors", () => {
  assert.equal(
    createImageGenerationErrorMessage({ error: { message: "invalid api key" } }, 401),
    "真实图片生成失败：invalid api key",
  );
});
