import type {
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  User,
} from "discord.js";

export type CommandUser = Pick<User, "createdAt" | "globalName" | "id" | "username">;

export type CommandMember =
  | { displayName: string; joinedAt: Date | null }
  | { joined_at: string | null; nick?: string | null }
  | null;

export interface CommandOptions {
  getString(name: string, required: true): string;
  getString(name: string, required?: false): string | null;
  getUser(name: string, required?: boolean): CommandUser | null;
}

type CommandEffect = void | object;
export type CommandReply = string | InteractionReplyOptions;
type CommandEditReply = string | InteractionEditReplyOptions;

export interface CommandInteraction {
  deferReply(): PromiseLike<CommandEffect>;
  editReply(response: CommandEditReply): PromiseLike<CommandEffect>;
  guildId: string | null;
  member: CommandMember;
  options: CommandOptions;
  reply(response: CommandReply): PromiseLike<CommandEffect>;
  user: CommandUser;
}

export interface BotCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: CommandInteraction) => Promise<void>;
}
