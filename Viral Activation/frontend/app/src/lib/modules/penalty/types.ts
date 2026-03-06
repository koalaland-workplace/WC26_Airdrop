export type PenaltyMode = "solo" | "pvp";
export type PenaltyActor = "me" | "opp";
export type PenaltyResult = "win" | "loss" | "draw";

export interface PenaltyDailyState {
  day: string;
  soloPlays: number;
  soloFreeLeft: number;
  soloShotRateNow: number;
}

export interface PenaltyEconomy {
  kick: number;
  dailyEarned: number;
}

export interface PenaltyDailyResponse {
  ok: boolean;
  penalty: PenaltyDailyState;
  economy: PenaltyEconomy;
}

export interface PenaltyStartRequest {
  sessionId: string;
  mode: PenaltyMode;
}

export interface PenaltyStartMatch {
  matchId: string;
  mode: PenaltyMode;
  meFirst: boolean;
  suddenActive: boolean;
  meScore: number;
  oppScore: number;
  myIdx: number;
  oppIdx: number;
  soloShotRateNow: number;
}

export interface PenaltyStartResponse {
  ok: boolean;
  match: PenaltyStartMatch;
  entryFeeApplied: number;
  penalty: PenaltyDailyState;
  economy: PenaltyEconomy;
}

export interface PenaltyShotRequest {
  sessionId: string;
  matchId: string;
  actor: PenaltyActor;
  onTarget?: boolean;
  keeperCovered?: boolean;
  auto?: boolean;
}

export interface PenaltyShotState {
  actor: PenaltyActor;
  scored: boolean;
  done: boolean;
  suddenActive: boolean;
  meScore: number;
  oppScore: number;
  myIdx: number;
  oppIdx: number;
  mySeq: boolean[];
  oppSeq: boolean[];
}

export interface PenaltyShotResponse {
  ok: boolean;
  shot: PenaltyShotState;
}

export interface PenaltyFinalizeRequest {
  sessionId: string;
  matchId: string;
}

export interface PenaltyFinalizeResponse {
  ok: boolean;
  result: PenaltyResult;
  deltaApplied: number;
  final: {
    meScore: number;
    oppScore: number;
    mode: PenaltyMode;
  };
  penalty: PenaltyDailyState;
  economy: PenaltyEconomy;
}
