import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAudit } from "../common/audit.js";

const pagingSchema = z.object({
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0)
});

const configSchema = z.object({
  f1Register: z.coerce.number().int().min(0).max(100_000),
  f1Active7d: z.coerce.number().int().min(0).max(100_000),
  f2Register: z.coerce.number().int().min(0).max(100_000),
  f2Active7d: z.coerce.number().int().min(0).max(100_000),
  maxF1PerSeason: z.coerce.number().int().min(1).max(500).default(50)
});

const defaultConfig = {
  f1Register: 200,
  f1Active7d: 500,
  f2Register: 50,
  f2Active7d: 100,
  maxF1PerSeason: 50
};

export const referralsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/api/v1/referrals/metrics",
    { preHandler: app.requirePermission("dashboard.read") },
    async () => {
      const [totalRefs, activeChainsDistinct, flagged, avgKickAgg] = await Promise.all([
        app.prisma.referralEvent.count({ where: { level: 1 } }),
        app.prisma.referralEvent.findMany({
          where: { status: "active_7d" },
          select: { inviterUserId: true },
          distinct: ["inviterUserId"]
        }),
        app.prisma.referralEvent.count({
          where: {
            OR: [{ status: "flagged" }, { riskScore: { gte: 70 } }]
          }
        }),
        app.prisma.referralEvent.aggregate({
          where: { status: "active_7d" },
          _avg: { kickAward: true }
        })
      ]);

      return {
        totalRefs,
        activeChains: activeChainsDistinct.length,
        avgBoost: Number((avgKickAgg._avg.kickAward ?? 0).toFixed(2)),
        flagged
      };
    }
  );

  app.get(
    "/api/v1/referrals/chains",
    { preHandler: app.requirePermission("dashboard.read") },
    async (request) => {
      const { limit, offset } = pagingSchema.parse(request.query);
      const rows = await app.prisma.referralEvent.findMany({
        include: {
          inviter: true,
          invited: true
        },
        orderBy: { createdAt: "desc" },
        take: 2000
      });

      const map = new Map<
        string,
        {
          inviterUserId: string;
          inviterUsername: string;
          f1Count: number;
          f2Count: number;
          active7dCount: number;
          totalKickAwarded: number;
          flaggedCount: number;
        }
      >();

      for (const row of rows) {
        const key = row.inviterUserId;
        const agg = map.get(key) ?? {
          inviterUserId: key,
          inviterUsername: row.inviter.username ?? "unknown",
          f1Count: 0,
          f2Count: 0,
          active7dCount: 0,
          totalKickAwarded: 0,
          flaggedCount: 0
        };
        if (row.level === 1) agg.f1Count += 1;
        if (row.level === 2) agg.f2Count += 1;
        if (row.status === "active_7d") agg.active7dCount += 1;
        agg.totalKickAwarded += row.kickAward;
        if (row.status === "flagged" || row.riskScore >= 70) agg.flaggedCount += 1;
        map.set(key, agg);
      }

      const items = [...map.values()]
        .sort((a, b) => b.totalKickAwarded - a.totalKickAwarded)
        .slice(offset, offset + limit);

      return { items, total: map.size };
    }
  );

  app.get(
    "/api/v1/referrals/flagged",
    { preHandler: app.requirePermission("dashboard.read") },
    async (request) => {
      const { limit, offset } = pagingSchema.parse(request.query);
      const [items, total] = await Promise.all([
        app.prisma.referralEvent.findMany({
          where: {
            OR: [{ status: "flagged" }, { riskScore: { gte: 70 } }]
          },
          include: {
            inviter: true,
            invited: true
          },
          orderBy: [{ riskScore: "desc" }, { createdAt: "desc" }],
          take: limit,
          skip: offset
        }),
        app.prisma.referralEvent.count({
          where: {
            OR: [{ status: "flagged" }, { riskScore: { gte: 70 } }]
          }
        })
      ]);
      return { items, total };
    }
  );

  app.get(
    "/api/v1/referrals/config",
    { preHandler: app.requirePermission("dashboard.read") },
    async () => {
      const row = await app.prisma.featureConfig.findUnique({ where: { key: "referrals" } });
      if (!row) {
        return { key: "referrals", value: defaultConfig };
      }
      const parsed = configSchema.safeParse(row.value);
      return { key: "referrals", value: parsed.success ? parsed.data : defaultConfig };
    }
  );

  app.put(
    "/api/v1/referrals/config",
    { preHandler: app.requirePermission("missions.manage") },
    async (request) => {
      const value = configSchema.parse(request.body);
      const before = await app.prisma.featureConfig.findUnique({ where: { key: "referrals" } });
      const after = await app.prisma.featureConfig.upsert({
        where: { key: "referrals" },
        update: {
          value,
          updatedBy: request.auth.sub
        },
        create: {
          key: "referrals",
          value,
          updatedBy: request.auth.sub
        }
      });

      await writeAudit(app.prisma, {
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        action: "referrals.config.update",
        module: "referrals",
        targetType: "feature_config",
        targetId: "referrals",
        before: before?.value,
        after: after.value,
        ipAddress: request.ip
      });
      return after;
    }
  );
};
