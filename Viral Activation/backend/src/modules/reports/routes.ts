import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AdminRole } from "@prisma/client";
import { hasPermission } from "../common/permissions.js";
import type { AccessTokenPayload } from "../common/types.js";

const auditQuerySchema = z.object({
  module: z.string().min(1).optional(),
  action: z.string().min(1).optional(),
  actorId: z.string().min(1).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(100),
  offset: z.coerce.number().min(0).default(0)
});

const reportQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(5000).default(2000)
});

const reportAuthSchema = z.object({
  accessToken: z.string().min(20).optional()
});

function toDateOrUndefined(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function csvEscape(value: unknown): string {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

async function authorizeReports(
  app: Parameters<FastifyPluginAsync>[0],
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (request.headers.authorization) {
    await app.requirePermission("reports.read")(request, reply);
    return;
  }

  const parsed = reportAuthSchema.safeParse(request.query);
  const accessToken = parsed.success ? parsed.data.accessToken : undefined;
  if (!accessToken) {
    throw app.httpErrors.unauthorized("Missing access token");
  }
  const payload = (await app.jwt.verify(accessToken)) as AccessTokenPayload;
  const role = payload.role as AdminRole;
  if (!hasPermission(role, "reports.read")) {
    throw app.httpErrors.forbidden("Permission denied");
  }
  request.auth = payload;
}

export const reportsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/api/v1/audit-logs",
    {
      preHandler: async (request, reply) => {
        await authorizeReports(app, request, reply);
      }
    },
    async (request) => {
      const q = auditQuerySchema.parse(request.query);
      const from = toDateOrUndefined(q.from);
      const to = toDateOrUndefined(q.to);
      const where = {
        ...(q.module ? { module: q.module } : {}),
        ...(q.action ? { action: { contains: q.action, mode: "insensitive" as const } } : {}),
        ...(q.actorId ? { actorId: q.actorId } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {})
              }
            }
          : {})
      };

      const [items, total] = await Promise.all([
        app.prisma.auditLog.findMany({
          where,
          include: {
            actor: {
              select: {
                id: true,
                username: true,
                displayName: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: q.limit,
          skip: q.offset
        }),
        app.prisma.auditLog.count({ where })
      ]);
      return { items, total };
    }
  );

  app.get(
    "/api/v1/reports/kick-ledger/summary",
    {
      preHandler: async (request, reply) => {
        await authorizeReports(app, request, reply);
      }
    },
    async (request) => {
      const q = reportQuerySchema.parse(request.query);
      const from = toDateOrUndefined(q.from);
      const to = toDateOrUndefined(q.to);
      const where = {
        ...(q.userId ? { userId: q.userId } : {}),
        ...(q.source ? { source: q.source } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {})
              }
            }
          : {})
      };

      const [totalEntries, positiveAgg, negativeAgg, latest] = await Promise.all([
        app.prisma.kickLedger.count({ where }),
        app.prisma.kickLedger.aggregate({
          where: {
            ...where,
            delta: { gt: 0 }
          },
          _sum: { delta: true }
        }),
        app.prisma.kickLedger.aggregate({
          where: {
            ...where,
            delta: { lt: 0 }
          },
          _sum: { delta: true }
        }),
        app.prisma.kickLedger.findMany({
          where,
          include: { user: true, actor: true },
          orderBy: { createdAt: "desc" },
          take: 20
        })
      ]);

      return {
        totalEntries,
        totalGrantedKick: positiveAgg._sum.delta ?? 0,
        totalDeductedKick: negativeAgg._sum.delta ?? 0,
        latest
      };
    }
  );

  app.get(
    "/api/v1/reports/kick-ledger/export.csv",
    {
      preHandler: async (request, reply) => {
        await authorizeReports(app, request, reply);
      }
    },
    async (request, reply) => {
      const q = reportQuerySchema.parse(request.query);
      const from = toDateOrUndefined(q.from);
      const to = toDateOrUndefined(q.to);
      const where = {
        ...(q.userId ? { userId: q.userId } : {}),
        ...(q.source ? { source: q.source } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {})
              }
            }
          : {})
      };

      const rows = await app.prisma.kickLedger.findMany({
        where,
        include: {
          user: true,
          actor: true
        },
        orderBy: { createdAt: "desc" },
        take: q.limit
      });

      const headers = [
        "id",
        "createdAt",
        "userId",
        "username",
        "telegramId",
        "nationCode",
        "delta",
        "reason",
        "source",
        "actorId",
        "actorUsername",
        "actorRole"
      ];
      const lines = [
        headers.join(","),
        ...rows.map((row) =>
          [
            row.id,
            row.createdAt.toISOString(),
            row.userId,
            row.user.username ?? "",
            row.user.telegramId ?? "",
            row.user.nationCode,
            row.delta,
            row.reason,
            row.source,
            row.actorId ?? "",
            row.actor?.username ?? "",
            row.actor?.role ?? ""
          ]
            .map(csvEscape)
            .join(",")
        )
      ];

      const stamp = new Date().toISOString().slice(0, 10);
      reply.header("content-type", "text/csv; charset=utf-8");
      reply.header("content-disposition", `attachment; filename=\"kick-ledger-${stamp}.csv\"`);
      return reply.send(lines.join("\n"));
    }
  );
};
