import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../types/command";

const user: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Provides information about the user."),
  async execute(interaction) {
    const member = interaction.member;
    const displayName =
      member && "displayName" in member
        ? member.displayName
        : member && "nick" in member && member.nick
          ? member.nick
          : (interaction.user.globalName ?? interaction.user.username);
    const joinedAt =
      member && "joinedAt" in member
        ? member.joinedAt
        : member && "joined_at" in member && member.joined_at
          ? new Date(member.joined_at)
          : null;

    await interaction.reply(
      [
        "**User profile**",
        `- Username: ${interaction.user.username}`,
        `- Display name: ${displayName}`,
        `- User ID: \`${interaction.user.id}\``,
        `- Account created: ${interaction.user.createdAt.toISOString()}`,
        `- Joined server: ${joinedAt ? joinedAt.toISOString() : "unknown"}`,
      ].join("\n"),
    );
  },
};

export default user;
