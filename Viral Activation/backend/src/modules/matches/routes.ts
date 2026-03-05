import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAudit } from "../common/audit.js";

const listSchema = z.object({
  groupCode: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0)
});

const upsertSchema = z.object({
  id: z.string().min(1).optional(),
  groupCode: z.string().min(1).max(10),
  homeNation: z.string().min(1).max(60),
  awayNation: z.string().min(1).max(60),
  stadium: z.string().min(1).max(120),
  city: z.string().max(80).optional(),
  kickoffAt: z.string().datetime(),
  status: z.string().min(1).max(30).default("scheduled"),
  homeScore: z.coerce.number().int().min(0).max(99).optional(),
  awayScore: z.coerce.number().int().min(0).max(99).optional(),
  highlight: z.string().max(200).optional()
});

const patchStatusSchema = z.object({
  status: z.string().min(1).max(30),
  homeScore: z.coerce.number().int().min(0).max(99).optional(),
  awayScore: z.coerce.number().int().min(0).max(99).optional(),
  highlight: z.string().max(200).optional()
});

function toDateOrUndefined(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export const matchesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/matches", { preHandler: app.requirePermission("dashboard.read") }, async (request) => {
    const q = listSchema.parse(request.query);
    const from = toDateOrUndefined(q.from);
    const to = toDateOrUndefined(q.to);
    const where = {
      ...(q.groupCode ? { groupCode: q.groupCode } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(from || to
        ? {
            kickoffAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {})
            }
          }
        : {})
    };
    const [items, total] = await Promise.all([
      app.prisma.matchFixture.findMany({
        where,
        orderBy: [{ kickoffAt: "asc" }, { createdAt: "desc" }],
        take: q.limit,
        skip: q.offset
      }),
      app.prisma.matchFixture.count({ where })
    ]);
    return { items, total };
  });

  app.post(
    "/api/v1/matches/upsert",
    { preHandler: app.requirePermission("settings.manage") },
    async (request) => {
      const body = upsertSchema.parse(request.body);
      const before = body.id ? await app.prisma.matchFixture.findUnique({ where: { id: body.id } }) : null;
      const after = body.id
        ? await app.prisma.matchFixture.update({
            where: { id: body.id },
            data: {
              groupCode: body.groupCode,
              homeNation: body.homeNation,
              awayNation: body.awayNation,
              stadium: body.stadium,
              city: body.city,
              kickoffAt: new Date(body.kickoffAt),
              status: body.status,
              homeScore: body.homeScore,
              awayScore: body.awayScore,
              highlight: body.highlight
            }
          })
        : await app.prisma.matchFixture.create({
            data: {
              groupCode: body.groupCode,
              homeNation: body.homeNation,
              awayNation: body.awayNation,
              stadium: body.stadium,
              city: body.city,
              kickoffAt: new Date(body.kickoffAt),
              status: body.status,
              homeScore: body.homeScore,
              awayScore: body.awayScore,
              highlight: body.highlight
            }
          });

      await writeAudit(app.prisma, {
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        action: before ? "match.update" : "match.create",
        module: "matches",
        targetType: "match_fixture",
        targetId: after.id,
        before,
        after,
        ipAddress: request.ip
      });
      return after;
    }
  );

  app.patch(
    "/api/v1/matches/:id/status",
    { preHandler: app.requirePermission("settings.manage") },
    async (request) => {
      const id = z.object({ id: z.string().min(1) }).parse(request.params).id;
      const body = patchStatusSchema.parse(request.body);
      const before = await app.prisma.matchFixture.findUnique({ where: { id } });
      if (!before) {
        throw app.httpErrors.notFound("Match not found");
      }
      const after = await app.prisma.matchFixture.update({
        where: { id },
        data: {
          status: body.status,
          homeScore: body.homeScore,
          awayScore: body.awayScore,
          highlight: body.highlight
        }
      });

      await writeAudit(app.prisma, {
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        action: "match.status.update",
        module: "matches",
        targetType: "match_fixture",
        targetId: id,
        before,
        after,
        ipAddress: request.ip
      });
      return after;
    }
  );
};
