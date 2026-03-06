const SESSION_ID_STORAGE_KEY = "wc26_session_id_v1";
const KICK_PROGRESS_TARGET = 50_000;

function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getStoredSessionId(): string | null {
  const storage = safeLocalStorage();
  if (!storage) return null;
  const sessionId = storage.getItem(SESSION_ID_STORAGE_KEY);
  if (!sessionId) return null;
  const trimmed = sessionId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function storeSessionId(sessionId: string): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  const trimmed = sessionId.trim();
  if (trimmed.length > 0) storage.setItem(SESSION_ID_STORAGE_KEY, trimmed);
}

export function clearStoredSessionId(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  storage.removeItem(SESSION_ID_STORAGE_KEY);
}

export function resolveTierLabel(kick: number): string {
  if (kick >= 80_000) return "Legend Fan";
  if (kick >= 20_000) return "Elite Fan";
  if (kick >= 8_000) return "Core Fan";
  return "Rookie Fan";
}

export function resolveRankLine(kick: number): string {
  const baselineKick = 24_350;
  const baselineNationRank = 132;
  const baselineGlobalRank = 5_342;
  const delta = Math.floor((kick - baselineKick) / 275);

  const nationRank = Math.max(1, baselineNationRank - delta);
  const globalRank = Math.max(1, baselineGlobalRank - delta * 18);

  return `🇧🇷 Brazil #${nationRank.toLocaleString("en-US")} | Global #${globalRank.toLocaleString("en-US")}`;
}

export function resolveKickRingPct(kick: number): number {
  const pct = Math.floor((kick / KICK_PROGRESS_TARGET) * 100);
  return Math.max(0, Math.min(100, pct));
}
