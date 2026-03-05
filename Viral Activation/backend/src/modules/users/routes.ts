import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAudit } from "../common/audit.js";

const listQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["active", "banned", "vip"]).optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0)
});

const statusSchema = z.object({
  status: z.enum(["active", "banned", "vip"])
});

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/users", { preHandler: app.requirePermission("users.manage") }, async (request) => {
    const q = listQuerySchema.parse(request.query);
    const where = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.q
        ? {
            OR: [
              { username: { contains: q.q, mode: "insensitive" as const } },
              { telegramId: { contains: q.q, mode: "insensitive" as const } }
            ]
          }
        : {})
    };
    const [items, total] = await Promise.all([
      app.prisma.appUser.findMany({
        where,
        orderBy: { kick: "desc" },
        take: q.limit,
        skip: q.offset
      }),
      app.prisma.appUser.count({ where })
    ]);
    return { items, total };
  });

  app.patch(
    "/api/v1/users/:id/status",
    { preHandler: app.requirePermission("users.manage") },
    async (request) => {
      const id = z.object({ id: z.string().min(1) }).parse(request.params).id;
      const body = statusSchema.parse(request.body);
      const before = await app.prisma.appUser.findUnique({ where: { id } });
      if (!before) {
        throw app.httpErrors.notFound("User not found");
      }
      const after = await app.prisma.appUser.update({
        where: { id },
        data: { status: body.status }
      });
      await writeAudit(app.prisma, {
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        action: "user.status.update",
        module: "users",
        targetType: "app_user",
        targetId: id,
        before,
        after,
        ipAddress: request.ip
      });
      return after;
    }
  );
};
