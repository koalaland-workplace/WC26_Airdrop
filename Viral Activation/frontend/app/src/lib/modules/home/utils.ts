const WC26_KICKOFF_UTC = "2026-06-11T00:00:00Z";

export function formatFans(value: number): string {
  return Math.max(0, Math.floor(value)).toLocaleString("en-US");
}

export function formatKick(value: number): string {
  return Math.max(0, Math.floor(value)).toLocaleString("en-US");
}

export function daysUntilKickoff(now = new Date()): number {
  const kickoffMs = Date.parse(WC26_KICKOFF_UTC);
  const nowMs = now.getTime();
  const diff = kickoffMs - nowMs;
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}
