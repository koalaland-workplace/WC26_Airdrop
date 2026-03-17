import { httpPost } from "../../api/http";

export interface OnboardingCompleteResponse {
  ok: boolean;
  alreadyOnboarded: boolean;
  kickAwarded?: number;
  economy?: { kick: number; dailyEarned: number };
}

export function completeOnboarding(sessionId: string): Promise<OnboardingCompleteResponse> {
  return httpPost<OnboardingCompleteResponse>("/api/onboarding/complete", { sessionId });
}
