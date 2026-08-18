import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { claimCooldown } from "./ai/cooldown";
import { generateResponse } from "./ai/provider";
import { commandCollection } from "./commands";
import { getAiConfig, getBotConfig } from "./config";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guildId) return;

  const botUser = client.user;
  if (!botUser || !message.mentions.has(botUser)) return;

  const question = message.content.replace(new RegExp(`<@!?${botUser.id}>`, "g"), "").trim();

  if (!question) {
    await message.reply({
      content: "Mention me with a question and I will try to answer it.",
      allowedMentions: { parse: [], repliedUser: false },
    });
    return;
  }

  if (question.length > 2000) {
    await message.reply({
      content: "Please keep questions under 2,000 characters.",
      allowedMentions: { parse: [], repliedUser: false },
    });
    return;
  }

  const waitMs = claimCooldown(message.author.id);
  if (waitMs > 0) {
    await message.reply({
      content: `Please wait ${Math.ceil(waitMs / 1000)} seconds before asking again.`,
      allowedMentions: { parse: [], repliedUser: false },
    });
    return;
  }

  try {
    await message.channel.sendTyping();
    const response = await generateResponse(getAiConfig(), question);
    await message.reply({
      allowedMentions: { parse: [], repliedUser: false },
      content: response,
    });
  } catch (error) {
    console.error("AI message response failed", error);
    await message
      .reply({
        content: "I could not answer that right now. Please try again later.",
        allowedMentions: { parse: [], repliedUser: false },
      })
      .catch((replyError: unknown) =>
        console.error("Failed to send AI error response", replyError),
      );
  }
});
