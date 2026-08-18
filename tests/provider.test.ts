import { expect, test } from "bun:test";
import type { AiConfig } from "../src/config";
import { generateResponse, limitResponse, MAX_RESPONSE_CHARS } from "../src/ai/provider";

const config: AiConfig = {
  apiKey: "test-key",
  baseUrl: "https://example.test/v1/",
  model: "test-model",
  systemPrompt: "Be concise.",
};

test("limits AI responses to the configured character count", () => {
  const response = limitResponse("a".repeat(MAX_RESPONSE_CHARS + 1));

  expect(response).toHaveLength(MAX_RESPONSE_CHARS);
  expect(response.endsWith("…")).toBe(true);
});

test("sends a chat completion request to the compatible endpoint", async () => {
  let requestUrl = "";
  let requestBody = "";
  const fakeFetch = async (input: string | URL | Request, init?: RequestInit) => {
    requestUrl = String(input);
    requestBody = String(init?.body);
    return new Response(JSON.stringify({ choices: [{ message: { content: "Answer" } }] }), {
      status: 200,
    });
  };

  const response = await generateResponse(config, "Question", fakeFetch);
  const body = JSON.parse(requestBody) as { model: string };

  expect(requestUrl).toBe("https://example.test/v1/chat/completions");
  expect(body.model).toBe("test-model");
  expect(response).toBe("Answer");
});
