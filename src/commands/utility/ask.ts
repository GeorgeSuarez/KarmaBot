import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { claimCooldown } from "../../ai/cooldown";
import { generateResponse } from "../../ai/provider";
import { safelyLogAiResponse } from "../../ai/logger";
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
    const startedAt = Date.now();
    let model = "unknown";
    let response: string;

    try {
      const aiConfig = getAiConfig();
      model = aiConfig.model;
      response = await generateResponse(aiConfig, question);
    } catch (error) {
      await safelyLogAiResponse({
        error: error instanceof Error ? error.message : String(error),
        guildId: interaction.guildId ?? "unknown",
        latencyMs: Date.now() - startedAt,
        model,
        question,
        success: false,
        timestamp: new Date().toISOString(),
        trigger: "slash",
        userId: interaction.user.id,
      });
      throw error;
    }

    await safelyLogAiResponse({
      guildId: interaction.guildId ?? "unknown",
      latencyMs: Date.now() - startedAt,
      model,
      question,
      response,
      success: true,
      timestamp: new Date().toISOString(),
      trigger: "slash",
      userId: interaction.user.id,
    });

    await interaction.editReply({
      allowedMentions: { parse: [] },
      content: response,
    });
  },
};

export default ask;
