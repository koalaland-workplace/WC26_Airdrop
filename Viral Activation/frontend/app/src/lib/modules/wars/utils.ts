import { NATION_STATS } from "./data";
import type { NationRankItem } from "./types";

const SELECTED_NATION_KEY = "wc26_selected_nation_v1";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function computeWarPoints(): NationRankItem[] {
  return NATION_STATS.map((nation) => ({
    ...nation,
    warPoint: nation.eligibleUsers > 0 ? nation.totalKick / nation.eligibleUsers : 0
  })).sort((a, b) => b.warPoint - a.warPoint);
}

export function formatWarPoint(point: number): string {
  return Math.round(point).toLocaleString("en-US");
}

export function formatKickCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toLocaleString("en-US");
}

export function getStoredNationCode(): string {
  const db = storage();
  if (!db) return "BR";

  const code = db.getItem(SELECTED_NATION_KEY);
  if (!code) return "BR";

  const normalized = code.trim().toUpperCase();
  if (NATION_STATS.some((nation) => nation.code === normalized)) {
    return normalized;
  }

  return "BR";
}

export function setStoredNationCode(code: string): void {
  const db = storage();
  if (!db) return;
  db.setItem(SELECTED_NATION_KEY, code.toUpperCase());
}
