import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const querySchema = z.object({
  telegramId: z.string().optional(),
  username: z.string().optional(),
  keyword: z.string().optional(),
  sentiment: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0)
});

const ingestSchema = z.object({
  appUserId: z.string().optional(),
  telegramId: z.string().optional(),
  username: z.string().optional(),
  prompt: z.string().min(1),
  reply: z.string().min(1),
  sentimentFlag: z.string().default("neutral")
});

export const piqueRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/api/v1/pique/conversations",
    { preHandler: app.requirePermission("pique.logs.read") },
    async (request) => {
      const q = querySchema.parse(request.query);
      const where = {
        ...(q.telegramId ? { telegramId: q.telegramId } : {}),
        ...(q.username ? { username: { contains: q.username, mode: "insensitive" as const } } : {}),
        ...(q.sentiment ? { sentimentFlag: q.sentiment } : {}),
        ...(q.keyword
          ? {
              OR: [
                { prompt: { contains: q.keyword, mode: "insensitive" as const } },
                { reply: { contains: q.keyword, mode: "insensitive" as const } }
              ]
            }
          : {}),
        ...(q.from || q.to
          ? {
              createdAt: {
                ...(q.from ? { gte: new Date(q.from) } : {}),
                ...(q.to ? { lte: new Date(q.to) } : {})
              }
            }
          : {})
      };
      const [items, total] = await Promise.all([
        app.prisma.piqueConversation.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: q.limit,
          skip: q.offset
        }),
        app.prisma.piqueConversation.count({ where })
      ]);
      return { items, total };
    }
  );

  app.post(
    "/api/v1/pique/conversations",
    { preHandler: app.requirePermission("api.manage") },
    async (request) => {
      const body = ingestSchema.parse(request.body);
      return app.prisma.piqueConversation.create({ data: body });
    }
  );
};
