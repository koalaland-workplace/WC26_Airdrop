import { httpGet, httpPost } from "../../api/http";

export interface SquadInfo {
  id: string;
  name: string;
  captainId: string;
  captainUsername?: string;
  nationCode: string;
  totalKick: number;
  memberCount: number;
}

export interface SquadMemberInfo {
  username: string | null;
  kick: number;
  nationCode: string;
  joinedAt: string;
}

export interface SquadDetailInfo extends SquadInfo {
  members: SquadMemberInfo[];
}

export interface SquadCreateResponse {
  ok: boolean;
  reason?: string;
  squad?: SquadInfo;
}

export interface SquadJoinResponse {
  ok: boolean;
  reason?: string;
  squad?: SquadInfo;
}

export interface SquadLeaderboardResponse {
  ok: boolean;
  squads: SquadInfo[];
}

export interface SquadMyResponse {
  ok: boolean;
  squad: SquadDetailInfo | null;
}

export function createSquad(sessionId: string, name: string): Promise<SquadCreateResponse> {
  return httpPost<SquadCreateResponse>("/api/squad/create", { sessionId, name });
}

export function joinSquad(sessionId: string, squadId: string): Promise<SquadJoinResponse> {
  return httpPost<SquadJoinResponse>("/api/squad/join", { sessionId, squadId });
}

export function fetchSquadLeaderboard(): Promise<SquadLeaderboardResponse> {
  return httpGet<SquadLeaderboardResponse>("/api/squad/leaderboard");
}

export function fetchMySquad(sessionId: string): Promise<SquadMyResponse> {
  return httpGet<SquadMyResponse>(`/api/squad/my?sessionId=${encodeURIComponent(sessionId)}`);
}
