# Linkbase Routing

Which routes exist, who can reach them, and how each route folder is laid out. Read `docs/architecture.md` for the rendering model and `docs/auth.md` for how access is enforced.

For the file conventions themselves, see `01-app/03-api-reference/03-file-conventions/` in the bundled Next.js docs.

---

## Route map

| URL | File | Access |
|---|---|---|
| `/` | `app/page.tsx` | Public. Landing page. |
| `/user/[handle]` | `app/user/[handle]/page.tsx` | Public. A user's profile and links. |
| `/login` | `app/(auth)/login/page.tsx` | Public. Sign-in. |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Signed in. The user's links and profile. |
| `/add-links` | `app/(dashboard)/add-links/page.tsx` | Signed in. Add a new link. |
| `/api/auth/*` | `app/api/auth/[...nextauth]/route.ts` | Public. Auth.js endpoints and OAuth callbacks. |

## Directory tree

```
app/
  layout.tsx                       Root layout: <html>, <body>, fonts, globals.css
  page.tsx                         /
  not-found.tsx                    App-wide 404
  global-error.tsx                 Last-resort error boundary (replaces the root layout)
  user/[handle]/
    page.tsx                       /user/[handle]
    loading.tsx
    not-found.tsx                  Unknown handle
  (auth)/
    layout.tsx                     Minimal centered layout for auth screens
    login/page.tsx                 /login
  (dashboard)/
    layout.tsx                     App chrome: nav, account menu, sign-out
    error.tsx                      Error boundary for every dashboard page
    dashboard/
      page.tsx                     /dashboard
      loading.tsx
      actions.ts                   Server Actions used by /dashboard
    add-links/
      page.tsx                     /add-links
      actions.ts
  api/
    auth/[...nextauth]/route.ts    Auth.js
    webhooks/[provider]/route.ts   Incoming webhooks, when there are any
```

## Route groups

Folders in parentheses group routes without adding a URL segment: `app/(dashboard)/add-links/page.tsx` serves `/add-links`, not `/dashboard/add-links`. Linkbase uses groups for two things only: giving related routes a shared layout and marking which routes are protected.

- **`(dashboard)`**: every route that needs a signed-in user. Its `layout.tsx` holds the app chrome.
- **`(auth)`**: sign-in and any future auth screens. Its layout has no app chrome and no session-dependent UI.
- **Public routes** (`/`, `/user/[handle]`) sit outside any group and use only the root layout.

There is **one root layout**, `app/layout.tsx`. Don't add `<html>` or `<body>` to a group layout: multiple root layouts force a full page reload when navigating between groups.

Two routes in different groups can't resolve to the same URL. `app/(auth)/dashboard/page.tsx` next to `app/(dashboard)/dashboard/page.tsx` is a build error.

## Access

