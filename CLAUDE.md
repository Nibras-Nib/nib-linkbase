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

## Live Docs (Context7)

Before writing code that uses Next.js, React, Mongoose, NextAuth (Auth.js), Zod, Tailwind CSS, or any other third-party library, pull current docs through the Context7 MCP server (`resolve-library-id`, then `query-docs`). Do not rely on training data for API signatures, config options, or version-specific behaviour — check the installed version in `package.json` and query docs for that version.

- **Next.js:** the bundled docs in `node_modules/next/dist/docs/` match the installed version exactly and take precedence; use Context7 to supplement them, not replace them.
- **No Context7 entry:** if Context7 has no entry for a library (or none for the installed version), say so before proceeding, and name the source used instead (bundled docs, the package's README or type definitions in `node_modules`).
- **Context7 unavailable:** if the server fails to connect, say so rather than silently falling back to training data.

## React performance rules (`vercel-react-best-practices`)

The project skill `.claude/skills/vercel-react-best-practices` holds Vercel's React and Next.js performance rules. Invoke it with the Skill tool **before** writing, reviewing, or refactoring any React component, page, layout, data-loading code, or Server Action, including inside `plan-feature`, `create-feature`, and code reviews. Read the specific `rules/<rule>.md` files that apply; don't load the full `AGENTS.md` unless you need every rule.

The rules that matter most here:

- **Waterfalls:** start independent work with `Promise.all`, put `<Suspense>` around each slow part instead of awaiting at the top of a page, and move `await`s into the branch that needs them (`async-*`).
- **Server:** deduplicate per-request reads with `React.cache` (for example `getSession()` in `lib/auth/get-session.ts`), pass Client Components only the fields they render, and never hold request data in module-level variables (`server-*`).
- **Client:** keep `'use client'` on small leaves, derive state during render instead of syncing it in effects, put interaction logic in event handlers, and use functional `setState` (`rerender-*`).

Where a rule conflicts with this repo, the project docs and the bundled Next.js docs win:

- **Caching across requests:** use `'use cache'` with `cacheTag` / `cacheLife` (`docs/data-fetching.md`), not an LRU cache (`server-cache-lru`).
- **Client-side fetching:** the app has none. Reads happen in Server Components through `lib/db`, so `client-swr-dedup` doesn't apply.
- **Server Action order:** `server-auth-actions` matches `docs/data-mutations.md`. Rate-limited actions still check the limit before Zod validation, as `docs/security.md` requires, so invalid attempts count toward the limit. This is a deliberate exception to `async-cheap-condition-before-await`.
- **`lucide-react` imports:** Next.js already optimizes them by default (`optimizePackageImports`), so keep named imports from `lucide-react` and don't use deep paths (`bundle-barrel-imports`).

## Doc Convention

Whenever a new file is created in `/docs`, add it to the Project Docs section below with one line on what it covers and when to read it.

## Project Docs

- `docs/architecture.md` — rendering model (Server vs Client Components, Server Actions), directory layout (`app/`, `components/ui`, `components/[feature]`, `lib/db`, `lib/auth`, `lib/types`), and naming conventions. Read before adding a file, folder, route, or Server Action.
- `docs/auth.md` — NextAuth (Auth.js v5) setup, JWT sessions, deny-by-default `proxy.ts`, `requireUserId()` in every Server Action, ownership checks on `userId`, and the public `/user/[handle]` exception. Read before adding a route, Server Action, Route Handler, or anything that reads the session.
- `docs/coding-standards.md` — TypeScript strict mode, Prettier and ESLint setup (plus rules to add), import order, component and export conventions, async/await, and error handling. Read before writing or reviewing any code.
- `docs/data-fetching.md` — reads in Server Components through `lib/db` (no internal API calls), `userId` vs `handle` scoping, props to Client Components, `'use cache'` with `cacheTag` / `cacheLife`, and which tags each write clears with `updateTag`. Read before writing a query, a page that loads data, or a Server Action that writes.
- `docs/data-mutations.md` — the five steps every Server Action follows (session, Zod validation, `userId`-scoped write, `updateTag`, `ActionResult`), scoped write patterns, which tags each mutation clears, how the UI calls actions, and a pre-merge checklist. Read before writing or reviewing any Server Action.
- `docs/database.md` — MongoDB + Mongoose: cached connection helper (`lib/db/connect.ts`), models in `lib/db/models`, schema options and indexes, per-user query scoping, serialization, and caching. Read before writing a model, query, or Server Action that touches the database.
- `docs/design-system.md` — design foundations: color palette and semantic aliases, typography, spacing, radius, shadows, motion, and the Tailwind theme values. Read before choosing any color, font, size, or spacing value, or when setting up theme tokens.
- `docs/errors-and-validation.md` — Zod validation at the Server Action boundary with schemas in `lib/validation`, the `ActionResult` type for inline field errors, `useActionState` forms, thrown errors caught by `error.tsx`, and logging through `onRequestError` without leaking messages to the client. Read before writing a Server Action, form, schema, or error handling.
- `docs/git-conventions.md` — Conventional Commits types and subject rules, `<type>/<description>` branch names, one branch per feature, PRs with required human approval, squash merging, and `main` branch protection. Read before creating a branch, committing, or opening a PR.
- `docs/routing.md` — route map, `(auth)` / `(dashboard)` route groups and the single root layout, when to add `layout` / `loading` / `error` / `not-found`, `params` behind `<Suspense>`, Server Actions for all mutations, and Route Handlers limited to `app/api` webhooks and callbacks. Read before adding or moving a route or Route Handler.
- `docs/security.md` — secrets in env vars with `.env.example` as the template, security headers and CSP in `next.config.ts`, MongoDB-backed rate limits on sign-in and link creation, escaping user content, URL protocol checks, and `rel="noopener noreferrer"` on outbound links. Read before adding an env var, header, third-party origin, rate-limited action, or anything that renders user content.
- `docs/ui.md` — component specs (Button, IconButton, Input, Switch, Tabs, Avatar, Badge, Card, LinkButton, ProfileCard, Accordion), marketing layout patterns, and accessibility rules. Read before building or changing any component or page layout.

## AGENTS.md

The `nextjs-agent-rules` block in `AGENTS.md` is managed by `next dev`, which rewrites it if it is removed. Put project-specific instructions outside the `BEGIN`/`END` markers (or in this file) and commit the block as-is.
