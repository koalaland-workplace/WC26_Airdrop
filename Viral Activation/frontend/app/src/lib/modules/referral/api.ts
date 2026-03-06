import { httpGet, httpPost } from "../../api/http";
import type {
  ReferralBoostRequest,
  ReferralBoostResponse,
  ReferralStateResponse
} from "./types";

const REFERRAL_STATE_ENDPOINT = "/api/referral/state";
const REFERRAL_BOOST_ENDPOINT = "/api/referral/boost";

export async function fetchReferralState(sessionId: string): Promise<ReferralStateResponse> {
  const encodedSessionId = encodeURIComponent(sessionId);
  return httpGet<ReferralStateResponse>(`${REFERRAL_STATE_ENDPOINT}?sessionId=${encodedSessionId}`);
}

export async function activateReferralBoost(
  payload: ReferralBoostRequest
): Promise<ReferralBoostResponse> {
  return httpPost<ReferralBoostResponse, ReferralBoostRequest>(REFERRAL_BOOST_ENDPOINT, payload);
}
