import { httpPost } from "../../api/http";
import type {
  SessionInitRequest,
  SessionInitResponse,
  SessionSyncRequest,
  SessionSyncResponse
} from "./types";

const SESSION_INIT_ENDPOINT = "/api/session/init";
const SESSION_SYNC_ENDPOINT = "/api/session/sync";

export async function initSession(payload: SessionInitRequest = {}): Promise<SessionInitResponse> {
  return httpPost<SessionInitResponse, SessionInitRequest>(SESSION_INIT_ENDPOINT, payload);
}

export async function syncSession(payload: SessionSyncRequest): Promise<SessionSyncResponse> {
  return httpPost<SessionSyncResponse, SessionSyncRequest>(SESSION_SYNC_ENDPOINT, payload);
}
