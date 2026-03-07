import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAudit } from "../common/audit.js";

const createSchema = z.object({
  title: z.string().min(3).max(150),
  message: z.string().min(3).max(4000),
  target: z.string().min(2).max(40).default("all"),
  publishNow: z.boolean().default(true)
});

export const announcementRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/app/announcements/latest", async () => {
    const now = new Date();
    const item = await app.prisma.announcement.findFirst({
      where: {
        publishedAt: {
          not: null,
          lte: now
        }
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        message: true,
        target: true,
        publishedAt: true,
        createdAt: true
      }
    });

    return { item };
  });

  app.get(
    "/api/v1/announcements",
    { preHandler: app.requirePermission("announcements.manage") },
    async () => {
      return app.prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 100
      });
    }
  );

  app.post(
    "/api/v1/announcements",
    { preHandler: app.requirePermission("announcements.manage") },
    async (request) => {
      const body = createSchema.parse(request.body);
      const created = await app.prisma.announcement.create({
        data: {
          title: body.title,
          message: body.message,
          target: body.target,
          createdById: request.auth.sub,
          publishedAt: body.publishNow ? new Date() : null
        }
      });
      await writeAudit(app.prisma, {
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        action: "announcement.create",
        module: "announcements",
        targetType: "announcement",
        targetId: created.id,
        after: created,
        ipAddress: request.ip
      });
      return created;
    }
  );
};
