import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticator } from "otplib";
import { verifyTelegramPayload } from "./telegram.js";
import { issueSessionTokens, revokeRefreshToken, rotateRefreshToken } from "./service.js";
import { writeAudit } from "../common/audit.js";
import { randomToken } from "./crypto.js";

const telegramLoginSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  authDate: z.coerce.number().int(),
  hash: z.string().min(1)
});

const totpSchema = z.object({
  pendingToken: z.string().min(10),
  code: z.string().regex(/^\d{6}$/)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/v1/auth/telegram/login", async (request, reply) => {
    const payload = telegramLoginSchema.parse(request.body);
    const ok = verifyTelegramPayload(
      payload,
      app.appConfig.telegramBotToken,
      app.appConfig.requireTelegramSignature
    );
    if (!ok) {
      throw app.httpErrors.unauthorized("Invalid Telegram signature");
    }

    const member = await app.prisma.boardMember.findUnique({
      where: { telegramId: payload.id }
    });
    if (!member || !member.isActive) {
      throw app.httpErrors.forbidden("Telegram account is not in admin board");
    }

    const needsTotp = member.requiresTotp || member.role === "owner" || member.role === "admin";
    if (needsTotp) {
      const pendingToken = randomToken(32);
      await app.pendingStore.set(
        `pending:${pendingToken}`,
        JSON.stringify({ boardMemberId: member.id }),
        60 * 5
      );
      return reply.send({
        requiresTotp: true,
        pendingToken
      });
    }

    const tokens = await issueSessionTokens(
      app,
      member,
      request.headers["user-agent"],
      request.ip
    );
    await writeAudit(app.prisma, {
      actorId: member.id,
      actorRole: member.role,
      action: "login.success",
      module: "auth",
      targetType: "board_member",
      targetId: member.id,
      ipAddress: request.ip
    });
    return reply.send({
      requiresTotp: false,
      ...tokens,
      profile: {
        id: member.id,
        telegramId: member.telegramId,
        username: member.username,
        role: member.role
      }
    });
  });

  app.post("/api/v1/auth/totp/verify", async (request, reply) => {
    const payload = totpSchema.parse(request.body);
    const cached = await app.pendingStore.get(`pending:${payload.pendingToken}`);
    if (!cached) {
      throw app.httpErrors.unauthorized("Pending token expired");
    }

    const parsed = JSON.parse(cached) as { boardMemberId: string };
    const member = await app.prisma.boardMember.findUnique({
      where: { id: parsed.boardMemberId }
    });
    if (!member || !member.isActive) {
      throw app.httpErrors.forbidden("Board member inactive");
    }
    if (!member.totpSecret) {
      throw app.httpErrors.preconditionRequired("TOTP secret not configured");
    }

    const valid = authenticator.verify({
      token: payload.code,
      secret: member.totpSecret
    });
    if (!valid) {
      throw app.httpErrors.unauthorized("Invalid TOTP code");
    }

    await app.pendingStore.del(`pending:${payload.pendingToken}`);
    const tokens = await issueSessionTokens(
      app,
      member,
      request.headers["user-agent"],
      request.ip
    );

    await writeAudit(app.prisma, {
      actorId: member.id,
      actorRole: member.role,
      action: "login.totp.success",
      module: "auth",
      targetType: "board_member",
      targetId: member.id,
      ipAddress: request.ip
    });

    return reply.send({
      requiresTotp: false,
      ...tokens,
      profile: {
        id: member.id,
        telegramId: member.telegramId,
        username: member.username,
        role: member.role
      }
    });
  });

  app.post("/api/v1/auth/refresh", async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);
    const rotated = await rotateRefreshToken(
      app,
      refreshToken,
      request.headers["user-agent"],
      request.ip
    );
    if (!rotated) {
      throw app.httpErrors.unauthorized("Invalid refresh token");
    }
    return reply.send({
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      profile: {
        id: rotated.member.id,
        telegramId: rotated.member.telegramId,
        username: rotated.member.username,
        role: rotated.member.role
      }
    });
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);
    await revokeRefreshToken(app, refreshToken);
    return reply.send({ ok: true });
  });

  app.get("/api/v1/auth/me", { preHandler: app.requireAuth }, async (request, reply) => {
    const member = await app.prisma.boardMember.findUnique({ where: { id: request.auth.sub } });
    if (!member || !member.isActive) {
      throw app.httpErrors.unauthorized("Session invalid");
    }
    return reply.send({
      id: member.id,
      telegramId: member.telegramId,
      username: member.username,
      role: member.role
    });
  });
};
