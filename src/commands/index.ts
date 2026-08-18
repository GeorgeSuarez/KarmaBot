import { Collection } from "discord.js";
import type { BotCommand } from "../types/command";
import getId from "./utility/get-id";
import ping from "./utility/ping";
import user from "./utility/user";

export const commands = [ping, user, getId] satisfies readonly BotCommand[];

export const commandCollection = new Collection<string, BotCommand>(
  commands.map((command) => [command.data.name, command]),
);
