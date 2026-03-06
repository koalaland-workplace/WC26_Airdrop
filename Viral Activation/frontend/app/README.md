# WC26 User Frontend

Users frontend now follows `Svelte + TypeScript + Vite`.

## Quick Start

```bash
npm install
npm run dev
```

## Team Rules

- UI layer: `.svelte` files with `<script lang="ts">`
- Business logic/API: `.ts` files in `src/lib` or `src/modules`
- State: Svelte stores (`.ts`)
- Style: CSS with design tokens, no heavy UI framework
- Every new user flow must be typed end-to-end

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set API base URL (optional):

```env
VITE_API_BASE=
```
