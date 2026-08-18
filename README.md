# KarmaBot

KarmaBot is a small Discord utility bot built with TypeScript, discord.js, and
Bun 1.3.8.

The current release provides these guild-only slash commands:

- `/ping` replies with `Pong!`.
- `/user` displays username, display name, Discord ID, account creation date,
  and server join date.
- `/get_id` displays the invoking user's ID or an optional member's ID.

Successful responses are public. Validation and execution errors are private.
The bot uses only the `Guilds` gateway intent and should be installed with the
minimum permissions needed to respond to slash commands.

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
5. Smoke-test `/ping`, `/user`, and `/get_id` in staging.
6. Run the host-side production deployment command.
7. Start the long-running bot process with host-managed environment variables.

If production needs to be rolled back, redeploy the previous known-good commit
using the same host-side command.
