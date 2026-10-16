# Linkbase Authentication

How users sign in, how sessions work, and how access is enforced. Read `docs/architecture.md` for where `lib/auth/` code lives and `docs/database.md` for the query-scoping rules this file relies on.

NextAuth (Auth.js v5, the `next-auth` package) is not installed yet. Add `next-auth` and `@auth/mongodb-adapter` when the first auth code is written. The adapter's `mongodb` peer dependency must match the driver version Mongoose ships with.

---

## Model

Access is enforced in three layers. Each one assumes the layer above it can be bypassed.

| Layer | Where | What it checks |
|---|---|---|
| **Proxy** | `proxy.ts` | Is there a valid session cookie? If not, redirect to `/login`. Optimistic: reads the cookie only, never the database. |
| **Server code** | `requireUserId()` in every dashboard page and every Server Action | Is the caller signed in? Returns their `userId` from the session. |
| **Database** | Query functions in `lib/db/` | Does this document belong to that `userId`? Every filter includes it. |

Proxy keeps signed-out visitors away from dashboard pages. It does **not** protect data on its own: a matcher change or a moved Server Action can silently drop Proxy coverage. The server and database checks are what actually keep one user out of another user's data.

> **Next.js 16 renamed `middleware.ts` to `proxy.ts`.** Same behaviour, new file name and export name. Proxy runs on the Node.js runtime. See `01-app/03-api-reference/03-file-conventions/proxy.md`.

## Routes

| Route | Access |
|---|---|
| `app/(dashboard)/**` | Signed-in users only. Protected by default. |
| `/user/[handle]` | Public. Anyone can view, signed in or not. Read-only. |
| `/login` (`app/(auth)/login`) | Public. |
| `/api/auth/*` | Public. Auth.js sign-in, callback, and sign-out endpoints. |
| `/` and marketing pages | Public, if listed in `PUBLIC_PATHS`. |

`(dashboard)` is a route group, so it doesn't appear in the URL and Proxy can't match on it. Proxy is therefore **deny-by-default**: every request needs a session unless its path is in the public allowlist. A new page added under `app/(dashboard)/` is protected without any change to `proxy.ts`. A new public page must be added to `PUBLIC_PATHS` explicitly.

## Layout

```
proxy.ts                           Optimistic session check on every request
app/
  api/auth/[...nextauth]/route.ts  Auth.js Route Handler (GET, POST)
  (auth)/login/page.tsx            Sign-in page
  (dashboard)/                     Protected routes
  user/[handle]/page.tsx           Public profile
lib/auth/
  auth-config.ts                   Shared config: providers, session, callbacks (no database)
  auth.ts                          NextAuth instance with the MongoDB adapter: auth, signIn, signOut, handlers
  require-user-id.ts               requireUserId(): the session check used by pages and Server Actions
lib/types/
  next-auth.d.ts                   Adds `id` to the Session user type
```

The auth Route Handler is one of the cases `docs/architecture.md` allows: OAuth providers call back to it, so it can't be a Server Action.

## Configuration

The config is split so Proxy can verify sessions without loading the database adapter.

```ts
// lib/auth/auth-config.ts
import type { NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const authConfig = {
  providers: [GitHub],
  pages: { signIn: '/login' },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,  // re-issue the cookie at most once a day
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
} satisfies NextAuthConfig
```

```ts
// lib/auth/auth.ts
import 'server-only'
import NextAuth from 'next-auth'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { connectToDatabase } from '@/lib/db/connect'
import { authConfig } from '@/lib/auth/auth-config'

// Reuse the Mongoose connection pool; never open a second MongoClient.
async function getMongoClient() {
  const mongoose = await connectToDatabase()
  return mongoose.connection.getClient()
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(getMongoClient()),
})
```

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth/auth'

export const { GET, POST } = handlers
```

The adapter stores users and linked OAuth accounts in MongoDB (`users`, `accounts`). The user's `_id` is the `userId` that every Linkbase document references (see `docs/database.md`). `token.sub` holds it, and the `session` callback exposes it as `session.user.id`.

**Why JWT sessions:** the session is an encrypted cookie that Proxy can verify without a database round trip, which the Next.js docs require for Proxy checks. The cost is that a session can't be revoked server-side before it expires, so `maxAge` is kept short.

### Providers

Use OAuth providers (or email magic links). Don't add the Credentials provider for passwords: Linkbase doesn't store or hash passwords. Don't set `allowDangerousEmailAccountLinking`; it lets anyone who controls an email address at one provider take over the account created with another.

### Environment variables

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Encrypts session cookies. At least 32 random bytes (`npx auth secret`). Required in production. |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | OAuth credentials, one pair per provider (`AUTH_<PROVIDER>_ID` / `_SECRET`). |
| `AUTH_URL` | Only when the canonical URL can't be inferred, for example behind a reverse proxy. |

Set them in `.env.local` in development. Never commit them. Rotating `AUTH_SECRET` signs everyone out.

## Proxy

```ts
// proxy.ts
import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth/auth-config'

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = [/^\/$/, /^\/login$/, /^\/user\/[^/]+$/]

