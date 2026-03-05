import type { FastifyPluginAsync } from "fastify";

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/api/v1/dashboard/metrics",
    { preHandler: app.requirePermission("dashboard.read") },
    async () => {
      const [totalUsers, onlineUsers, totalKickAgg, pendingReviews] = await Promise.all([
        app.prisma.appUser.count(),
        app.prisma.appUser.count({ where: { status: "active" } }),
        app.prisma.appUser.aggregate({ _sum: { kick: true } }),
        app.prisma.auditLog.count({
          where: {
            module: "compliance",
            action: { startsWith: "review.pending" }
          }
        })
      ]);
      return {
        totalUsers,
        onlineUsers,
        totalKick: totalKickAgg._sum.kick ?? 0,
        pendingReviews
      };
    }
  );
};
