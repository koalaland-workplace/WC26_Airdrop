import type { HotSignal, HotSignalImpact } from "./types";

export interface HotSignalImpactMeta {
  level: "high" | "medium" | "low";
  icon: string;
  label: string;
}

export function impactMeta(level: HotSignalImpact): HotSignalImpactMeta {
  if (level === "HIGH") return { level: "high", icon: "🚨", label: "High" };
  if (level === "MEDIUM") return { level: "medium", icon: "🟨", label: "Medium" };
  return { level: "low", icon: "🟢", label: "Low" };
}

export function timeAgo(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return "unknown";
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  return `${Math.floor(diffSec / 86400)}d`;
}

export function updatedLabel(iso: string | null): string {
  if (!iso) return "Latest football signals and updates.";
  return `Updated ${timeAgo(iso)} ago`;
}

export function safeSignals(items: HotSignal[]): HotSignal[] {
  return Array.isArray(items) ? items.slice(0, 5) : [];
}
