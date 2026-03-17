import { httpGet } from "../../api/http";

export interface FlashEventInfo {
  active: boolean;
  event: {
    id: string;
    title: string;
    multiplier: number;
    startedAt: string;
    expiresAt: string;
    remainingSeconds: number;
  } | null;
}

export async function fetchActiveFlashEvent(): Promise<FlashEventInfo> {
  const res = await httpGet<{ ok: boolean } & FlashEventInfo>("/api/flash-event/active");
  return { active: res.active, event: res.event };
}
