import type { EarnTaskTone } from "./types";

const CLAIMED_TASK_KEY = "wc26_earn_claimed_v1";
const CLAIMED_KICK_KEY = "wc26_earn_claimed_kick_v1";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function readClaimedTaskIds(): string[] {
  const db = storage();
  if (!db) return [];
  const raw = db.getItem(CLAIMED_TASK_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function writeClaimedTaskIds(ids: string[]): void {
  const db = storage();
  if (!db) return;
  db.setItem(CLAIMED_TASK_KEY, JSON.stringify(ids));
}

export function readClaimedKick(): number {
  const db = storage();
  if (!db) return 0;
  const raw = db.getItem(CLAIMED_KICK_KEY);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

export function writeClaimedKick(value: number): void {
  const db = storage();
  if (!db) return;
  db.setItem(CLAIMED_KICK_KEY, String(Math.max(0, Math.floor(value))));
}

export function toneButtonClass(tone: EarnTaskTone): string {
  if (tone === "y") return "tby";
  if (tone === "b") return "tbb";
  if (tone === "r") return "tbr";
  return "tbg";
}
