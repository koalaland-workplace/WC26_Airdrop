import { httpGet, httpPost } from "../../api/http";
import type {
  EarnClaimRequest,
  EarnClaimResponse,
  EarnStateResponse
} from "./types";

const EARN_TASKS_STATE_ENDPOINT = "/api/earn/tasks/state";
const EARN_TASKS_CLAIM_ENDPOINT = "/api/earn/tasks/claim";

export async function fetchEarnState(sessionId: string): Promise<EarnStateResponse> {
  const encodedSessionId = encodeURIComponent(sessionId);
  return httpGet<EarnStateResponse>(`${EARN_TASKS_STATE_ENDPOINT}?sessionId=${encodedSessionId}`);
}

export async function claimEarnTask(payload: EarnClaimRequest): Promise<EarnClaimResponse> {
  return httpPost<EarnClaimResponse, EarnClaimRequest>(EARN_TASKS_CLAIM_ENDPOINT, payload);
}
