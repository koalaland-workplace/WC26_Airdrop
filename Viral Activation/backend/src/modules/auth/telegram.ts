import { createHash, createHmac } from "node:crypto";

export interface TelegramLoginPayload {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  authDate: number;
  hash: string;
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
