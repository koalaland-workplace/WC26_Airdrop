import type { AdminRole } from "@prisma/client";

export type Permission =
  | "users.manage"
  | "kick.grant"
  | "kick.adjust"
  | "config.spin"
  | "config.penalty"
  | "missions.manage"
  | "announcements.manage"
  | "economy.manage"
  | "board.manage"
  | "settings.manage"
  | "api.manage"
  | "dashboard.read"
  | "reports.read"
  | "pique.logs.read";

const allPermissions: Permission[] = [
  "users.manage",
  "kick.grant",
  "kick.adjust",
  "config.spin",
  "config.penalty",
  "missions.manage",
  "announcements.manage",
  "economy.manage",
  "board.manage",
  "settings.manage",
  "api.manage",
  "dashboard.read",
  "reports.read",
  "pique.logs.read"
];

const rolePermissions: Record<AdminRole, Set<Permission>> = {
  owner: new Set(allPermissions),
  admin: new Set([
    "users.manage",
    "kick.grant",
    "kick.adjust",
    "config.spin",
    "config.penalty",
    "missions.manage",
    "announcements.manage",
    "economy.manage",
    "settings.manage",
    "dashboard.read",
    "reports.read",
    "pique.logs.read"
  ]),
  moderator: new Set(["users.manage", "missions.manage", "announcements.manage", "dashboard.read"]),
  support: new Set(["users.manage", "announcements.manage", "dashboard.read"]),
  analyst: new Set(["dashboard.read", "reports.read"])
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return rolePermissions[role].has(permission);
}
