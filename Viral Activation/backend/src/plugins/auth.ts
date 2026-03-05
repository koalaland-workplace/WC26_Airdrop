import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { AdminRole } from "@prisma/client";
import { hasPermission, type Permission } from "../modules/common/permissions.js";
import type { AccessTokenPayload } from "../modules/common/types.js";
import type { FastifyReply, FastifyRequest } from "fastify";

export const authPlugin = fp(async (app) => {
  await app.register(fastifyJwt, { secret: app.appConfig.jwtAccessSecret });

  app.decorateRequest("auth");

  app.decorate("requireAuth", async (request: FastifyRequest) => {
    await request.jwtVerify();
    request.auth = request.user as AccessTokenPayload;
  });

  app.decorate("requirePermission", (permission: Permission) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      await request.jwtVerify();
      request.auth = request.user as AccessTokenPayload;
      const role = request.auth.role as AdminRole;
      if (!hasPermission(role, permission)) {
        throw app.httpErrors.forbidden("Permission denied");
      }
    };
  });
});

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission: (
      permission: Permission
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
