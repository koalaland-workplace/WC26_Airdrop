import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAudit } from "../common/audit.js";

const listSchema = z.object({
  active: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  category: z.string().min(1).optional(),
  limit: z.coerce.number().min(1).max(200).default(100),
  offset: z.coerce.number().min(0).default(0)
});

const upsertSchema = z.object({
  id: z.string().min(1).optional(),
  code: z.string().min(2).max(80),
  name: z.string().min(2).max(200),
  phase: z.string().min(2).max(120).default("Viral Activation"),
  category: z.string().min(2).max(50).default("daily"),
  channelId: z.string().trim().optional().nullable(),
  rewardKick: z.coerce.number().int().min(0).max(1_000_000),
  capPerDay: z.coerce.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().default(true)
});

export const missionsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/missions", { preHandler: app.requirePermission("dashboard.read") }, async (request) => {
    const q = listSchema.parse(request.query);
    const where = {
      ...(q.category ? { category: q.category } : {}),
      ...(q.active !== undefined ? { isActive: q.active } : {})
    };

    const [items, total, progressAgg] = await Promise.all([
      app.prisma.mission.findMany({
        where,
        include: {
          channel: {
            select: {
              id: true,
              platform: true,
              name: true,
              url: true,
              icon: true,
              isActive: true
            }
          }
        },
        orderBy: [{ isActive: "desc" }, { rewardKick: "desc" }],
        take: q.limit,
        skip: q.offset
      }),
      app.prisma.mission.count({ where }),
      app.prisma.missionProgress.groupBy({
        by: ["missionId"],
        _count: { _all: true },
        _sum: { awardedKick: true }
      })
    ]);

    const progressMap = new Map(
      progressAgg.map((g) => [g.missionId, { completions: g._count._all, awardedKick: g._sum.awardedKick ?? 0 }])
    );

    return {
      items: items.map((m) => ({
        ...m,
        stats: progressMap.get(m.id) ?? { completions: 0, awardedKick: 0 }
      })),
      total
    };
  });

  app.post(
    "/api/v1/missions/upsert",
    { preHandler: app.requirePermission("missions.manage") },
    async (request) => {
      const body = upsertSchema.parse(request.body);
      const channelIdRaw = typeof body.channelId === "string" ? body.channelId : "";
      const channelId = channelIdRaw.trim().length > 0 ? channelIdRaw.trim() : null;
      if (channelId) {
        const channel = await app.prisma.socialChannel.findUnique({ where: { id: channelId } });
        if (!channel) {
          throw app.httpErrors.badRequest("Social channel not found");
        }
      }

      const before = body.id
        ? await app.prisma.mission.findUnique({
            where: { id: body.id },
            include: {
              channel: {
                select: {
                  id: true,
                  platform: true,
                  name: true,
                  url: true,
                  icon: true,
                  isActive: true
                }
              }
            }
          })
        : null;
      const after = body.id
        ? await app.prisma.mission.update({
            where: { id: body.id },
            include: {
              channel: {
                select: {
                  id: true,
                  platform: true,
                  name: true,
                  url: true,
                  icon: true,
                  isActive: true
                }
              }
            },
            data: {
              code: body.code,
              name: body.name,
              phase: body.phase,
              category: body.category,
              channelId,
              rewardKick: body.rewardKick,
              capPerDay: body.capPerDay,
              isActive: body.isActive
            }
          })
        : await app.prisma.mission.create({
            include: {
              channel: {
                select: {
                  id: true,
                  platform: true,
                  name: true,
                  url: true,
                  icon: true,
                  isActive: true
                }
              }
            },
            data: {
              code: body.code,
              name: body.name,
              phase: body.phase,
              category: body.category,
              channelId,
              rewardKick: body.rewardKick,
              capPerDay: body.capPerDay,
              isActive: body.isActive
            }
          });

      await writeAudit(app.prisma, {
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        action: before ? "mission.update" : "mission.create",
        module: "missions",
        targetType: "mission",
        targetId: after.id,
        before,
        after,
        ipAddress: request.ip
      });
      return after;
    }
  );

  app.patch(
    "/api/v1/missions/:id/toggle",
    { preHandler: app.requirePermission("missions.manage") },
    async (request) => {
      const id = z.object({ id: z.string().min(1) }).parse(request.params).id;
      const body = z.object({ isActive: z.boolean() }).parse(request.body);
      const before = await app.prisma.mission.findUnique({ where: { id } });
      if (!before) {
        throw app.httpErrors.notFound("Mission not found");
      }
      const after = await app.prisma.mission.update({
        where: { id },
        data: { isActive: body.isActive }
      });

      await writeAudit(app.prisma, {
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        action: "mission.toggle",
        module: "missions",
        targetType: "mission",
        targetId: after.id,
        before,
        after,
        ipAddress: request.ip
      });
      return after;
    }
  );
};
