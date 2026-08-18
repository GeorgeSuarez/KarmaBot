import type { AiConfig } from "../config";

export const MAX_RESPONSE_CHARS = 1000;
const REQUEST_TIMEOUT_MS = 15_000;

type JsonPrimitive = boolean | null | number | string;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

interface JsonObject {
  readonly [key: string]: JsonValue | undefined;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return value !== undefined && value !== null && !Array.isArray(value) && Object(value) === value;
}

function isJsonString(value: JsonValue | undefined): value is string {
  return Object.prototype.toString.call(value) === "[object String]";
}

function extractText(value: JsonValue | undefined): string {
  if (isJsonString(value)) return value.trim();

  if (Array.isArray(value)) {
    const text = value
      .map((part) => {
        if (isJsonString(part)) return part;
        return isJsonObject(part) && isJsonString(part.text) ? part.text : "";
      })
      .join("")
      .trim();

    if (text) return text;
  }

  throw new Error("AI provider returned no text content");
}

function extractContent(payload: JsonValue): string {
  if (!isJsonObject(payload) || !Array.isArray(payload.choices)) {
    throw new Error("AI provider returned an invalid response");
  }

  const firstChoice = payload.choices[0];
  if (!isJsonObject(firstChoice)) {
    throw new Error("AI provider returned an invalid choice");
  }

  if ("text" in firstChoice) {
    return extractText(firstChoice.text);
  }

  if (!isJsonObject(firstChoice.message)) {
    const keys = Object.keys(firstChoice).join(", ") || "none";
    throw new Error(`AI provider returned no message (choice keys: ${keys})`);
  }

  return extractText(firstChoice.message.content);
}

function parseJson(text: string): JsonValue {
  return JSON.parse(text);
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

  return limitResponse(extractContent(parseJson(await response.text())));
}
