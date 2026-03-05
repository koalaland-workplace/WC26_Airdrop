import type { FastifyReply, FastifyRequest } from "fastify";

export const ACCESS_COOKIE_NAME = "wc26_admin_access";

function serializeCookie(
  name: string,
  value: string,
  opts: { maxAge?: number; secure?: boolean; sameSite?: "Lax" | "Strict" | "None"; path?: string; httpOnly?: boolean }
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path ?? "/"}`);
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${Math.max(0, Math.floor(opts.maxAge))}`);
  if (opts.httpOnly !== false) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  parts.push(`SameSite=${opts.sameSite ?? "Lax"}`);
  return parts.join("; ");
}

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    out[rawKey] = decodeURIComponent(rest.join("="));
  }
  return out;
}

export function setAccessCookie(reply: FastifyReply, accessToken: string, secureCookie: boolean): void {
  reply.header(
    "set-cookie",
    serializeCookie(ACCESS_COOKIE_NAME, accessToken, {
      maxAge: 60 * 15,
      secure: secureCookie,
      sameSite: "Lax",
      path: "/",
      httpOnly: true
    })
  );
}

export function clearAccessCookie(reply: FastifyReply, secureCookie: boolean): void {
  reply.header(
    "set-cookie",
    serializeCookie(ACCESS_COOKIE_NAME, "", {
      maxAge: 0,
      secure: secureCookie,
      sameSite: "Lax",
      path: "/",
      httpOnly: true
    })
  );
}

export function getAccessTokenFromCookie(request: FastifyRequest): string | null {
  const cookies = parseCookies(request.headers.cookie);
  return cookies[ACCESS_COOKIE_NAME] ?? null;
}
