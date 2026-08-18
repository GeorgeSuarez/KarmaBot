import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { commandCollection } from "./commands";
import { getBotConfig } from "./config";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(
    `Ready! Logged in as ${readyClient.user.tag} with ${commandCollection.size} commands.`,
  );
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const command = commandCollection.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    await interaction.reply({
      content: "This command is not available.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Command failed: ${interaction.commandName}`, error);

    try {
      const response = {
        content: "There was an error while executing this command.",
        flags: MessageFlags.Ephemeral as const,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(response);
      } else {
        await interaction.reply(response);
      }
    } catch (responseError) {
      console.error("Failed to send command error response", responseError);
    }
  }
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}; shutting down.`);
  client.destroy();
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

const { token } = getBotConfig();

client.login(token).catch((error: unknown) => {
  console.error("Failed to log in to Discord", error);
  process.exitCode = 1;
});
