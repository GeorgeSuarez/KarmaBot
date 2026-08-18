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
