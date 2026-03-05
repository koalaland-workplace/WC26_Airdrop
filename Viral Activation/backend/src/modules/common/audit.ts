import type { AdminRole, PrismaClient } from "@prisma/client";

interface AuditInput {
  actorId?: string;
  actorRole?: AdminRole;
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
}

export async function writeAudit(prisma: PrismaClient, data: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: data.actorId,
      actorRole: data.actorRole,
      action: data.action,
      module: data.module,
      targetType: data.targetType,
      targetId: data.targetId,
      before: data.before as never,
      after: data.after as never,
      ipAddress: data.ipAddress
    }
  });
}
