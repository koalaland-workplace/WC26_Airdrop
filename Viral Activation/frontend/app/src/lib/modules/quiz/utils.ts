import type { QuizDifficulty } from "./types";

interface QuizDifficultyMeta {
  badge: string;
  className: "de" | "dm" | "dh";
}

const QUIZ_DIFFICULTY_META: Record<QuizDifficulty, QuizDifficultyMeta> = {
  easy: { badge: "🟢 EASY", className: "de" },
  medium: { badge: "🟡 MEDIUM", className: "dm" },
  hard: { badge: "🔴 HARD", className: "dh" }
};

export function difficultyMeta(diff: QuizDifficulty): QuizDifficultyMeta {
  return QUIZ_DIFFICULTY_META[diff];
}

export function optionLetter(index: number): string {
  const base = "A".charCodeAt(0);
  return String.fromCharCode(base + index);
}

export function formatQuizDayLabel(day: string): string {
  const fallback = "Daily Quiz";
  if (!day) return fallback;

  const iso = new Date(`${day}T00:00:00`);
  if (Number.isNaN(iso.getTime())) return fallback;

  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(iso);

  return `${label} · Phase 1`;
}

export function clampTimer(value: number): number {
  return Math.max(0, Math.min(60, Math.floor(Number(value) || 0)));
}
