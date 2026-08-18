import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type AiResponseTrigger = "mention" | "slash";

export interface AiResponseLogEntry {
  error?: string;
  guildId: string;
  latencyMs: number;
  model: string;
  question: string;
  response?: string;
  success: boolean;
  timestamp: string;
  trigger: AiResponseTrigger;
  userId: string;
}

export function getAiResponseLogPath(): string {
  return Bun.env.AI_RESPONSE_LOG_PATH?.trim() || "logs/ai-responses.jsonl";
}

export function formatAiResponseLog(entry: AiResponseLogEntry): string {
  return `${JSON.stringify(entry)}\n`;
}

export async function logAiResponse(
  entry: AiResponseLogEntry,
  logPath = getAiResponseLogPath(),
): Promise<void> {
  await mkdir(path.dirname(logPath), { recursive: true });
  // Bun.file().writer() truncates existing files, so appendFile preserves JSONL history.
  await appendFile(logPath, formatAiResponseLog(entry), "utf8");
}

export async function safelyLogAiResponse(entry: AiResponseLogEntry): Promise<void> {
  try {
    await logAiResponse(entry);
  } catch (error) {
    console.error("Failed to write AI response log", error);
  }
}
