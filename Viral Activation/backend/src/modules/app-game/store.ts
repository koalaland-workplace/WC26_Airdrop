import { randomUUID } from "node:crypto";
import type { AppUser, Prisma, PrismaClient } from "@prisma/client";
import { createDefaultState, mergePersistedState, type AppGameState } from "./state.js";

const SESSION_ID_MAX_LENGTH = 128;

export interface LoadedGameSession {
  user: AppUser;
  state: AppGameState;
}

export interface SessionTelegramIdentity {
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

type PrismaStoreClient = Pick<
  PrismaClient,
  "appGameState" | "appUser" | "referralEvent" | "kickLedger"
>;

interface LedgerWrite {
  delta: number;
  reason: string;
  source: string;
}

function sanitizeSessionId(value: unknown): string | null {
  const sessionId = String(value ?? "").trim();
  if (sessionId.length < 8) return null;
  if (sessionId.length > SESSION_ID_MAX_LENGTH) return null;
  return sessionId;
}

function sanitizeNationCode(value: unknown, fallback = "VN"): string {
  const nationCode = String(value ?? "")
    .trim()
    .toUpperCase();
  if (/^[A-Z]{2,3}$/.test(nationCode)) return nationCode;
  return fallback;
}

function createGuestUsername(sessionId: string): string {
  return `guest_${sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "wc26"}`;
}

function sanitizeTelegramId(value: unknown): string | null {
  const telegramId = String(value ?? "").trim();
  if (!/^\d{5,20}$/.test(telegramId)) return null;
  return telegramId;
}

function sanitizeUsername(value: unknown): string | null {
  const username = String(value ?? "")
    .trim()
    .replace(/^@+/, "");
  if (username.length < 2 || username.length > 64) return null;
  return username;
}

function normalizeTelegramIdentity(input?: SessionTelegramIdentity | null): SessionTelegramIdentity | null {
  if (!input) return null;
  const telegramId = sanitizeTelegramId(input.telegramId);
  if (!telegramId) return null;
  return {
    telegramId,
    username: sanitizeUsername(input.username ?? null),
    firstName: sanitizeUsername(input.firstName ?? null),
    lastName: sanitizeUsername(input.lastName ?? null)
  };
}

function resolveTelegramDisplayUsername(identity: SessionTelegramIdentity, fallback: string): string {
  if (identity.username) return identity.username;
  if (identity.firstName && identity.lastName) return `${identity.firstName}_${identity.lastName}`.toLowerCase();
  if (identity.firstName) return identity.firstName.toLowerCase();
  if (identity.lastName) return identity.lastName.toLowerCase();
  return fallback;
}

async function linkReferralOnCreate(
  tx: PrismaStoreClient,
  invitedUser: AppUser,
  referralSessionId?: string
): Promise<void> {
  const inviterSessionId = sanitizeSessionId(referralSessionId);
  if (!inviterSessionId) return;

  const inviterState = await tx.appGameState.findUnique({
    where: { sessionId: inviterSessionId },
    include: { user: true }
  });
  if (!inviterState) return;
  if (inviterState.user.id === invitedUser.id) return;

  const level1Exists = await tx.referralEvent.findFirst({
    where: {
      inviterUserId: inviterState.user.id,
      invitedUserId: invitedUser.id,
      level: 1
    },
    select: { id: true }
  });
  if (!level1Exists) {
    await tx.referralEvent.create({
      data: {
        inviterUserId: inviterState.user.id,
        invitedUserId: invitedUser.id,
        level: 1,
        status: "registered"
      }
    });
  }

  const parentReferral = await tx.referralEvent.findFirst({
    where: {
      invitedUserId: inviterState.user.id,
      level: 1
    },
    orderBy: { createdAt: "desc" },
    select: {
      inviterUserId: true
    }
  });
  if (!parentReferral) return;
  if (parentReferral.inviterUserId === invitedUser.id) return;

  const level2Exists = await tx.referralEvent.findFirst({
    where: {
      inviterUserId: parentReferral.inviterUserId,
      invitedUserId: invitedUser.id,
      level: 2
    },
    select: { id: true }
  });
  if (level2Exists) return;

  await tx.referralEvent.create({
    data: {
      inviterUserId: parentReferral.inviterUserId,
      invitedUserId: invitedUser.id,
      level: 2,
      status: "registered"
    }
  });
}

async function buildSessionFromRow(
  prisma: PrismaStoreClient,
  row: { sessionId: string; state: Prisma.JsonValue; user: AppUser }
): Promise<LoadedGameSession> {
  const state = mergePersistedState(row.state, row.sessionId, row.user.kick, row.user.nationCode ?? "VN");
  await syncReferralCounters(prisma, row.user.id, state);
  return {
    user: row.user,
    state
  };
}

async function createFreshSession(
  tx: PrismaStoreClient,
  preferredSessionId?: string,
  referralSessionId?: string,
  telegramIdentity?: SessionTelegramIdentity | null
): Promise<LoadedGameSession> {
  const sessionId = preferredSessionId ?? randomUUID();
  const fallbackUsername = createGuestUsername(sessionId);
  const telegram = normalizeTelegramIdentity(telegramIdentity);
  const user = await tx.appUser.create({
    data: {
      telegramId: telegram?.telegramId ?? null,
      username: telegram ? resolveTelegramDisplayUsername(telegram, fallbackUsername) : fallbackUsername,
      nationCode: "VN"
    }
  });
  const state = createDefaultState(sessionId, user.kick, user.nationCode);
  await tx.appGameState.create({
    data: {
      userId: user.id,
      sessionId,
      state: state as unknown as Prisma.InputJsonValue
    }
  });
  await linkReferralOnCreate(tx, user, referralSessionId);
  return { user, state };
}

async function bindTelegramIdentityToSession(
  tx: PrismaStoreClient,
  row: { sessionId: string; state: Prisma.JsonValue; user: AppUser },
  telegramIdentity: SessionTelegramIdentity
): Promise<{ sessionId: string; state: Prisma.JsonValue; user: AppUser }> {
  const normalized = normalizeTelegramIdentity(telegramIdentity);
  if (!normalized) return row;

  const nextUsername = resolveTelegramDisplayUsername(normalized, row.user.username ?? createGuestUsername(row.sessionId));
  if (row.user.telegramId === normalized.telegramId) {
    if (row.user.username === nextUsername) return row;
    const updated = await tx.appUser.update({
      where: { id: row.user.id },
      data: { username: nextUsername }
    });
    return {
      ...row,
      user: updated
    };
  }

  const existingByTelegram = await tx.appUser.findUnique({
    where: { telegramId: normalized.telegramId },
    include: { gameState: true }
  });

  if (!existingByTelegram) {
    const updated = await tx.appUser.update({
      where: { id: row.user.id },
      data: {
        telegramId: normalized.telegramId,
        username: nextUsername
      }
    });
    return {
      ...row,
      user: updated
    };
  }

  const mergedKick = Math.max(existingByTelegram.kick, row.user.kick);
  const mergedTickets = Math.max(existingByTelegram.mysteryTickets, row.user.mysteryTickets);
  const shouldUpdateCanonical =
    existingByTelegram.username !== nextUsername ||
    mergedKick !== existingByTelegram.kick ||
    mergedTickets !== existingByTelegram.mysteryTickets;

  const canonicalUser = shouldUpdateCanonical
    ? await tx.appUser.update({
        where: { id: existingByTelegram.id },
        data: {
          username: nextUsername,
          kick: mergedKick,
          mysteryTickets: mergedTickets
        }
      })
    : existingByTelegram;

  if (existingByTelegram.gameState) {
    return {
      sessionId: existingByTelegram.gameState.sessionId,
      state: existingByTelegram.gameState.state,
      user: canonicalUser
    };
  }

  const migratedState = mergePersistedState(
    row.state,
    row.sessionId,
    canonicalUser.kick,
    canonicalUser.nationCode ?? row.user.nationCode ?? "VN"
  );

  await tx.appGameState.create({
    data: {
      userId: canonicalUser.id,
      sessionId: row.sessionId,
      state: migratedState as unknown as Prisma.InputJsonValue
    }
  });

  return {
    sessionId: row.sessionId,
    state: migratedState as unknown as Prisma.JsonValue,
    user: canonicalUser
  };
}

export async function getOrCreateGameSession(
  prisma: PrismaClient,
  requestedSessionId?: string | null,
  referralSessionId?: string | null,
  telegramIdentity?: SessionTelegramIdentity | null
): Promise<LoadedGameSession> {
  const telegram = normalizeTelegramIdentity(telegramIdentity);
  const sessionId = sanitizeSessionId(requestedSessionId);
  if (sessionId) {
    const existing = await prisma.appGameState.findUnique({
      where: { sessionId },
      include: { user: true }
    });
    if (existing) {
      if (!telegram) {
        return buildSessionFromRow(prisma, existing);
      }
      const rebound = await prisma.$transaction((tx) => bindTelegramIdentityToSession(tx, existing, telegram));
      return buildSessionFromRow(prisma, rebound);
    }
  }

  if (telegram) {
    const existingByTelegram = await prisma.appUser.findUnique({
      where: { telegramId: telegram.telegramId },
      include: { gameState: true }
    });

    if (existingByTelegram) {
      const nextUsername = resolveTelegramDisplayUsername(telegram, existingByTelegram.username ?? `tg_${telegram.telegramId}`);
      const updatedUser =
        nextUsername !== existingByTelegram.username
          ? await prisma.appUser.update({
              where: { id: existingByTelegram.id },
              data: { username: nextUsername }
            })
          : existingByTelegram;

      if (existingByTelegram.gameState) {
        return buildSessionFromRow(prisma, {
          sessionId: existingByTelegram.gameState.sessionId,
          state: existingByTelegram.gameState.state,
          user: updatedUser
        });
      }

      const newSessionId = sessionId ?? randomUUID();
      const state = createDefaultState(newSessionId, updatedUser.kick, updatedUser.nationCode);
      await prisma.appGameState.create({
        data: {
          userId: updatedUser.id,
          sessionId: newSessionId,
          state: state as unknown as Prisma.InputJsonValue
        }
      });
      return {
        user: updatedUser,
        state
      };
    }
  }

  return prisma.$transaction(async (tx) =>
    createFreshSession(tx, sessionId ?? undefined, referralSessionId ?? undefined, telegram)
  );
}

export async function persistGameSessionWithClient(
  client: PrismaStoreClient,
  session: LoadedGameSession,
  ledger?: LedgerWrite
): Promise<void> {
  await client.appUser.update({
    where: { id: session.user.id },
    data: {
      kick: Math.max(0, Math.floor(Number(session.state.kick) || 0)),
      mysteryTickets: Math.max(0, Math.floor(Number(session.state.spin.tickets) || 0)),
      nationCode: sanitizeNationCode(session.state.nation.code, session.user.nationCode ?? "VN")
    }
  });

  await client.appGameState.upsert({
    where: { userId: session.user.id },
    update: {
      sessionId: session.state.sessionId,
      state: session.state as unknown as Prisma.InputJsonValue
    },
    create: {
      userId: session.user.id,
      sessionId: session.state.sessionId,
      state: session.state as unknown as Prisma.InputJsonValue
    }
  });

  if (ledger && Number.isFinite(ledger.delta) && ledger.delta !== 0) {
    await client.kickLedger.create({
      data: {
        userId: session.user.id,
        delta: Math.floor(ledger.delta),
        reason: ledger.reason,
        source: ledger.source
      }
    });
  }
}

export async function persistGameSession(
  prisma: PrismaClient,
  session: LoadedGameSession,
  ledger?: LedgerWrite
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await persistGameSessionWithClient(tx, session, ledger);
  });
  session.user.kick = session.state.kick;
  session.user.nationCode = sanitizeNationCode(session.state.nation.code, session.user.nationCode ?? "VN");
}

export async function syncReferralCounters(
  prisma: PrismaStoreClient,
  userId: string,
  state: AppGameState
): Promise<void> {
  const [f1Registered, f1Active7, f2Registered, f2Active7] = await Promise.all([
    prisma.referralEvent.count({
      where: { inviterUserId: userId, level: 1 }
    }),
    prisma.referralEvent.count({
      where: { inviterUserId: userId, level: 1, status: "active_7d" }
    }),
    prisma.referralEvent.count({
      where: { inviterUserId: userId, level: 2 }
    }),
    prisma.referralEvent.count({
      where: { inviterUserId: userId, level: 2, status: "active_7d" }
    })
  ]);

  state.referral.f1Registered = f1Registered;
  state.referral.f1Active7 = f1Active7;
  state.referral.f2Registered = f2Registered;
  state.referral.f2Active7 = f2Active7;
}