export default auth((req) => {
  const { pathname, search } = req.nextUrl
  if (req.auth || PUBLIC_PATHS.some((path) => path.test(pathname))) return

  const loginUrl = new URL('/login', req.nextUrl)
  loginUrl.searchParams.set('callbackUrl', pathname + search)
  return NextResponse.redirect(loginUrl)
})

export const config = {
  matcher: [
    // Everything except Auth.js endpoints, build output, and static files
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
```

- Proxy imports `auth-config.ts`, never `auth.ts`, so it never touches the database.
- `PUBLIC_PATHS` and `matcher` must be constants. Next.js reads `matcher` at build time and ignores dynamic values.
- `callbackUrl` is a relative path. Auth.js only redirects to the app's own origin after sign-in; don't override the `redirect` callback to loosen that.

## Server checks

`requireUserId()` is the only way server code gets the current user's id.

```ts
// lib/auth/require-user-id.ts
import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'

export async function requireUserId() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')
  return userId
}
```

### Server Actions

**Every Server Action that reads or writes user data calls `requireUserId()` first**, then passes the result to a scoped query function. A Server Action is a public POST endpoint. The page it's defined on, the layout around it, and Proxy don't protect it.

```ts
// app/(dashboard)/dashboard/actions.ts
'use server'
import { updateTag } from 'next/cache'

import { requireUserId } from '@/lib/auth/require-user-id'
import { cacheTags } from '@/lib/db/cache-tags'
import { deleteLinkForUser } from '@/lib/db/links'
import { type ActionResult, formFailure } from '@/lib/validation/action-result'
import { objectIdSchema } from '@/lib/validation/common'

export async function deleteLink(linkId: unknown): Promise<ActionResult> {
  const userId = await requireUserId()
  const parsed = objectIdSchema.safeParse(linkId)
  if (!parsed.success) return formFailure('That link no longer exists')

  const deleted = await deleteLinkForUser(userId, parsed.data) // deleteOne({ _id, userId })
  if (!deleted) return formFailure('That link no longer exists')

  updateTag(cacheTags.links(userId))
  return { ok: true, data: undefined }
}
```

Before merging a Server Action, check that:

- It calls `requireUserId()` before any database access.
- `userId` comes only from `requireUserId()`, never from arguments, form data, params, or search params.
- Every query it makes is scoped by `userId` (`docs/database.md`, "User scoping"). A document owned by someone else is "not found", not "forbidden", so ids belonging to other users aren't confirmed to exist.
- Its arguments are validated with Zod, and it returns only what the UI needs (`docs/errors-and-validation.md`).

### Pages and layouts

- Call `requireUserId()` in the page or in the component that loads the data, not only in a layout. Layouts don't re-render on client navigation, and a layout check doesn't stop nested segments or Server Actions from running.
- Reading the session reads cookies, so with Cache Components the component that calls it must sit inside `<Suspense>`. Don't `await` the session at the top of a layout; it holds back all of `{children}`.
- To cache a user's data, read the session outside the cached function and pass `userId` in. See `docs/database.md`, "Caching", and `01-app/02-guides/authentication-with-cache-components.md`.

### Route Handlers

A Route Handler under a protected path needs its own `requireUserId()` check (returning `401` instead of redirecting where a JSON response is expected). Proxy alone isn't enough here either.

## Public profile

`/user/[handle]` never calls `auth()` or `requireUserId()`. It reads through `getPublicProfileByHandle` (see `docs/database.md`, "Public profile pages"), which selects only public fields and never writes. Because it doesn't depend on the viewer, it can be cached per handle.

Nothing on the public page reveals whether the viewer is the owner, and it has no Server Actions. Editing happens only in the dashboard.

## Signing in and out

Use the `signIn` and `signOut` exports from `lib/auth/auth.ts` inside Server Actions, called from a `<form>`:

```tsx
// components/auth/sign-out-button.tsx
import { signOut } from '@/lib/auth/auth'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/' })
      }}
    >
      <Button type="submit">Sign out</Button>
    </form>
  )
}
```

Don't build sign-in or sign-out with `fetch` calls from Client Components. Server Actions get Next.js's built-in Origin check, and Auth.js's own endpoints carry their CSRF token.

## Security defaults

Auth.js ships secure defaults. Don't override them:

- **Cookies** are `HttpOnly`, `SameSite=Lax`, and `Secure` with a `__Secure-` prefix in production. Don't set `cookies` in the config.
- **CSRF**: Auth.js endpoints use a double-submit token; Server Actions are POST-only and reject cross-origin requests.
- **Redirects** are limited to the app's own origin.
- **Session payload** stays small: `id`, `name`, `email`, `image`. Never put OAuth access or refresh tokens, roles from the client, or other secrets in the JWT or the session object; the session is readable by any Client Component it's passed to.
- **Errors** shown on `/login` are generic. Don't echo provider error details back to the user.
