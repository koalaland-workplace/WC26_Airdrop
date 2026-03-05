import { writable } from "svelte/store";
import type { AdminRole } from "../api/client";

export interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  pendingToken: string | null;
  role: AdminRole | null;
  username: string | null;
}

const initial: SessionState = {
  accessToken: null,
  refreshToken: null,
  pendingToken: null,
  role: null,
  username: null
};

const STORAGE_KEY = "wc26_admin_session_v1";

function readStored(): SessionState {
  if (typeof localStorage === "undefined") return initial;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as SessionState;
    return { ...initial, ...parsed };
  } catch {
    return initial;
  }
}

export const session = writable<SessionState>(readStored());

if (typeof localStorage !== "undefined") {
  session.subscribe((value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  });
}

export function setPending(pendingToken: string) {
  session.update((s) => ({ ...s, pendingToken }));
}

export function setActive(data: {
  accessToken: string;
  refreshToken: string;
  role: AdminRole;
  username: string;
}) {
  session.set({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    pendingToken: null,
    role: data.role,
    username: data.username
  });
}

export function clearSession() {
  session.set(initial);
}
