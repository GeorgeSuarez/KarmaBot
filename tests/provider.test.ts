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

  expect(requestUrl).toBe("https://example.test/v1/chat/completions");
  expect(JSON.parse(requestBody)).toMatchObject({ model: "test-model" });
  expect(response).toBe("Answer");
});

test("extracts text from structured message content", async () => {
  const response = await generateResponse(
    config,
    "Question",
    async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: [{ text: "Structured answer" }] } }],
        }),
        { status: 200 },
      ),
  );

  expect(response).toBe("Structured answer");
});

test("extracts text from legacy completion responses", async () => {
  const response = await generateResponse(
    config,
    "Question",
    async () =>
      new Response(JSON.stringify({ choices: [{ text: "Legacy answer" }] }), {
        status: 200,
      }),
  );

  expect(response).toBe("Legacy answer");
});
