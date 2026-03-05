import type { AdminRole } from "@prisma/client";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { hasPermission } from "../common/permissions.js";
import type { AccessTokenPayload } from "../common/types.js";

const sseAuthSchema = z.object({
  accessToken: z.string().min(20).optional()
});

function nowMs(): number {
  return Date.now();
}

async function authorizeRealtime(
  app: Parameters<FastifyPluginAsync>[0],
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (request.headers.authorization) {
    await app.requirePermission("dashboard.read")(request, reply);
    return;
  }

  const parsed = sseAuthSchema.safeParse(request.query);
  const accessToken = parsed.success ? parsed.data.accessToken : undefined;
  if (!accessToken) {
    throw app.httpErrors.unauthorized("Missing access token");
  }

  const payload = (await app.jwt.verify(accessToken)) as AccessTokenPayload;
  const role = payload.role as AdminRole;
  if (!hasPermission(role, "dashboard.read")) {
    throw app.httpErrors.forbidden("Permission denied");
  }
  request.auth = payload;
}

function initSse(reply: FastifyReply): void {
  reply.hijack();
  reply.raw.setHeader("Content-Type", "text/event-stream");
  reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
  reply.raw.setHeader("Connection", "keep-alive");
  reply.raw.setHeader("X-Accel-Buffering", "no");
  reply.raw.write("retry: 3000\n\n");
}

function sendSse(reply: FastifyReply, event: string, data: unknown): void {
  reply.raw.write(`event: ${event}\n`);
  reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function getHealthSnapshot(app: Parameters<FastifyPluginAsync>[0]) {
  const dbStart = nowMs();
  let dbOk = true;
  try {
    await app.prisma.$queryRawUnsafe("SELECT 1");
  } catch {
    dbOk = false;
  }
  const dbLatencyMs = nowMs() - dbStart;

  const storeStart = nowMs();
  let storeOk = true;
  const storeMode = app.appConfig.redisUrl ? "redis" : "memory";
  try {
    const key = `health:${Math.random().toString(36).slice(2)}`;
    await app.pendingStore.set(key, "ok", 5);
    await app.pendingStore.get(key);
    await app.pendingStore.del(key);
  } catch {
    storeOk = false;
  }
  const storeLatencyMs = nowMs() - storeStart;

  return {
    at: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime()),
    services: {
      api: {
        status: "ok",
        latencyMs: 0
      },
      database: {
        status: dbOk ? "ok" : "down",
        latencyMs: dbLatencyMs
      },
      sessionStore: {
        mode: storeMode,
        status: storeOk ? "ok" : "down",
        latencyMs: storeLatencyMs
      }
    }
  };
}

async function getQueueSnapshot(app: Parameters<FastifyPluginAsync>[0]) {
  const [pendingCompliance, pendingAnnouncements, highRiskPique, bannedUsers] = await Promise.all([
    app.prisma.auditLog.count({
      where: {
        module: "compliance",
        action: { startsWith: "review.pending" }
      }
    }),
    app.prisma.announcement.count({
      where: {
        publishedAt: null
      }
    }),
    app.prisma.piqueConversation.count({
      where: {
        sentimentFlag: {
          in: ["high", "high_risk", "abuse", "jailbreak"]
        }
      }
    }),
    app.prisma.appUser.count({
      where: { status: "banned" }
    })
  ]);

  return {
    at: new Date().toISOString(),
    pendingCompliance,
    pendingAnnouncements,
    highRiskPique,
    bannedUsers
  };
}

async function getFeedSnapshot(app: Parameters<FastifyPluginAsync>[0]) {
  const [totalUsers, onlineUsers, totalKickAgg, pendingReviews, latestAudit] = await Promise.all([
    app.prisma.appUser.count(),
    app.prisma.appUser.count({ where: { status: "active" } }),
    app.prisma.appUser.aggregate({ _sum: { kick: true } }),
    app.prisma.auditLog.count({
      where: {
        module: "compliance",
        action: { startsWith: "review.pending" }
      }
    }),
    app.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { username: true, role: true }
        }
      },
      take: 4
    })
  ]);

  return {
    at: new Date().toISOString(),
    metrics: {
      totalUsers,
      onlineUsers,
      totalKick: totalKickAgg._sum.kick ?? 0,
      pendingReviews
    },
    activities: latestAudit.map((log) => ({
      id: log.id,
      action: log.action,
      module: log.module,
      at: log.createdAt.toISOString(),
      actor: log.actor?.username ?? "system",
      role: log.actor?.role ?? "system"
    }))
  };
}

export const realtimeRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/api/v1/system/health",
    { preHandler: app.requirePermission("dashboard.read") },
    async () => getHealthSnapshot(app)
  );

  app.get(
    "/api/v1/system/queue",
    { preHandler: app.requirePermission("dashboard.read") },
    async () => getQueueSnapshot(app)
  );

  app.get(
    "/api/v1/realtime/feed",
    {
      preHandler: async (request, reply) => {
        await authorizeRealtime(app, request, reply);
      }
    },
    async (request, reply) => {
      initSse(reply);
      sendSse(reply, "ready", { stream: "feed", at: new Date().toISOString() });

      const push = async () => {
        const payload = await getFeedSnapshot(app);
        sendSse(reply, "feed.snapshot", payload);
      };

      await push();
      const timer = setInterval(() => {
        void push();
      }, 5000);

      request.raw.on("close", () => {
        clearInterval(timer);
      });
    }
  );

  app.get(
    "/api/v1/realtime/health",
    {
      preHandler: async (request, reply) => {
        await authorizeRealtime(app, request, reply);
      }
    },
    async (request, reply) => {
      initSse(reply);
      sendSse(reply, "ready", { stream: "health", at: new Date().toISOString() });

      const push = async () => {
        const payload = await getHealthSnapshot(app);
        sendSse(reply, "health.snapshot", payload);
      };

      await push();
      const timer = setInterval(() => {
        void push();
      }, 10000);

      request.raw.on("close", () => {
        clearInterval(timer);
      });
    }
  );

  app.get(
    "/api/v1/realtime/queue",
    {
      preHandler: async (request, reply) => {
        await authorizeRealtime(app, request, reply);
      }
    },
    async (request, reply) => {
      initSse(reply);
      sendSse(reply, "ready", { stream: "queue", at: new Date().toISOString() });

      const push = async () => {
        const payload = await getQueueSnapshot(app);
        sendSse(reply, "queue.snapshot", payload);
      };

      await push();
      const timer = setInterval(() => {
        void push();
      }, 7000);

      request.raw.on("close", () => {
        clearInterval(timer);
      });
    }
  );
};
