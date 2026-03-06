export interface ReferralState {
  boostMult: number;
  f1Registered: number;
  f1Active7: number;
  f2Registered: number;
  f2Active7: number;
}

export interface ReferralStateResponse {
  ok: boolean;
  referral: ReferralState;
}

export interface ReferralBoostRequest {
  sessionId: string;
  mult?: number;
}

export interface ReferralBoostResponse {
  ok: boolean;
  referral: ReferralState;
}
