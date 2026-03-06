export type EarnTaskTone = "g" | "y" | "b" | "r";

export interface EarnTaskCategory {
  id: string;
  icon: string;
  title: string;
  totalLabel: string;
  tone: EarnTaskTone;
}

export interface EarnTask {
  id: string;
  categoryId: string;
  icon: string;
  name: string;
  description: string;
  points: number;
  actionLabel: string;
  tone: EarnTaskTone;
}

export interface EarnClaimResult {
  taskId: string;
  appliedKick: number;
  message: string;
}

export interface EarnStatePayload {
  taskCap: number;
  claimedKick: number;
  claimedTaskIds: string[];
}

export interface EarnStateResponse {
  ok: boolean;
  earn: EarnStatePayload;
  economy: {
    kick: number;
    dailyEarned: number;
  };
}

export interface EarnClaimRequest {
  sessionId: string;
  taskId: string;
  points: number;
}

export interface EarnClaimResponse {
  ok: boolean;
  taskId: string;
  alreadyClaimed: boolean;
  appliedKick: number;
  earn: EarnStatePayload;
  economy: {
    kick: number;
    dailyEarned: number;
  };
}
