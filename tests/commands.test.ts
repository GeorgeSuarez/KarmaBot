import { expect, test } from "bun:test";
import { commands } from "../src/commands";
import type { CommandInteraction, CommandReply } from "../src/types/command";

interface TestInteraction {
  interaction: CommandInteraction;
  replies: CommandReply[];
}

function createInteraction(): TestInteraction {
  const replies: CommandReply[] = [];
  const interaction: CommandInteraction = {
    deferReply: async () => {},
    editReply: async () => {},
    guildId: "test-guild",
    member: null,
    options: {
      getString: (_name: string, _required?: boolean) => "",
      getUser: () => null,
    },
    reply: async (response) => {
      replies.push(response);
    },
    user: {
      createdAt: new Date("2024-01-02T03:04:05.000Z"),
      globalName: "Ada Lovelace",
      id: "123",
      username: "ada",
    },
  };

  return { interaction, replies };
}

test("registers the supported utility commands", () => {
  expect(commands.map((command) => command.data.name)).toEqual(["ping", "user", "get_id", "ask"]);
});

test("get_id defaults to the invoking user", async () => {
  const { interaction, replies } = createInteraction();
  interaction.user = { ...interaction.user, username: "Ada" };
  const getIdCommand = commands.find((command) => command.data.name === "get_id");

  await getIdCommand?.execute(interaction);

  expect(replies).toEqual(["Ada's Discord ID is `123`."]);
});

test("ping replies with pong", async () => {
  const { interaction, replies } = createInteraction();
  const pingCommand = commands.find((command) => command.data.name === "ping");

  await pingCommand?.execute(interaction);

  expect(replies).toEqual(["Pong!"]);
});

test("user returns the administrative profile", async () => {
  const { interaction, replies } = createInteraction();
  interaction.member = {
    displayName: "Ada Lovelace",
    joinedAt: new Date("2025-01-02T03:04:05.000Z"),
  };
  interaction.user = {
    createdAt: new Date("2024-01-02T03:04:05.000Z"),
    globalName: "Ada Lovelace",
    id: "123",
    username: "ada",
  };
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
