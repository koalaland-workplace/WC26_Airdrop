import { httpGet, httpPost } from "../../api/http";
import type {
  SpinRollRequest,
  SpinRollResponse,
  SpinStateResponse,
  SpinUnlockRequest,
  SpinUnlockResponse,
  SpinUnlockType
} from "./types";

const SPIN_STATE_ENDPOINT = "/api/spin/state";
const SPIN_UNLOCK_ENDPOINT = "/api/spin/unlock";
const SPIN_ROLL_ENDPOINT = "/api/spin/roll";

export async function fetchSpinState(sessionId: string): Promise<SpinStateResponse> {
  const encodedSessionId = encodeURIComponent(sessionId);
  return httpGet<SpinStateResponse>(`${SPIN_STATE_ENDPOINT}?sessionId=${encodedSessionId}`);
}

export async function unlockSpin(sessionId: string, type: SpinUnlockType): Promise<SpinUnlockResponse> {
  const body: SpinUnlockRequest = { sessionId, type };
  return httpPost<SpinUnlockResponse, SpinUnlockRequest>(SPIN_UNLOCK_ENDPOINT, body);
}

export async function rollSpin(sessionId: string): Promise<SpinRollResponse> {
  const body: SpinRollRequest = { sessionId };
  return httpPost<SpinRollResponse, SpinRollRequest>(SPIN_ROLL_ENDPOINT, body);
}
