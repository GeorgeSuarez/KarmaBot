import { expect, test } from "bun:test";
import { formatAiResponseLog, logAiResponse, type AiResponseLogEntry } from "../src/ai/logger";

const entry: AiResponseLogEntry = {
  guildId: "guild-1",
  latencyMs: 42,
  model: "test-model",
  question: "What is karma?",
  response: "A record of helpful actions.",
  success: true,
  timestamp: "2026-01-01T00:00:00.000Z",
  trigger: "mention",
  userId: "user-1",
};

test("formats AI response logs as newline-delimited JSON", () => {
  const formatted = formatAiResponseLog(entry);

  expect(formatted.endsWith("\n")).toBe(true);
  expect(JSON.parse(formatted)).toEqual(entry);
});

test("appends multiple AI responses to the JSONL log", async () => {
  const logPath = `/tmp/karmabot-${crypto.randomUUID()}.jsonl`;

  try {
    await logAiResponse(entry, logPath);
    await logAiResponse({ ...entry, response: "Second response." }, logPath);
    const lines = (await Bun.file(logPath).text()).trim().split("\n");

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[1]!).response).toBe("Second response.");
  } finally {
    await Bun.$`rm -f ${logPath}`;
  }
});
