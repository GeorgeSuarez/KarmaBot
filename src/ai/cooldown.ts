const COOLDOWN_MS = 10_000;
const cooldowns = new Map<string, number>();

export function claimCooldown(userId: string, now = Date.now()): number {
  const nextAllowedAt = cooldowns.get(userId) ?? 0;

  if (nextAllowedAt > now) {
    return nextAllowedAt - now;
  }

  cooldowns.set(userId, now + COOLDOWN_MS);
  return 0;
}
