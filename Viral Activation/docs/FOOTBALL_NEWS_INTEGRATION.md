# Football News Integration Design

## Goal

Provide reliable football news and match updates for WC26 app/admin while keeping source-of-truth data deterministic and auditable.

## Principles

- Canonical match/news facts come from external football APIs, not from AI.
- PIQUE is optional enrichment only (summary, translation, tagging), never source-of-truth.
- Frontend reads from our backend/DB only; no direct provider calls from clients.
- Integration must degrade gracefully if provider is down.

## High-Level Data Flow

1. Admin saves provider config in `feature_config.key = "api"` under `footballNews`.
2. A backend sync worker (cron/queue) reads this config.
3. Worker fetches provider endpoints (`news`, `fixtures`) with API key header.
4. Worker normalizes records into internal tables (`news_items`, `match_fixture` updates).
5. Optional async PIQUE enrichment adds summary/tags/sentiment fields.
6. App/Admin consume internal APIs from our DB.

## Config Shape (feature_config.api.value.footballNews)

```json
{
  "enabled": false,
  "provider": "api-football",
  "baseUrl": "https://v3.football.api-sports.io",
  "apiKey": "",
  "keyHeader": "x-apisports-key",
  "endpoints": {
    "news": "/news",
    "fixtures": "/fixtures"
  },
  "defaults": {
    "competitions": ["FIFA-WC"],
    "language": "en",
    "timezone": "UTC"
  },
  "polling": {
    "intervalMinutes": 10,
    "timeoutMs": 12000
  }
}
```

## Recommended Backend Next Steps

1. Add `news_items` table with `providerId` unique key for dedupe.
2. Build sync job:
   - Skip when `enabled=false`
   - Retry with backoff
   - Idempotent upsert by provider id
3. Add internal APIs:
   - `GET /api/v1/app/news`
   - `GET /api/v1/app/matches/live`
4. Add admin endpoint for manual trigger:
   - `POST /api/v1/system/news/sync` (permission `api.manage`)
5. Emit audit logs for config changes and manual sync triggers.

## Ops Notes

- Keep provider API key only in admin config and server-side requests.
- Use timeout + rate limit to protect backend worker.
- Monitor last successful sync timestamp and stale-data alerts.
