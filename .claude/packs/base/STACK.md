# Base pack: build scaffold and platform layer

Every app starts from this. It gives the app the npm scripts the harness relies on (`dev`, `check`, `test`, `test:e2e`, `build`), TypeScript strict mode, ESLint, Prettier, Vitest and Playwright, and the platform layer.

## The platform layer

All host capabilities (AI, documents, who is signed in, file downloads, consent state) are reached through `getPlatform()` in `src/platform/`. The page never calls `window.claude` or `/api/*` directly. Each build picks its adapter from `src/platform/adapters/` by `__TARGET__` (`artifact` or `web`); `startPlatform()` runs once in `src/main.ts`.

- Every getter resolves `null` when the host cannot do that thing. Features must render and explain themselves without it.
- New host capabilities are added to `Platform` first, then to every adapter in the same change, so the artifact and web builds stay interchangeable.
- Unit tests use `fakePlatform()` from `src/platform/fake.ts`; no test calls a real model or a real host.

## Files

| File | What |
| --- | --- |
| `vite.config.ts` | Two modes: `--mode artifact` (one file) and `--mode web` (multi-file site). Defines `__TARGET__` and `__APP_VERSION__` |
| `src/env.d.ts` | The shapes of the host runtime the page uses; extend as the app uses more |
| `src/platform/` | `types.ts`, `index.ts` (selection), `fake.ts` (tests), `adapters/` (from the artifact and web packs) |
| `playwright.config.ts` | One project per target the app has: `e2e/artifact/` and `e2e/web/` |

## Conventions

- Scripts: `build` builds the app's primary target, `build:artifact` and `build:web` build one target each (added by their packs). `npm run check` = format, lint, unit tests, `build`.
- Browser tests live in `e2e/<target>/`. A web-first app keeps its artifact prototype to smoke tests only.
- The packs' starter files (CI, configs, server, adapters) belong to the app after they are copied. Pack changes reach the app only through the sync check's notes; merge them by hand.
