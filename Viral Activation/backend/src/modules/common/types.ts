import type { AdminRole } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string;
  telegramId: string;
  username: string;
  role: AdminRole;
}

export type AuthContext = AccessTokenPayload;
