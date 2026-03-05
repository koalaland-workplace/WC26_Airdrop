import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { AdminRole } from "@prisma/client";
import { writeAudit } from "../common/audit.js";

const upsertSchema = z.object({
  telegramId: z.string().min(4),
  username: z.string().min(2),
  displayName: z.string().min(2),
  role: z.enum(["owner", "admin", "moderator", "support", "analyst"]),
  requiresTotp: z.boolean().default(false),
  totpSecret: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const boardRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/api/v1/board-members",
    { preHandler: app.requirePermission("board.manage") },
    async () => {
      const items = await app.prisma.boardMember.findMany({
        orderBy: [{ role: "asc" }, { createdAt: "asc" }]
      });
      return { items };
    }
  );

  app.post(
    "/api/v1/board-members/upsert",
    { preHandler: app.requirePermission("board.manage") },
    async (request) => {
      const body = upsertSchema.parse(request.body);
      const before = await app.prisma.boardMember.findUnique({
        where: { telegramId: body.telegramId }
      });
      const after = await app.prisma.boardMember.upsert({
        where: { telegramId: body.telegramId },
        update: {
          username: body.username,
          displayName: body.displayName,
          role: body.role as AdminRole,
          requiresTotp: body.requiresTotp,
          totpSecret: body.totpSecret,
          isActive: body.isActive
        },
        create: {
          telegramId: body.telegramId,
          username: body.username,
          displayName: body.displayName,
          role: body.role as AdminRole,
          requiresTotp: body.requiresTotp,
          totpSecret: body.totpSecret,
          isActive: body.isActive
        }
      });
      await writeAudit(app.prisma, {
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        action: before ? "board.update" : "board.create",
        module: "board",
        targetType: "board_member",
        targetId: after.id,
        before,
        after,
        ipAddress: request.ip
      });
      return after;
    }
  );
};
