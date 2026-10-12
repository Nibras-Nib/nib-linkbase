# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

`linkbase` is currently an unmodified `create-next-app` scaffold: one root layout (`app/layout.tsx`), one placeholder page (`app/page.tsx`), no data layer, no API routes, and no tests. There is no established application architecture yet — new structure should follow the conventions in the bundled Next.js docs rather than assumptions about how older Next.js apps were laid out.

## Commands

npm is the package manager (`package-lock.json`).

```bash
npm run dev      # dev server at http://localhost:3000 (Turbopack)
npm run build    # production build; also where Cache Components prerender errors surface
npm run start    # serve the production build
npm run lint     # ESLint (flat config, eslint-config-next core-web-vitals + typescript)
npx next typegen && npx tsc --noEmit   # type-check; there is no dedicated script
```

No test runner is configured, so there is no test command yet.

`next dev` writes its PID, port, and URL to `.next/dev/lock`. If a dev server is already running for this project, reuse it instead of starting a second one.

## Stack and version-specific behaviour

- **Next.js 16.4 / React 19.3, App Router only.** The Next.js docs matching this exact version live in `node_modules/next/dist/docs/` (`01-app/` is the relevant tree; `02-pages/` is the Pages Router and does not apply here). Read the relevant page there before using any Next.js API.
- **Cache Components are on** (`cacheComponents: true` in `next.config.ts`). This changes the rendering model for every route:
  - Data access is dynamic by default; caching is opt-in via the `"use cache"` directive, with `cacheLife` / `cacheTag`.
  - Routes are partially prerendered. Uncached data access (`fetch`, `cookies()`, `headers()`, `connection()`, etc.) outside a `<Suspense>` boundary is a prerender error. The error lists the fixes — wrap in `<Suspense>`, add `"use cache"`, or `export const instant = false` — and links to a `/docs/messages/...` page describing each.
  - The Node.js runtime is required; `runtime = 'edge'` is not supported.
  - Client navigation keeps recent routes mounted in a hidden React `<Activity>`, so component state survives navigating away and back, and effects are torn down/recreated on hide/show.
  - See `01-app/01-getting-started/08-caching.md` and `01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`.
- **Partial Prefetching is on** (`partialPrefetching: true`). A `<Link>` prefetches one shared App Shell per route rather than per-link content; `params` / `searchParams` reads must sit behind `<Suspense>` to be part of that shell. See `01-app/02-guides/adopting-partial-prefetching.md`.
- **Tailwind CSS v4 through a Turbopack loader**, not PostCSS. `next.config.ts` registers `@tailwindcss/turbopack` as the loader for `*.css`; there is no `postcss.config.*` or `tailwind.config.*`, and adding one is not how this project is wired. Theme tokens are defined in CSS in `app/globals.css` via `@theme inline`, which maps `--color-background` / `--color-foreground` and the Geist font variables set in `app/layout.tsx`.
- **Generated route types.** `LayoutProps<"/">` (and the matching `PageProps`) are global types generated into `.next/types` by `next dev`, `next build`, or `next typegen` — they are not imported. Run `next typegen` before `tsc` on a fresh checkout or after adding routes.
- **Path alias:** `@/*` resolves to the repository root (there is no `src/` directory).

## AGENTS.md

The `nextjs-agent-rules` block in `AGENTS.md` is managed by `next dev`, which rewrites it if it is removed. Put project-specific instructions outside the `BEGIN`/`END` markers (or in this file) and commit the block as-is.
