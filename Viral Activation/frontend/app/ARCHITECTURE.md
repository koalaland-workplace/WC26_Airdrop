# Frontend Users Standard

## Tech Baseline

- Framework: Svelte + TypeScript
- Build tool: Vite
- UI layer: `.svelte` files using `<script lang="ts">`
- Business logic + API calls: `.ts` files in `src/lib` or `src/modules`
- State: Svelte stores in `.ts`
- Styling: CSS with design tokens (no heavy UI framework)

## Rule Set

- Every new user screen must be typed end-to-end.
- Request/response payloads must have explicit interfaces.
- UI components should avoid direct API calls when possible.
- Domain logic should be reusable from `.ts` modules.
- Keep app-level state centralized in stores.

## Suggested Folder Layout

```txt
src/
  lib/
    api/
      http.ts
    modules/
      <feature>/
        api.ts
        types.ts
    stores/
      <feature>.store.ts
    components/
      *.svelte
    pages/
      *.svelte
```
