import { createHash } from "node:crypto";
import type { AdminRole } from "@prisma/client";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { writeAudit } from "../common/audit.js";

const footballNewsSchema = z.object({
  enabled: z.coerce.boolean().default(false),
  provider: z.string().min(1).default("api-football"),
  baseUrl: z.string().url().default("https://v3.football.api-sports.io"),
  apiKey: z.string().default(""),
  keyHeader: z.string().min(1).default("x-apisports-key"),
  endpoints: z
    .object({
      news: z.string().min(1).default("/news"),
      fixtures: z.string().min(1).default("/fixtures")
    })
    .default({ news: "/news", fixtures: "/fixtures" }),
  defaults: z
    .object({
      competitions: z.array(z.string().min(1)).default(["FIFA-WC"]),
      language: z.string().min(1).default("en"),
      timezone: z.string().min(1).default("UTC")
    })
    .default({ competitions: ["FIFA-WC"], language: "en", timezone: "UTC" }),
  polling: z
    .object({
      intervalMinutes: z.coerce.number().int().min(1).max(1440).default(10),
      timeoutMs: z.coerce.number().int().min(1000).max(60000).default(12000)
    })
    .default({ intervalMinutes: 10, timeoutMs: 12000 })
});

const appNewsQuerySchema = z.object({
  q: z.string().optional(),
  language: z.string().optional(),
  competition: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

const manualSyncSchema = z.object({
  force: z.boolean().optional()
});

type FootballNewsConfig = z.infer<typeof footballNewsSchema>;

type SyncState = {
  running: boolean;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  nextRunAt: string | null;
  lastResult: {
    provider: string;
    requestUrl: string;
    fetched: number;
    stored: number;
    completedAt: string;
    reason: "startup" | "schedule" | "manual";
  } | null;
};

type NormalizedNewsItem = {
  providerItemId: string;
  title: string;
  summary: string | null;
  content: string | null;
  url: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  language: string | null;
  competition: string | null;
  publishedAt: Date;
  rawPayload: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toDateOrUndefined(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function firstString(record: Record<string, unknown>, paths: string[]): string | null {
  for (const path of paths) {
    const segments = path.split(".");
    let cursor: unknown = record;
    let missing = false;
    for (const segment of segments) {
      if (!isRecord(cursor) || !(segment in cursor)) {
        missing = true;
        break;
      }
      cursor = cursor[segment];
    }
    if (missing || cursor === undefined || cursor === null) continue;
    if (typeof cursor === "string" && cursor.trim().length > 0) return cursor.trim();
    if (typeof cursor === "number" && Number.isFinite(cursor)) return String(cursor);
  }
  return null;
}

function firstDate(record: Record<string, unknown>, paths: string[]): Date | null {
  for (const path of paths) {
    const value = firstString(record, [path]);
    if (!value) continue;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function extractArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }
  if (!isRecord(payload)) return [];

  const candidates: unknown[] = [
    payload.response,
    payload.articles,
    payload.items,
    payload.news,
    payload.data
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }
    if (isRecord(candidate) && Array.isArray(candidate.items)) {
      return candidate.items.filter(isRecord);
    }
  }
  return [];
}

function normalizeNewsRecord(raw: Record<string, unknown>, config: FootballNewsConfig): NormalizedNewsItem | null {
  const title = firstString(raw, ["title", "headline", "name"]);
  if (!title) return null;

  const publishedAt = firstDate(raw, [
    "publishedAt",
    "published_at",
    "date",
    "datetime",
    "createdAt",
    "created_at",
    "time"
  ]) ?? new Date();

  const url = firstString(raw, ["url", "link", "source_url"]);
  const providerItemId =
    firstString(raw, ["id", "news_id", "uuid", "slug", "article_id"]) ??
    createHash("sha1")
      .update(`${config.provider}:${title}:${url ?? ""}:${publishedAt.toISOString()}`)
      .digest("hex");

  const summary = firstString(raw, ["summary", "description", "snippet", "short_description"]);
  const content = firstString(raw, ["content", "body", "text"]);
  const imageUrl = firstString(raw, ["image", "imageUrl", "urlToImage", "thumbnail"]);
  const sourceName = firstString(raw, ["source.name", "source", "provider", "publisher"]);
  const language = firstString(raw, ["language", "lang"]) ?? config.defaults.language;
  const competition = firstString(raw, ["competition", "competition.name", "league", "league.name"]);

  return {
    providerItemId,
    title,
    summary,
    content,
    url,
    imageUrl,
    sourceName,
    language,
    competition,
    publishedAt,
    rawPayload: raw
  };
}

async function loadFootballNewsConfig(app: FastifyInstance): Promise<FootballNewsConfig> {
  const row = await app.prisma.featureConfig.findUnique({ where: { key: "api" } });
  const value = isRecord(row?.value) ? row.value : {};
  const footballNews = isRecord(value.footballNews) ? value.footballNews : {};
  const parsed = footballNewsSchema.safeParse(footballNews);
  if (parsed.success) return parsed.data;
  app.log.warn({ err: parsed.error }, "Invalid footballNews config detected, fallback to defaults");
  return footballNewsSchema.parse({});
}

function buildNewsUrl(config: FootballNewsConfig): URL {
  const url = new URL(normalizePath(config.endpoints.news), config.baseUrl);
  if (config.defaults.competitions.length > 0) {
    url.searchParams.set("competitions", config.defaults.competitions.join(","));
    if (config.defaults.competitions.length === 1) {
      url.searchParams.set("competition", config.defaults.competitions[0]);
    }
  }
  url.searchParams.set("language", config.defaults.language);
  url.searchParams.set("lang", config.defaults.language);
  url.searchParams.set("timezone", config.defaults.timezone);
  return url;
}

async function fetchProviderNews(config: FootballNewsConfig): Promise<{
  requestUrl: string;
  items: NormalizedNewsItem[];
  fetched: number;
}> {
  const url = buildNewsUrl(config);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.polling.timeoutMs);

  const headers: Record<string, string> = {
    Accept: "application/json"
  };
  if (config.apiKey.trim()) {
    headers[config.keyHeader] = config.apiKey.trim();
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = (await response.text()).slice(0, 400);
    throw new Error(`Football provider request failed (${response.status}): ${text || "no message"}`);
  }

  const payload = (await response.json()) as unknown;
  const records = extractArray(payload);
  const mapped = records
    .map((item) => normalizeNewsRecord(item, config))
    .filter((item): item is NormalizedNewsItem => item !== null);

  const deduped = new Map<string, NormalizedNewsItem>();
  for (const item of mapped) {
    deduped.set(item.providerItemId, item);
  }

  return {
    requestUrl: url.toString(),
    items: [...deduped.values()],
    fetched: records.length
  };
}

async function upsertNewsItems(app: FastifyInstance, config: FootballNewsConfig, items: NormalizedNewsItem[]) {
  let stored = 0;
  for (const item of items) {
    await app.prisma.newsItem.upsert({
      where: {
        provider_providerItemId: {
          provider: config.provider,
          providerItemId: item.providerItemId
        }
      },
      update: {
        title: item.title,
        summary: item.summary,
        content: item.content,
        url: item.url,
        imageUrl: item.imageUrl,
        sourceName: item.sourceName,
        language: item.language,
        competition: item.competition,
        publishedAt: item.publishedAt,
        fetchedAt: new Date(),
        rawPayload: item.rawPayload as never
      },
      create: {
        provider: config.provider,
        providerItemId: item.providerItemId,
        title: item.title,
        summary: item.summary,
        content: item.content,
        url: item.url,
        imageUrl: item.imageUrl,
        sourceName: item.sourceName,
        language: item.language,
        competition: item.competition,
        publishedAt: item.publishedAt,
        rawPayload: item.rawPayload as never
      }
    });
    stored += 1;
  }
  return stored;
}

function addMinutesIso(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 6) return "***";
  return `${trimmed.slice(0, 3)}***${trimmed.slice(-3)}`;
}

export const newsRoutes: FastifyPluginAsync = async (app) => {
  const state: SyncState = {
    running: false,
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastError: null,
    nextRunAt: null,
    lastResult: null
  };
  let scheduleTimer: ReturnType<typeof setInterval> | null = null;

  const runSync = async (
    reason: "startup" | "schedule" | "manual",
    options?: {
      force?: boolean;
      actorId?: string;
      actorRole?: AdminRole;
      ipAddress?: string;
    }
  ) => {
    if (state.running) {
      if (reason === "manual") {
        throw app.httpErrors.conflict("News sync is already running");
      }
      return {
        ok: false,
        skipped: true,
        reason: "already_running"
      };
    }

    state.running = true;
    state.lastAttemptAt = new Date().toISOString();
    try {
      const config = await loadFootballNewsConfig(app);
      if (!config.enabled && !options?.force) {
        state.lastError = null;
        state.nextRunAt = null;
        return {
          ok: true,
          skipped: true,
          reason: "disabled",
          enabled: false
        };
      }

      const fetched = await fetchProviderNews(config);
      const stored = await upsertNewsItems(app, config, fetched.items);
      const completedAt = new Date().toISOString();

      state.lastSuccessAt = completedAt;
      state.lastError = null;
      state.nextRunAt = addMinutesIso(config.polling.intervalMinutes);
      state.lastResult = {
        provider: config.provider,
        requestUrl: fetched.requestUrl,
        fetched: fetched.fetched,
        stored,
        completedAt,
        reason
      };

      if (reason === "manual" && options?.actorId && options.actorRole) {
        await writeAudit(app.prisma, {
          actorId: options.actorId,
          actorRole: options.actorRole,
          action: "news.sync.manual",
          module: "news",
          targetType: "system",
          targetId: "football_news_sync",
          after: {
            provider: config.provider,
            requestUrl: fetched.requestUrl,
            fetched: fetched.fetched,
            stored
          },
          ipAddress: options.ipAddress
        });
      }

      return {
        ok: true,
        skipped: false,
        provider: config.provider,
        requestUrl: fetched.requestUrl,
        fetched: fetched.fetched,
        stored,
        nextRunAt: state.nextRunAt
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "News sync failed";
      state.lastError = message;
      try {
        const config = await loadFootballNewsConfig(app);
        state.nextRunAt = addMinutesIso(config.polling.intervalMinutes);
      } catch {
        state.nextRunAt = addMinutesIso(10);
      }
      if (reason === "manual") {
        throw app.httpErrors.badRequest(message);
      }
      return {
        ok: false,
        skipped: false,
        error: message,
        nextRunAt: state.nextRunAt
      };
    } finally {
      state.running = false;
    }
  };

  const tickSchedule = async () => {
    if (state.running) return;
    if (state.nextRunAt) {
      const nextRunMs = new Date(state.nextRunAt).getTime();
      if (!Number.isNaN(nextRunMs) && Date.now() < nextRunMs) return;
    }
    await runSync("schedule");
  };

  app.addHook("onReady", async () => {
    void runSync("startup");
    scheduleTimer = setInterval(() => {
      void tickSchedule();
    }, 30_000);
  });

  app.addHook("onClose", async () => {
    if (scheduleTimer) {
      clearInterval(scheduleTimer);
      scheduleTimer = null;
    }
  });

  app.get("/api/v1/app/news", async (request) => {
    const q = appNewsQuerySchema.parse(request.query);
    const from = toDateOrUndefined(q.from);
    const to = toDateOrUndefined(q.to);
    const where = {
      ...(q.language ? { language: q.language } : {}),
      ...(q.competition ? { competition: q.competition } : {}),
      ...(q.q
        ? {
            OR: [
              { title: { contains: q.q, mode: "insensitive" as const } },
              { summary: { contains: q.q, mode: "insensitive" as const } }
            ]
          }
        : {}),
      ...(from || to
        ? {
            publishedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {})
            }
          }
        : {})
    };

    const [items, total] = await Promise.all([
      app.prisma.newsItem.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: q.limit,
        skip: q.offset,
        select: {
          id: true,
          provider: true,
          title: true,
          summary: true,
          url: true,
          imageUrl: true,
          sourceName: true,
          language: true,
          competition: true,
          publishedAt: true,
          createdAt: true
        }
      }),
      app.prisma.newsItem.count({ where })
    ]);
    return { items, total };
  });

  app.get("/api/v1/system/news/status", { preHandler: app.requirePermission("api.manage") }, async () => {
    const config = await loadFootballNewsConfig(app);
    return {
      sync: state,
      config: {
        enabled: config.enabled,
        provider: config.provider,
        baseUrl: config.baseUrl,
        keyHeader: config.keyHeader,
        apiKeyMasked: maskApiKey(config.apiKey),
        hasApiKey: config.apiKey.trim().length > 0,
        endpoints: config.endpoints,
        defaults: config.defaults,
        polling: config.polling
      }
    };
  });

  app.post(
    "/api/v1/system/news/sync",
    { preHandler: app.requirePermission("api.manage") },
    async (request) => {
      const body = manualSyncSchema.parse(request.body ?? {});
      const result = await runSync("manual", {
        force: body.force,
        actorId: request.auth.sub,
        actorRole: request.auth.role,
        ipAddress: request.ip
      });
      return result;
    }
  );
};
