import { httpGet } from "../../api/http";

export interface LeaderboardPlayer {
  username: string | null;
  kick: number;
  nationCode: string;
}

export interface LeaderboardNation {
  nationCode: string;
  totalKick: number;
  playerCount: number;
}

export interface PublicLeaderboardResponse {
  ok: boolean;
  players: LeaderboardPlayer[];
  nations: LeaderboardNation[];
}

export interface LiveActivity {
  type: string;
  username: string | null;
  detail: string | null;
  amount: number;
  createdAt: string;
}

export interface LiveStatsResponse {
  ok: boolean;
  activities: LiveActivity[];
  globalStats: {
    totalUsers: number;
    totalKickDistributed: number;
  };
}

export function fetchPublicLeaderboard(): Promise<PublicLeaderboardResponse> {
  return httpGet<PublicLeaderboardResponse>("/api/leaderboard/public");
}

export function fetchLiveStats(): Promise<LiveStatsResponse> {
  return httpGet<LiveStatsResponse>("/api/stats/live");
}
