import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../types/command";

const getId: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("get_id")
    .setDescription("Get a Discord user ID.")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("The member whose ID you want to view.")
        .setRequired(false),
    ),
  async execute(interaction) {
    const member = interaction.options.getUser("member") ?? interaction.user;

    await interaction.reply(`${member.username}'s Discord ID is \`${member.id}\`.`);
  },
};

export default getId;
