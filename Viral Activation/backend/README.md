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

## User Game API (integrated)

User mini-game API đã được tích hợp thẳng vào Fastify backend (không chạy server riêng):

- `src/modules/app-game/constants.ts`: hằng số và quiz bank.
- `src/modules/app-game/state.ts`: game state + reward logic.
- `src/modules/app-game/store.ts`: load/persist session state qua Prisma.
- `src/modules/app-game/routes.ts`: endpoint Spin/Quiz/Penalty/Earn/Referral/Session.

State user được lưu trong DB (`AppGameState`) + đồng bộ `AppUser.kick` + ghi `KickLedger`.

## Sync World Cup fixtures from WC26 static source

- Kiểm tra dữ liệu trước (không ghi DB):
  - `npm run sync:fixtures:wc26 --workspace backend -- --dry-run`
- Đồng bộ vào DB (upsert theo `groupCode + home/away + kickoffAt`):
  - `npm run sync:fixtures:wc26 --workspace backend`
- Ép thay thế toàn bộ fixtures của các bảng import (A-L + knockout):
  - `npm run sync:fixtures:wc26 --workspace backend -- --replace`
- Dùng URL khác:
  - `npm run sync:fixtures:wc26 --workspace backend -- --url https://example.com`

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
- `GET /api/v1/system/news/status`
- `POST /api/v1/system/news/sync`
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
- `GET /api/v1/app/news`
- `POST /api/session/init`
- `POST /api/session/sync`
- `GET /api/spin/state`
- `POST /api/spin/unlock`
- `POST /api/spin/roll`
- `GET /api/quiz/daily`
- `POST /api/quiz/answer`
- `POST /api/quiz/finalize`
- `GET /api/penalty/daily`
- `POST /api/penalty/start`
- `POST /api/penalty/shot`
- `POST /api/penalty/finalize`
- `GET /api/earn/tasks/state`
- `POST /api/earn/tasks/claim`
- `GET /api/referral/state`
- `POST /api/referral/boost`
