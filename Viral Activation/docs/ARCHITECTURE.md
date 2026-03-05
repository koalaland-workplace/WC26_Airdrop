# Architecture Draft (Admin Phase 1)

## Stack

- Frontend Admin: Svelte + TypeScript
- Backend API: Fastify + TypeScript
- DB: PostgreSQL + Prisma ORM
- Cache/ephemeral auth: Redis
- Realtime: WebSocket/SSE feed hooks

## Domain boundaries

- Identity & Session (Telegram whitelist + TOTP + JWT rotate)
- Admin Governance (RBAC, board member management, audit)
- Economy (KICK ledger, spin/penalty config, token settings)
- Content Ops (announcements, missions/social config)
- AI Ops (PIQUE prompt/rules + conversation logs)
- Compliance (anti-sybil pipeline + reports)

## Data flow

Mini App + Admin Frontend -> Fastify API -> Domain Services -> PostgreSQL/Redis -> Metrics & Audit

## RBAC matrix

- Owner: full access
- Admin: all except board/api key ownership
- Moderator: users + missions + announcements + dashboard read
- Support: users + announcements + dashboard read
- Analyst: dashboard/read/export only
