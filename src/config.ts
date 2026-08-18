export type DeploymentTarget = "staging" | "production";

function requiredEnvironmentVariable(name: string): string {
  const value = Bun.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getBotConfig(): { token: string } {
  return { token: requiredEnvironmentVariable("DISCORD_TOKEN") };
}

export function getDeploymentConfig(target: DeploymentTarget): {
  clientId: string;
  guildId: string;
  token: string;
} {
  const guildVariable =
    target === "staging" ? "DISCORD_STAGING_GUILD_ID" : "DISCORD_PRODUCTION_GUILD_ID";

  return {
    clientId: requiredEnvironmentVariable("DISCORD_CLIENT_ID"),
    guildId: requiredEnvironmentVariable(guildVariable),
    token: requiredEnvironmentVariable("DISCORD_TOKEN"),
  };
}

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
}

export function getAiConfig(): AiConfig {
  return {
    apiKey: requiredEnvironmentVariable("AI_API_KEY"),
    baseUrl: Bun.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1",
    model: requiredEnvironmentVariable("AI_MODEL"),
    systemPrompt:
      Bun.env.AI_SYSTEM_PROMPT?.trim() ||
      "You are KarmaBot, a helpful and concise Discord community assistant.",
  };
}
