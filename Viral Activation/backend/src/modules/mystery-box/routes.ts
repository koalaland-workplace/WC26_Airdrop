import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAudit } from "../common/audit.js";

const tierSchema = z.enum(["rising", "elite", "legacy", "vanguard"]);

const allocationItemSchema = z.object({
  tier: tierSchema,
  totalBoxes: z.coerce.number().int().min(0).max(10_000_000),
  minKick: z.coerce.number().int().min(0).max(10_000_000),
  maxPerUser: z.coerce.number().int().min(1).max(10_000),
  isActive: z.boolean()
});

const allocationConfigSchema = z.object({
  allocations: z.array(allocationItemSchema).min(1).max(20),
  requireActiveDays: z.coerce.number().int().min(0).max(365).default(7),
  requireSybilPass: z.boolean().default(true),
  snapshotAt: z.string().datetime().nullable().optional()
});

const ticketListSchema = z.object({
  q: z.string().optional(),
  tier: tierSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0)
});

const adjustTicketSchema = z.object({
  userId: z.string().min(1),
  delta: z.coerce.number().int().min(-10_000).max(10_000),
  reason: z.string().min(2).max(200).default("Manual mystery ticket adjustment")
});

type MysteryAllocationItem = z.infer<typeof allocationItemSchema>;
type MysteryAllocationConfig = z.infer<typeof allocationConfigSchema>;

const defaultAllocations: MysteryAllocationItem[] = [
  { tier: "rising", totalBoxes: 25_000, minKick: 25_000, maxPerUser: 25, isActive: true },
  { tier: "elite", totalBoxes: 10_000, minKick: 100_000, maxPerUser: 25, isActive: true },
  { tier: "legacy", totalBoxes: 5_000, minKick: 250_000, maxPerUser: 10, isActive: true },
  { tier: "vanguard", totalBoxes: 1_000, minKick: 1_000_000, maxPerUser: 10, isActive: true }
];

function buildDefaultConfig(): MysteryAllocationConfig {
  return {
    allocations: defaultAllocations,
    requireActiveDays: 7,
    requireSybilPass: true,
    snapshotAt: null
  };
}

function normalizeConfig(raw: unknown): MysteryAllocationConfig {
  const parsed = allocationConfigSchema.safeParse(raw);
  if (!parsed.success) return buildDefaultConfig();
  const byTier = new Map(parsed.data.allocations.map((item) => [item.tier, item]));
  const ordered = defaultAllocations.map((fallback) => {
    const current = byTier.get(fallback.tier);
    return {
      tier: fallback.tier,
      totalBoxes: current?.totalBoxes ?? fallback.totalBoxes,
      // Tier policy is fixed across app/admin and should not drift by manual edits.
      minKick: fallback.minKick,
      maxPerUser: fallback.maxPerUser,
      isActive: current?.isActive ?? fallback.isActive
    };
  });
  return {
    allocations: ordered,
    requireActiveDays: parsed.data.requireActiveDays,
    requireSybilPass: parsed.data.requireSybilPass,
    snapshotAt: parsed.data.snapshotAt ?? null
  };
}

function tierMinKickMap(config: MysteryAllocationConfig): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of config.allocations) {
    map[row.tier] = row.minKick;
  }
  return map;
}

function resolveEligibleTier(kick: number, config: MysteryAllocationConfig): z.infer<typeof tierSchema> | null {
  const enabled = [...config.allocations].filter((row) => row.isActive).sort((a, b) => b.minKick - a.minKick);
  for (const row of enabled) {
    if (kick >= row.minKick) return row.tier;
  }
  return null;
}

export const mysteryBoxRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/api/v1/mystery-box/allocations",
    { preHandler: app.requirePermission("economy.manage") },
    async () => {
      const row = await app.prisma.featureConfig.findUnique({ where: { key: "mystery_box" } });
      const config = normalizeConfig(row?.value);
      return {
        key: "mystery_box",
        value: config,
        updatedAt: row?.updatedAt ?? null,
        updatedBy: row?.updatedBy ?? null
      };
    }
  );

  app.put(
    "/api/v1/mystery-box/allocations",
    { preHandler: app.requirePermission("economy.manage") },
    async (request) => {
      const body = allocationConfigSchema.parse(request.body);
      const normalized = normalizeConfig(body);
      const before = await app.prisma.featureConfig.findUnique({ where: { key: "mystery_box" } });
      const after = await app.prisma.featureConfig.upsert({
        where: { key: "mystery_box" },
        update: {
          value: normalized,
          updatedBy: request.auth.sub
        },
        create: {
          key: "mystery_box",
          value: normalized,
          updatedBy: request.auth.sub
        }
      });

      await writeAudit(app.prisma, {
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        action: "mystery_box.allocations.update",
        module: "economy",
        targetType: "feature_config",
        targetId: "mystery_box",
        before: before?.value,
        after: after.value,
        ipAddress: request.ip
      });

      return after;
    }
  );

  app.get(
    "/api/v1/mystery-box/tickets",
    { preHandler: app.requirePermission("economy.manage") },
    async (request) => {
      const query = ticketListSchema.parse(request.query);
      const row = await app.prisma.featureConfig.findUnique({ where: { key: "mystery_box" } });
      const config = normalizeConfig(row?.value);
      const tierKick = tierMinKickMap(config);

      const where = {
        mysteryTickets: { gt: 0 },
        ...(query.q
          ? {
              OR: [
                { username: { contains: query.q, mode: "insensitive" as const } },
                { telegramId: { contains: query.q, mode: "insensitive" as const } }
              ]
            }
          : {}),
        ...(query.tier
          ? {
              kick: {
                gte: tierKick[query.tier] ?? 0
              }
            }
          : {})
      };

      const [items, total, aggregate] = await Promise.all([
        app.prisma.appUser.findMany({
          where,
          orderBy: [{ mysteryTickets: "desc" }, { kick: "desc" }, { createdAt: "desc" }],
          take: query.limit,
          skip: query.offset
        }),
        app.prisma.appUser.count({ where }),
        app.prisma.appUser.aggregate({
          where,
          _sum: { mysteryTickets: true }
        })
      ]);

      return {
        items: items.map((user) => ({
          ...user,
          eligibleTier: resolveEligibleTier(user.kick, config)
        })),
        total,
        totalTickets: aggregate._sum.mysteryTickets ?? 0
      };
    }
  );

  app.post(
    "/api/v1/mystery-box/tickets/adjust",
    { preHandler: app.requirePermission("economy.manage") },
    async (request) => {
      const body = adjustTicketSchema.parse(request.body);
      const before = await app.prisma.appUser.findUnique({ where: { id: body.userId } });
      if (!before) {
        throw app.httpErrors.notFound("User not found");
      }
      const nextTickets = before.mysteryTickets + body.delta;
      if (nextTickets < 0) {
        throw app.httpErrors.badRequest("Mystery tickets cannot be negative");
      }

      const after = await app.prisma.appUser.update({
        where: { id: body.userId },
        data: { mysteryTickets: nextTickets }
      });

      await writeAudit(app.prisma, {
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        action: "mystery_box.ticket.adjust",
        module: "economy",
        targetType: "app_user",
        targetId: body.userId,
        before: { mysteryTickets: before.mysteryTickets },
        after: { mysteryTickets: after.mysteryTickets, delta: body.delta, reason: body.reason },
        ipAddress: request.ip
      });

      return {
        ok: true,
        userId: after.id,
        mysteryTickets: after.mysteryTickets
      };
    }
  );
};
