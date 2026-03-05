export type AdminRole = "owner" | "admin" | "moderator" | "support" | "analyst";
export type UserStatus = "active" | "banned" | "vip";

export interface Profile {
  id: string;
  telegramId: string;
  username: string;
  role: AdminRole;
}

export interface LoginResponse {
  pendingToken?: string;
  requiresTotp: boolean;
  accessToken?: string;
  refreshToken?: string;
  profile?: Profile;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { message?: string };
      throw new Error(parsed.message ?? `HTTP ${res.status}`);
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  return (await res.json()) as T;
}

function authedHeaders(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function loginWithTelegram(payload: {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  authDate: number;
  hash: string;
}): Promise<LoginResponse> {
  return request<LoginResponse>("/api/v1/auth/telegram/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function verifyTotp(payload: {
  pendingToken: string;
  code: string;
}): Promise<LoginResponse> {
  return request<LoginResponse>("/api/v1/auth/totp/verify", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getDashboard(accessToken: string): Promise<{
  totalUsers: number;
  onlineUsers: number;
  totalKick: number;
  pendingReviews: number;
}> {
  return request("/api/v1/dashboard/metrics", {
    headers: authedHeaders(accessToken)
  });
}

export async function refreshSession(payload: { refreshToken: string }): Promise<{
  accessToken: string;
  refreshToken: string;
  profile: Profile;
}> {
  return request("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function logoutSession(payload: { refreshToken: string }): Promise<{ ok: boolean }> {
  return request("/api/v1/auth/logout", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export interface AppUser {
  id: string;
  telegramId: string | null;
  username: string | null;
  nationCode: string;
  status: UserStatus;
  kick: number;
  createdAt: string;
}

export async function listUsers(
  accessToken: string,
  query: { q?: string; status?: UserStatus; limit?: number; offset?: number } = {}
): Promise<{ items: AppUser[]; total: number }> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return request(`/api/v1/users${suffix}`, {
    headers: authedHeaders(accessToken)
  });
}

export async function updateUserStatus(
  accessToken: string,
  payload: { id: string; status: UserStatus }
): Promise<AppUser> {
  return request(`/api/v1/users/${payload.id}/status`, {
    method: "PATCH",
    headers: authedHeaders(accessToken),
    body: JSON.stringify({ status: payload.status })
  });
}

export interface KickLedgerItem {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  source: string;
  actorId: string | null;
  createdAt: string;
  user: AppUser;
  actor: Profile | null;
}

export async function listKickLedger(
  accessToken: string,
  query: { userId?: string; limit?: number; offset?: number } = {}
): Promise<{ items: KickLedgerItem[]; total: number }> {
  const params = new URLSearchParams();
  if (query.userId) params.set("userId", query.userId);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return request(`/api/v1/kick-ledger${suffix}`, {
    headers: authedHeaders(accessToken)
  });
}

export async function adjustKick(
  accessToken: string,
  payload: { userId: string; delta: number; reason: string; source?: string }
): Promise<unknown> {
  return request("/api/v1/kick-ledger/adjust", {
    method: "POST",
    headers: authedHeaders(accessToken),
    body: JSON.stringify(payload)
  });
}

export interface FeatureConfig {
  key: string;
  value: Record<string, unknown>;
  updatedBy?: string | null;
  updatedAt?: string;
}

export async function getConfig(accessToken: string, key: "spin" | "penalty" | "missions" | "settings" | "api") {
  return request<FeatureConfig>(`/api/v1/config/${key}`, {
    headers: authedHeaders(accessToken)
  });
}

export async function updateConfig(
  accessToken: string,
  key: "spin" | "penalty" | "missions" | "settings" | "api",
  value: Record<string, unknown>
) {
  return request<FeatureConfig>(`/api/v1/config/${key}`, {
    method: "PUT",
    headers: authedHeaders(accessToken),
    body: JSON.stringify({ value })
  });
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  target: string;
  createdById: string | null;
  createdAt: string;
  publishedAt: string | null;
}

export async function listAnnouncements(accessToken: string): Promise<Announcement[]> {
  return request("/api/v1/announcements", {
    headers: authedHeaders(accessToken)
  });
}

export async function createAnnouncement(
  accessToken: string,
  payload: { title: string; message: string; target: string; publishNow?: boolean }
): Promise<Announcement> {
  return request("/api/v1/announcements", {
    method: "POST",
    headers: authedHeaders(accessToken),
    body: JSON.stringify(payload)
  });
}

export interface BoardMember {
  id: string;
  telegramId: string;
  username: string;
  displayName: string;
  role: AdminRole;
  requiresTotp: boolean;
  totpSecret: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function listBoardMembers(accessToken: string): Promise<{ items: BoardMember[] }> {
  return request("/api/v1/board-members", {
    headers: authedHeaders(accessToken)
  });
}

export async function upsertBoardMember(
  accessToken: string,
  payload: {
    telegramId: string;
    username: string;
    displayName: string;
    role: AdminRole;
    requiresTotp?: boolean;
    totpSecret?: string;
    isActive?: boolean;
  }
): Promise<BoardMember> {
  return request("/api/v1/board-members/upsert", {
    method: "POST",
    headers: authedHeaders(accessToken),
    body: JSON.stringify(payload)
  });
}

export interface PiqueConversation {
  id: string;
  appUserId: string | null;
  telegramId: string | null;
  username: string | null;
  prompt: string;
  reply: string;
  sentimentFlag: string | null;
  createdAt: string;
}

export async function listPiqueConversations(
  accessToken: string,
  query: {
    telegramId?: string;
    username?: string;
    keyword?: string;
    sentiment?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ items: PiqueConversation[]; total: number }> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return request(`/api/v1/pique/conversations${suffix}`, {
    headers: authedHeaders(accessToken)
  });
}