Every route outside the public list requires a session. `proxy.ts` (Next.js 16's name for middleware) redirects signed-out visitors to `/login?callbackUrl=<original path>`, and Auth.js sends them back to that path after sign-in. Details are in `docs/auth.md`.

- Proxy can't see route groups, since they aren't in the URL. It works **deny-by-default** with an allowlist of public paths. A new route under `(dashboard)` is protected with no change to `proxy.ts`.
- **Adding a public route** means adding its path to `PUBLIC_PATHS` in `proxy.ts`. Review that change as a security change.
- Proxy is the first check, not the only one. Every dashboard page and every Server Action still calls `requireUserId()` (see `docs/auth.md`, "Server checks").
- After sign-in with no `callbackUrl`, users land on `/dashboard`.

## Per-route files

Each route owns the special files it needs. Add one when the route has a reason for it, not by default.

| File | Add it when | Notes |
|---|---|---|
| `layout.tsx` | Several routes share UI that should persist across navigation (nav, sidebar). | Layouts don't re-render on navigation, so never put an auth check here. Don't `await` the session at the top level; it blocks `{children}`. Put session-dependent chrome in a component inside `<Suspense>`. |
| `loading.tsx` | The page awaits data and a skeleton beats a blank wait. | Wraps `page.tsx` in `<Suspense>`. Match the page's layout so content doesn't jump when it arrives. |
| `error.tsx` | The route can fail at runtime (database reads, external calls) and should recover in place. | Must be a Client Component (`'use client'`). Receives `error` and `retry`. Doesn't catch errors thrown by the `layout.tsx` in the same folder; the parent's boundary does. |
| `not-found.tsx` | The route has dynamic params that may not match anything. | Rendered when the page calls `notFound()`. |

Defaults:

- `(dashboard)/error.tsx` covers every dashboard page. Add a closer `error.tsx` only when a page needs a different recovery.
- `global-error.tsx` catches errors in the root layout. It replaces the root layout, so it renders its own `<html>` and `<body>`.
- Name the component in an error file after the route (`DashboardError`), not `Error`, which shadows the global `Error` class.

```tsx
// app/(dashboard)/error.tsx
'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

type DashboardErrorProps = {
  error: Error & { digest?: string }
  retry: () => void
}

export default function DashboardError({ error, retry }: DashboardErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div role="alert">
      <h2>Something went wrong.</h2>
      <Button onClick={retry}>Try again</Button>
    </div>
  )
}
```

Show a generic message. In production, `error.message` from a Server Component is replaced with a generic message anyway; use `digest` to match the error to server logs.

## Dynamic routes and params

Partial Prefetching is on, so a `<Link>` prefetches one shared App Shell per route. Reading `params` or `searchParams` outside `<Suspense>` ties the shell to one URL and is flagged in development. Pass the promise down unawaited and read it inside a boundary:

```tsx
// app/user/[handle]/page.tsx
import { Suspense } from 'react'

import { ProfileSkeleton } from '@/components/profile/profile-skeleton'

import { PublicProfile } from './public-profile'

export default function UserProfilePage({ params }: PageProps<'/user/[handle]'>) {
  return (
    <main>
      <Suspense fallback={<ProfileSkeleton />}>
        <PublicProfile params={params} />
      </Suspense>
    </main>
  )
}
```

`PublicProfile` awaits `params`, looks the profile up with `getPublicProfileByHandle`, and calls `notFound()` when there's no match. `PageProps<'/user/[handle]'>` is a generated global type; run `npx next typegen` after adding a route.

Handles are matched lowercase (the `Profile` schema stores them lowercase). Normalize the param before the lookup.

## Mutations: Server Actions

**All mutations go through Server Actions** (full pipeline in `docs/data-mutations.md`). Forms, buttons, toggles, reordering, sign-in and sign-out all call a `'use server'` function.

- Put actions in an `actions.ts` file next to the route that uses them (`app/(dashboard)/dashboard/actions.ts`). When two routes need the same action, move it to `lib/actions/`.
- Name them verb-first (`createLink`, `deleteLink`), per `docs/architecture.md`.
- Every action calls `requireUserId()` first and only uses scoped query functions (`docs/auth.md`, `docs/database.md`).
- After a write, clear the cache tags of the affected reads with `updateTag(cacheTags.links(userId))` so the next render shows fresh data (`docs/data-fetching.md`).

Reads don't need an endpoint either. Server Components call `lib/db` query functions directly.

## Route Handlers: `app/api` only

Route Handlers (`route.ts`) are **only for requests that come from outside the app**:

- **Third-party callbacks**: OAuth redirects (`app/api/auth/[...nextauth]`), payment or provider redirects.
- **Webhooks**: `app/api/webhooks/[provider]/route.ts`.

Don't add a Route Handler for the app's own UI to call. If a Client Component needs data, pass it from a Server Component as props; if it needs to change something, call a Server Action.

Rules for every Route Handler:

- It lives under `app/api/`. No `route.ts` anywhere else in `app/`.
- Webhooks verify the provider's signature against the raw request body before parsing or acting on anything, and reject the request with `401` if it doesn't match.
- Webhook handlers are idempotent; providers retry, so the same event can arrive more than once.
- `/api/webhooks/*` is not behind a session. Add it to the Proxy allowlist (`docs/auth.md`); the signature check is its authentication.
- Validate the payload, return only what the caller needs, and never return internal ids or stack traces.
