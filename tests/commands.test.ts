import { expect, test } from "bun:test";
import type { ChatInputCommandInteraction, User } from "discord.js";
import { commands } from "../src/commands";

test("registers the supported utility commands", () => {
  expect(commands.map((command) => command.data.name)).toEqual(["ping", "user", "get_id", "ask"]);
});

test("get_id defaults to the invoking user", async () => {
  const replies: unknown[] = [];
  const invokingUser = {
    id: "123",
    username: "Ada",
  } as User;
  const interaction = {
    options: { getUser: () => null },
    reply: async (response: unknown) => replies.push(response),
    user: invokingUser,
  } as unknown as ChatInputCommandInteraction;
  const getIdCommand = commands.find((command) => command.data.name === "get_id");

  await getIdCommand?.execute(interaction);

  expect(replies).toEqual(["Ada's Discord ID is `123`."]);
});

test("ping replies with pong", async () => {
  const replies: unknown[] = [];
  const interaction = {
    reply: async (response: unknown) => replies.push(response),
  } as unknown as ChatInputCommandInteraction;
  const pingCommand = commands.find((command) => command.data.name === "ping");

  await pingCommand?.execute(interaction);

  expect(replies).toEqual(["Pong!"]);
});

test("user returns the administrative profile", async () => {
  const replies: unknown[] = [];
  const interaction = {
    member: {
      displayName: "Ada Lovelace",
      joinedAt: new Date("2025-01-02T03:04:05.000Z"),
    },
    reply: async (response: unknown) => replies.push(response),
    user: {
      createdAt: new Date("2024-01-02T03:04:05.000Z"),
      globalName: "Ada Lovelace",
      id: "123",
      username: "ada",
    },
  } as unknown as ChatInputCommandInteraction;
  const userCommand = commands.find((command) => command.data.name === "user");

  await userCommand?.execute(interaction);

  expect(replies).toEqual([
    [
      "**User profile**",
      "- Username: ada",
      "- Display name: Ada Lovelace",
      "- User ID: `123`",
      "- Account created: 2024-01-02T03:04:05.000Z",
      "- Joined server: 2025-01-02T03:04:05.000Z",
    ].join("\n"),
  ]);
});
