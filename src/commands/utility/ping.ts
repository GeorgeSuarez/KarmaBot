import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../types/command";

const ping: BotCommand = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Replies with pong."),
  async execute(interaction) {
    await interaction.reply("Pong!");
  },
};

export default ping;
