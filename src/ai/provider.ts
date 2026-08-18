import type { AiConfig } from "../config";

export const MAX_RESPONSE_CHARS = 1000;
const REQUEST_TIMEOUT_MS = 15_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractContent(payload: unknown): string {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    throw new Error("AI provider returned an invalid response");
  }

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error("AI provider returned no message");
  }

  const content = firstChoice.message.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI provider returned an empty response");
  }

  return content.trim();
}

export function limitResponse(text: string): string {
  if (text.length <= MAX_RESPONSE_CHARS) return text;

  return `${text.slice(0, MAX_RESPONSE_CHARS - 1).trimEnd()}…`;
}

export async function generateResponse(
  config: AiConfig,
  question: string,
  fetchImpl: (input: string | URL | Request, init?: RequestInit) => Promise<Response> = fetch,
): Promise<string> {
  const response = await fetchImpl(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      max_tokens: 400,
      messages: [
        { content: config.systemPrompt, role: "system" },
        { content: question, role: "user" },
      ],
      model: config.model,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`AI provider returned HTTP ${response.status}`);
  }

  return limitResponse(extractContent(await response.json()));
}
