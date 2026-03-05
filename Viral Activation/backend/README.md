# Backend (Phase 1 Admin API)

Fastify + TypeScript + Prisma + Redis backend cho WC26 NFT FANTASY admin.

## Implemented in this phase

- Telegram login whitelist (`board_members`)
- TOTP for `owner`/`admin`
- JWT access (15m) + refresh (7d, rotate on use)
- RBAC matrix theo role
- Audit log cho mọi thao tác mutate
- Dashboard metrics API
- Users management + status
- KICK ledger + manual adjust
- Spin/Penalty/Missions/Settings/API config endpoints
- Announcements API
- PIQUE conversation logs API (owner/admin only)

## Local run

1. Cài dependencies:
   - `npm install --workspace backend` (từ thư mục `Viral Activation`)
2. Tạo env:
   - `cp backend/.env.example backend/.env`
3. Generate Prisma:
   - `npm run db:generate --workspace backend`
4. Migrate DB:
   - `npm run db:migrate --workspace backend`
5. Seed mẫu:
   - `npm run db:seed --workspace backend`
6. Chạy dev:
   - `npm run dev --workspace backend`

## Important endpoints

- `POST /api/v1/auth/telegram/login`
- `POST /api/v1/auth/totp/verify`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/dashboard/metrics`
- `GET /api/v1/users`
- `PATCH /api/v1/users/:id/status`
- `POST /api/v1/kick-ledger/adjust`
- `GET|PUT /api/v1/config/:key`
- `GET|POST /api/v1/announcements`
- `GET|POST /api/v1/pique/conversations`
- `GET /api/v1/system/health`
- `GET /api/v1/system/queue`
- `GET /api/v1/realtime/feed` (SSE)
- `GET /api/v1/realtime/health` (SSE)
- `GET /api/v1/realtime/queue` (SSE)
- `GET /api/v1/audit-logs`
- `GET /api/v1/reports/kick-ledger/summary`
- `GET /api/v1/reports/kick-ledger/export.csv`
- `GET /api/v1/reports/audit-logs/export.csv`
- `GET /api/v1/referrals/metrics`
- `GET /api/v1/referrals/chains`
- `GET /api/v1/referrals/flagged`
- `GET|PUT /api/v1/referrals/config`
- `GET /api/v1/matches`
- `POST /api/v1/matches/upsert`
- `PATCH /api/v1/matches/:id/status`
- `GET /api/v1/missions`
- `POST /api/v1/missions/upsert`
- `PATCH /api/v1/missions/:id/toggle`
