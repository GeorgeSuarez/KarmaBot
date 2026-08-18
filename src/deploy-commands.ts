import { REST, Routes } from "discord.js";
import { getDeploymentConfig, type DeploymentTarget } from "./config";
import { commands } from "./commands";

function getTarget(): DeploymentTarget {
  const target = process.argv[2];

  if (target !== "staging" && target !== "production") {
    throw new Error("Usage: bun src/deploy-commands.ts <staging|production>");
  }

  return target;
}

async function deployCommands(target: DeploymentTarget): Promise<void> {
  const { clientId, guildId, token } = getDeploymentConfig(target);
  const rest = new REST().setToken(token);
  const body = commands.map((command) => command.data.toJSON());

  console.log(`Refreshing ${body.length} commands in ${target} guild.`);

  const deployedCommands = (await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body,
  })) as unknown[];

  console.log(`Successfully deployed ${deployedCommands.length} commands to ${target} guild.`);
}

async function main(): Promise<void> {
  await deployCommands(getTarget());
}

main().catch((error: unknown) => {
  console.error("Failed to deploy commands", error);
  process.exitCode = 1;
});
