import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
const PROJECT_ROOT = path.resolve(import.meta.dir, "../..");
const DEFAULT_LOG_PATH = path.join(PROJECT_ROOT, "logs", "ai-responses.jsonl");

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

export function getAiResponseLogPath(configuredPath = Bun.env.AI_RESPONSE_LOG_PATH): string {
  const requestedPath = configuredPath?.trim();
  if (!requestedPath || path.isAbsolute(requestedPath)) return DEFAULT_LOG_PATH;

  const resolvedPath = path.resolve(PROJECT_ROOT, requestedPath);
  return resolvedPath.startsWith(`${PROJECT_ROOT}${path.sep}`) ? resolvedPath : DEFAULT_LOG_PATH;
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
