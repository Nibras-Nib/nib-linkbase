# Linkbase Architecture

How the app is structured and where code goes. For Next.js 16.4 API details, read the bundled docs in `node_modules/next/dist/docs/01-app/` — this file covers project conventions only.

---

## Rendering model

The app uses the **App Router** only (`app/`). There is no Pages Router.

- **Server Components are the default.** Every component is a Server Component unless it needs to be otherwise. Fetch data, read the database, and check auth in Server Components.
- **Client Components only where interactivity is needed**: state (`useState`, `useReducer`), effects, event handlers, browser APIs, or client-only libraries. Add `'use client'` at the top of that file.
- **Keep the client boundary small.** `'use client'` pulls the file and everything it imports into the client bundle. Put the directive on the interactive leaf (a toggle, a form, a menu), not on a page or layout. Pass server-rendered content into Client Components as `children` or props instead of importing server code into them.
- **Cache Components are on.** Data access is dynamic by default. Opt into caching with `'use cache'` plus `cacheLife` / `cacheTag`. Uncached data access outside a `<Suspense>` boundary fails the prerender. See `01-app/01-getting-started/08-caching.md`.
- **Mutations use Server Actions** (`'use server'`), not API routes. Use Route Handlers (`app/**/route.ts`) only for things a Server Action can't serve, such as webhooks or public endpoints called by third parties.

## Directory layout

```
app/                     Routes, layouts, loading/error states (App Router)
components/
  ui/                    UI primitives: Button, Input, Switch, Tabs, Avatar, Badge, Card…
  [feature]/             Feature components, one folder per feature (e.g. profile/, links/)
lib/
  db/                    Database client and query helpers
  auth/                  Auth helpers (session lookup, access checks)
  actions/               Server Actions shared by more than one route
  validation/            Zod schemas and the ActionResult type
  security/              Rate limiting and other cross-cutting security helpers
  types/                 Shared TypeScript types
docs/                    Project documentation
public/                  Static assets
```

### `app/`
Routes only: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`. Keep business logic out of route files. Pages fetch data (through `lib/`) and compose components from `components/`.

### `components/ui/`
Primitives with no app-specific knowledge. They take props, render markup, and never fetch data or import from `lib/db` or `lib/auth`. Specs for each primitive are in `docs/ui.md`.

### `components/[feature]/`
Components tied to one feature, built from the `ui/` primitives. A feature folder may contain both Server and Client Components. A feature component that is reused across several features belongs in `ui/` (if it's generic) or a new shared feature folder.

### `lib/`
Shared, non-UI code. Each concern has its own folder:

- **`lib/db/`** — the database client and query functions. Server-only.
- **`lib/auth/`** — helpers for reading the session and checking access. Server-only.
- **`lib/actions/`** — Server Actions used by more than one route. Actions used by one route live in that route's `actions.ts` (see `docs/routing.md`).
- **`lib/validation/`** — Zod schemas shared by Server Actions and forms, and the `ActionResult` type. No database access, so Client Components may import it (see `docs/errors-and-validation.md`).
- **`lib/security/`** — rate limiting and other security helpers. Server-only (see `docs/security.md`).
- **`lib/types/`** — shared TypeScript types and interfaces. Types used by only one file stay in that file.

Mark server-only modules with `import 'server-only'` so importing them from a Client Component fails the build (install the `server-only` package when the first such module is added).

Import through the `@/` alias, which resolves to the repository root: `import { getUser } from '@/lib/auth/get-user'`.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Files and folders | kebab-case | `profile-card.tsx`, `lib/auth/get-session.ts` |
| React components | PascalCase | `export function ProfileCard()` |
| Server Actions | verb-first camelCase | `createLink`, `updateProfile`, `deleteLink` |
| Next.js special files | framework name | `page.tsx`, `layout.tsx`, `route.ts` |

- One main component per file; the file name is the kebab-case form of the component name (`ProfileCard` → `profile-card.tsx`).
- Server Action names start with the verb that describes the mutation: `create`, `update`, `delete`, `toggle`, `reorder`, and so on. Avoid noun-first names like `linkCreate` or generic ones like `handleSubmit`.
