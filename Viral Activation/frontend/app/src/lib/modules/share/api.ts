import { httpPost } from "../../api/http";

export interface ShareVerifyResponse {
  ok: boolean;
  reason?: string;
  kickAwarded?: number;
  bonusSpin?: boolean;
  share?: { count: number; remaining: number };
  economy?: { kick: number; dailyEarned: number };
  spin?: { day: string; used: number; invite: number; share: number; tickets: number; cap: number; left: number };
}

export function verifyShare(sessionId: string, type: "story" | "quiz_result" | "penalty_win"): Promise<ShareVerifyResponse> {
  return httpPost<ShareVerifyResponse>("/api/share/verify", { sessionId, type });
}
