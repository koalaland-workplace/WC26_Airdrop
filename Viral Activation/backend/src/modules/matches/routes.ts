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

const appListSchema = z.object({
  groupCode: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(100),
  offset: z.coerce.number().min(0).default(0)
});

const appGroupsSchema = z.object({
  includeFixtures: z.coerce.boolean().default(true),
  fixtureLimit: z.coerce.number().int().min(1).max(200).default(40)
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

type GroupStandingRow = {
  team: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

function sortStandings(rows: GroupStandingRow[]): GroupStandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    if (a.ga !== b.ga) return a.ga - b.ga;
    return a.team.localeCompare(b.team);
  });
}

export const matchesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/app/matches", async (request) => {
    const q = appListSchema.parse(request.query);
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

  app.get("/api/v1/app/groups", async (request) => {
    const q = appGroupsSchema.parse(request.query);
    const allFixtures = await app.prisma.matchFixture.findMany({
      orderBy: [{ groupCode: "asc" }, { kickoffAt: "asc" }],
      take: 3000
    });

    const now = Date.now();
    const grouped = new Map<
      string,
      {
        fixtures: Array<(typeof allFixtures)[number]>;
        teams: Set<string>;
      }
    >();

    for (const fixture of allFixtures) {
      const key = fixture.groupCode || "A";
      const bucket = grouped.get(key) ?? { fixtures: [], teams: new Set<string>() };
      bucket.fixtures.push(fixture);
      bucket.teams.add(fixture.homeNation);
      bucket.teams.add(fixture.awayNation);
      grouped.set(key, bucket);
    }

    const groups = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupCode, bucket]) => {
        const standingsMap = new Map<string, GroupStandingRow>();
        for (const team of bucket.teams) {
          standingsMap.set(team, {
            team,
            played: 0,
            win: 0,
            draw: 0,
            loss: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0
          });
        }

        let finished = 0;
        let live = 0;
        let scheduled = 0;

        for (const fixture of bucket.fixtures) {
          const homeRow = standingsMap.get(fixture.homeNation);
          const awayRow = standingsMap.get(fixture.awayNation);
          const hasScore = fixture.homeScore !== null && fixture.awayScore !== null;

          if (fixture.status === "live") {
            live += 1;
          } else if (fixture.status === "finished" || hasScore) {
            finished += 1;
          } else {
            scheduled += 1;
          }

          if (!hasScore || !homeRow || !awayRow) continue;
          const home = fixture.homeScore ?? 0;
          const away = fixture.awayScore ?? 0;

          homeRow.played += 1;
          awayRow.played += 1;
          homeRow.gf += home;
          homeRow.ga += away;
          awayRow.gf += away;
          awayRow.ga += home;

          if (home > away) {
            homeRow.win += 1;
            awayRow.loss += 1;
            homeRow.points += 3;
          } else if (home < away) {
            awayRow.win += 1;
            homeRow.loss += 1;
            awayRow.points += 3;
          } else {
            homeRow.draw += 1;
            awayRow.draw += 1;
            homeRow.points += 1;
            awayRow.points += 1;
          }
        }

        const standings = sortStandings(
          [...standingsMap.values()].map((row) => ({
            ...row,
            gd: row.gf - row.ga
          }))
        );

        const nextFixture =
          bucket.fixtures.find((fixture) => new Date(fixture.kickoffAt).getTime() > now) ?? null;

        return {
          groupCode,
          teams: [...bucket.teams].sort((a, b) => a.localeCompare(b)),
          summary: {
            totalFixtures: bucket.fixtures.length,
            finished,
            live,
            scheduled
          },
          nextKickoffAt: nextFixture?.kickoffAt ?? null,
          standings,
          fixtures: q.includeFixtures ? bucket.fixtures.slice(0, q.fixtureLimit) : []
        };
      });

    return {
      items: groups,
      totalGroups: groups.length,
      totalFixtures: allFixtures.length
    };
  });

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
