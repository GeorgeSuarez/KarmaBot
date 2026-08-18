# KarmaBot

KarmaBot is a small Discord utility bot built with TypeScript, discord.js, and
Bun 1.3.8.

The current release provides these guild-only slash commands:

- `/ping` replies with `Pong!`.
- `/user` displays username, display name, Discord ID, account creation date,
  and server join date.
- `/get_id` displays the invoking user's ID or an optional member's ID.
- `/ask <question>` returns an AI-generated response with a 1,000-character limit.
- Mentioning the bot followed by a question also requests an AI response.

Successful responses are public. Validation and execution errors are private.
The bot uses guild message and message-content intents for mention-triggered
questions. Enable the Message Content privileged intent in the Discord Developer
Portal.

## Requirements

- Bun 1.3.8
- A Discord application and bot token
- One staging Discord guild
- One production Discord guild

The staging and production guilds use the same Discord application. Commands
are registered independently in each guild.

## Configuration

Copy `.env.example` to `.env.local` and fill in the values:

```text
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_STAGING_GUILD_ID=
DISCORD_PRODUCTION_GUILD_ID=
DISCORD_MENTION_ALLOWLIST=123456789012345678,234567890123456789
AI_RESPONSE_LOG_PATH=logs/ai-responses.jsonl
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=
AI_SYSTEM_PROMPT=You are KarmaBot, a helpful and concise Discord community assistant.
```

Never commit `.env.local` or any Discord token. If a token has been exposed,
rotate it in the Discord Developer Portal before continuing.

## Local Development

Install dependencies:

```bash
bun install --frozen-lockfile
```

Run the bot locally:

```bash
bun run start
```

Register commands in the staging guild:

```bash
bun run deploy:staging
```

Register commands in the production guild:

```bash
bun run deploy:production
```

Both deployment commands fully replace the command set in their target guild.
They do not register global commands.

## AI Questions

KarmaBot sends questions to an OpenAI-compatible chat-completions endpoint.
The default endpoint is `https://api.openai.com/v1`; set `AI_BASE_URL` when
using another compatible provider or proxy.

The bot accepts questions through `/ask question` or a message that mentions
the bot. Responses are capped at 1,000 characters, questions are capped at
2,000 characters, and requests time out after 15 seconds. Generated responses
cannot create Discord mentions.

The AI API key is read from `AI_API_KEY` and must be configured as a host
environment variable. AI questions and responses are persisted in the configured
JSONL log file.

## Mention Whitelist

Mention-triggered AI questions are deny-by-default. Set `DISCORD_MENTION_ALLOWLIST`
to a comma-separated list of Discord user IDs. Users not in the list are
ignored without a response. An empty value disables mention-triggered questions
for everyone. The `/ask` slash command is not affected by this whitelist.

Use `/get_id` to find a Discord user ID, then restart the bot after changing the
allowlist. Do not use usernames or display names because they can change.

## AI Response Logs

Every AI request is recorded as one JSON object per line. Successful entries
include the timestamp, trigger, user ID, guild ID, model, question, response,
and latency. Failed requests include the question and error instead of a
response.

Logs default to `<project>/logs/ai-responses.jsonl`. Set `AI_RESPONSE_LOG_PATH`
to a relative path such as `logs/archive.jsonl` to use another location inside the
project. Absolute paths such as `/var/log/...` are ignored. The `logs/` directory is ignored by git. Because logs
contain user questions and generated responses, protect the file and apply a
retention policy appropriate for your server. Logging failures are reported to
stderr and do not prevent the bot from replying.

## Quality Checks

Run the complete local gate before deployment:

```bash
bun run check
```

Individual commands are available as well:

```bash
bun run typecheck
bun run lint
bun run format
bun run format:check
bun test
```

Oxlint and Oxfmt are enforced by GitHub Actions on pull requests and pushes to
`main`. The production workflow is manually triggered with a selected commit
from `main` and validates the checks plus the Docker image build. It does not
deploy to a host.

## Docker

Build the production image:

```bash
docker build --tag karmabot:local .
```

Run the bot process with host-provided environment variables:

```bash
docker run --rm --env-file .env.local karmabot:local
```

The image also includes the command deployment entry points. A host-side
promotion can run the container with an override command:

```bash
docker run --rm --env-file .env.local karmabot:local bun run deploy:staging
docker run --rm --env-file .env.local karmabot:local bun run deploy:production
```

The bot runtime and command deployment are separate processes by design.

## Release Process

1. Open a pull request and wait for the required GitHub Actions checks.
2. Merge the verified change into `main`.
3. Build and run the image locally or through the manual production-build
   workflow using the selected `main` commit.
4. Deploy the selected change to the staging guild.
5. Smoke-test `/ping`, `/user`, `/get_id`, `/ask`, and mention responses in staging.
6. Run the host-side production deployment command.
7. Start the long-running bot process with host-managed environment variables.

If production needs to be rolled back, redeploy the previous known-good commit
using the same host-side command.
