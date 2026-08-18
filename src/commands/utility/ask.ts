import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { claimCooldown } from "../../ai/cooldown";
import { generateResponse } from "../../ai/provider";
import { getAiConfig } from "../../config";
import type { BotCommand } from "../../types/command";

const ask: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask KarmaBot a question.")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("The question you want KarmaBot to answer.")
        .setMaxLength(2000)
        .setRequired(true),
    ),
  async execute(interaction) {
    const waitMs = claimCooldown(interaction.user.id);
    if (waitMs > 0) {
      await interaction.reply({
        content: `Please wait ${Math.ceil(waitMs / 1000)} seconds before asking again.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const question = interaction.options.getString("question", true).trim();

    await interaction.deferReply();
    const response = await generateResponse(getAiConfig(), question);

    await interaction.editReply({
      allowedMentions: { parse: [] },
      content: response,
    });
  },
};

export default ask;
