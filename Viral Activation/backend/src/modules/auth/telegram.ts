import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export interface TelegramLoginPayload {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  authDate: number;
  hash: string;
}

export interface TelegramMiniAppIdentity {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  authDate?: number;
  hash?: string;
}

export function verifyTelegramPayload(
  payload: TelegramLoginPayload,
  botToken: string,
  requireSignature: boolean
): boolean {
  if (!requireSignature) return true;
  if (!botToken) return false;

  const data: Record<string, string> = {
    auth_date: String(payload.authDate),
    id: payload.id,
    username: payload.username
  };
  if (payload.firstName) data.first_name = payload.firstName;
  if (payload.lastName) data.last_name = payload.lastName;

  const dataCheckString = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = createHash("sha256").update(botToken).digest();
  const computed = createHmac("sha256", secret).update(dataCheckString).digest("hex");
  return computed === payload.hash;
}

function parseMiniAppUser(raw: string | null): TelegramMiniAppIdentity | null {
  if (!raw) return null;
  try {
    const node = JSON.parse(raw) as {
      id?: unknown;
      username?: unknown;
      first_name?: unknown;
      last_name?: unknown;
    };
    const id = String(node.id ?? "").trim();
    if (!id) return null;
    const username = String(node.username ?? "").trim().replace(/^@+/, "");
    const firstName = String(node.first_name ?? "").trim();
    const lastName = String(node.last_name ?? "").trim();
    return {
      id,
      username: username || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined
    };
  } catch {
    return null;
  }
}

export function verifyTelegramWebAppInitData(
  initData: string,
  botToken: string,
  requireSignature: boolean
): TelegramMiniAppIdentity | null {
  const normalized = String(initData ?? "").trim();
  if (!normalized) return null;

  const params = new URLSearchParams(normalized);
  const user = parseMiniAppUser(params.get("user"));
  if (!user) return null;

  const authDateRaw = Number(params.get("auth_date") ?? 0);
  if (Number.isFinite(authDateRaw) && authDateRaw > 0) {
    user.authDate = Math.floor(authDateRaw);
  }
  const hash = String(params.get("hash") ?? "").trim();
  if (hash) user.hash = hash;

  if (!requireSignature) return user;
  if (!botToken || !hash) return null;

  const sortedPairs = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHex = createHmac("sha256", secret).update(sortedPairs).digest("hex");

  try {
    const hashBuffer = Buffer.from(hash, "hex");
    const computedBuffer = Buffer.from(computedHex, "hex");
    if (hashBuffer.length !== computedBuffer.length) return null;
    if (!timingSafeEqual(hashBuffer, computedBuffer)) return null;
  } catch {
    return null;
  }

  return user;
}
