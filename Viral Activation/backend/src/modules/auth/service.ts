import type { FastifyInstance } from "fastify";
import type { BoardMember } from "@prisma/client";
import { randomToken, sha256 } from "./crypto.js";

const ACCESS_TTL_SECONDS = 60 * 15;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function issueSessionTokens(
  app: FastifyInstance,
  member: BoardMember,
  userAgent?: string,
  ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await app.jwt.sign(
    {
      sub: member.id,
      telegramId: member.telegramId,
      username: member.username,
      role: member.role
    },
    { expiresIn: ACCESS_TTL_SECONDS }
  );

  const refreshToken = randomToken(48);
  const refreshTokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

  await app.prisma.adminSession.create({
    data: {
      boardMemberId: member.id,
      refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt
    }
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(
  app: FastifyInstance,
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string; member: BoardMember } | null> {
  const refreshTokenHash = sha256(refreshToken);
  const existing = await app.prisma.adminSession.findUnique({
    where: { refreshTokenHash },
    include: { boardMember: true }
  });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }

  const nextRefresh = randomToken(48);
  const nextRefreshHash = sha256(nextRefresh);

  await app.prisma.$transaction([
    app.prisma.adminSession.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() }
    }),
    app.prisma.adminSession.create({
      data: {
        boardMemberId: existing.boardMemberId,
        refreshTokenHash: nextRefreshHash,
        rotatedFromId: existing.id,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000)
      }
    })
  ]);

  const accessToken = await app.jwt.sign(
    {
      sub: existing.boardMember.id,
      telegramId: existing.boardMember.telegramId,
      username: existing.boardMember.username,
      role: existing.boardMember.role
    },
    { expiresIn: ACCESS_TTL_SECONDS }
  );

  return { accessToken, refreshToken: nextRefresh, member: existing.boardMember };
}

export async function revokeRefreshToken(app: FastifyInstance, refreshToken: string): Promise<void> {
  const refreshTokenHash = sha256(refreshToken);
  await app.prisma.adminSession.updateMany({
    where: { refreshTokenHash, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}
