# WC26_TeleCampaign

Monorepo khởi tạo cho WC26 TeleCampaign, gồm prototype hiện tại + khung phát triển fullstack.

## Structure

- `frontend/prototypes/` : toàn bộ file HTML prototype và asset hiện tại (đã chuyển từ Downloads).
- `frontend/app/` : app frontend chính thức của mini app (legacy placeholder).
- `frontend/admin/` : admin frontend mới (Svelte + TypeScript).
- `backend/` : admin/backend API mới (Fastify + Prisma + Redis).
- `shared/` : schema, constants, DTO dùng chung frontend/backend.
- `docs/` : tài liệu chiến lược, policy, roadmap.
- `infra/` : docker, deployment, env templates.
- `scripts/` : script migrate/build/devops.

## Current Main Prototype

- `frontend/prototypes/WC26_Community_Platform.html`

## Workspace commands

- `npm run dev:backend`
- `npm run dev:admin`
- `npm run build`
- `npm run check`
