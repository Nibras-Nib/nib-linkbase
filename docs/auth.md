# Linkbase Authentication

How users sign in, how sessions work, and how access is enforced. Read `docs/architecture.md` for where `lib/auth/` code lives and `docs/database.md` for the query-scoping rules this file relies on.

Linkbase uses Auth.js v5 (`next-auth@5.0.0-beta.32`, pinned because v5 is still published under the `beta` tag) with the **Credentials provider**: users sign up and log in with email and password only (no name, no username). There is no database adapter. Auth.js doesn't use one for Credentials, so users live in our own Mongoose `User` model (`lib/db/models/user.ts`).

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
| `/login`, `/signup` (`app/(auth)/…`) | Public. Signed-in users are redirected to `/dashboard`. |
| `/api/auth/*` | Public. Auth.js session, CSRF, callback, and sign-out endpoints. |
| `/` and marketing pages | Public, if listed in `PUBLIC_PATHS`. |

`(dashboard)` is a route group, so it doesn't appear in the URL and Proxy can't match on it. Proxy is therefore **deny-by-default**: every request needs a session unless its path is in the public allowlist. A new page added under `app/(dashboard)/` is protected without any change to `proxy.ts`. A new public page must be added to `PUBLIC_PATHS` explicitly.

## Layout

```
proxy.ts                           Optimistic session check on every request
app/
  api/auth/[...nextauth]/route.ts  Auth.js Route Handler (GET, rate-limited POST)
  (auth)/
    actions.ts                     signInWithCredentials, signUpWithCredentials
    login/page.tsx                 Log-in page
    signup/page.tsx                Sign-up page
  (dashboard)/                     Protected routes
  user/[handle]/page.tsx           Public profile
components/auth/                   Login and signup forms, AccountNav, UserMenu, SignOutForm
lib/auth/
  auth-config.ts                   Shared config: session, callbacks, pages (no database)
  auth.ts                          NextAuth instance with the Credentials provider: auth, signIn, signOut, handlers
  password.ts                      hashPassword / verifyPassword (scrypt)
  require-user-id.ts               requireUserId(): the session check used by pages and Server Actions
  get-session.ts                   getSession(): auth() deduplicated per request with React.cache
  get-current-user.ts              getCurrentUser(): email for header UI (not an access check)
lib/db/users.ts                    createUser, findUserForSignIn
lib/validation/auth.ts             signUpSchema, signInSchema, safeCallbackUrl
lib/types/
  next-auth.d.ts                   Adds `id` to the Session user type
```

The auth Route Handler is one of the cases `docs/architecture.md` allows: Auth.js's own session and CSRF endpoints are served from it.

## Configuration

The config is split so Proxy can verify sessions without loading any database code.

```ts
// lib/auth/auth-config.ts
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [], // added in auth.ts, because authorize() reads the database
  pages: { signIn: '/login' },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // re-issue the cookie at most once a day
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
} satisfies NextAuthConfig
```

`lib/auth/auth.ts` spreads `authConfig` and adds `Credentials({ authorize })`. `authorize` validates the input with `signInSchema`, looks the user up with `findUserForSignIn`, and checks the password with `verifyPassword`. When the email has no account it runs `verifyPasswordAgainstDummy` instead, so a missing user takes as long as a wrong password. It returns `{ id, email }` or `null`.

The returned `id` is the user's MongoDB `_id`. It becomes `token.sub`, and the `session` callback exposes it as `session.user.id`: the `userId` every Linkbase document references (see `docs/database.md`).

**Why JWT sessions:** the session is an encrypted cookie that Proxy can verify without a database round trip, which the Next.js docs require for Proxy checks. Credentials also only works with JWT sessions. The cost is that a session can't be revoked server-side before it expires, so `maxAge` is kept short.

### Passwords

- Hashed with Node's built-in `crypto.scrypt` (N=2^15, r=8, p=1, 16-byte salt, 64-byte key) and stored as `scrypt$N$r$p$<salt>$<hash>`. The parameters are stored with each hash, so the cost can be raised later without breaking existing hashes.
- Compared with `timingSafeEqual`. Passwords are NFKC-normalized before hashing.
- `passwordHash` has `select: false`. `findUserForSignIn` is the only query that reads it; never return it from `lib/db`.
- Sign-up rules: 8–128 characters with a letter and a number, entered twice (`password` and `confirmPassword` must match; the mismatch error shows under the confirm field). `confirmPassword` is only checked, never stored (`signUpSchema`). Sign-in only checks that a password was entered, so rule changes don't lock out existing users.

### Sign-up and sign-in flow

Both actions live in `app/(auth)/actions.ts`. They run before there's a session, so they don't call `requireUserId()`. Their first step is the rate limit instead:

1. `rateLimit()` on the hashed client IP (sign-in 10 per 15 min, sign-up 5 per hour). If the limit is hit, return a `formFailure`.
2. `safeParse` with `signInSchema` / `signUpSchema`.
3. Sign-up only: `createUser` with the hashed password. `EmailTakenError` (duplicate key) becomes the email field error "An account with this email already exists".
4. `signIn('credentials', { email, password, redirect: false })` in a `try`. `CredentialsSignin` becomes the form error "Email or password is incorrect"; anything else is rethrown.
5. `redirect(safeCallbackUrl(callbackUrl))`, outside the `try`. `safeCallbackUrl` accepts only same-origin paths and falls back to `/dashboard`.

The Auth.js `POST` endpoint is wrapped with the same sign-in limit, keyed the same way, so posting to `/api/auth/callback/credentials` directly doesn't get around it.

### Environment variables

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Encrypts session cookies. At least 32 random bytes (`npx auth secret`). Required in production. |
| `AUTH_URL` | Only when the canonical URL can't be inferred, for example behind a reverse proxy. |

Set them in `.env.local` in development and list them in `.env.example` (`docs/security.md`, "Secrets"). Never commit real values. Rotating `AUTH_SECRET` signs everyone out.

### Not built yet

Email verification, password reset, and OAuth providers. Choosing a handle happens in onboarding (not built yet), not at sign-up. Adding OAuth later means adding a database-backed account-linking design. Never set `allowDangerousEmailAccountLinking`.

## Proxy

```ts
// proxy.ts
import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth/auth-config'

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = [/^\/$/, /^\/login$/, /^\/signup$/, /^\/user\/[^/]+$/]
const AUTH_PAGES = [/^\/login$/, /^\/signup$/]

export default auth((req) => {
  const { pathname, search } = req.nextUrl

  if (req.auth && AUTH_PAGES.some((path) => path.test(pathname))) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }
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
- `callbackUrl` is a relative path. The sign-in actions pass it through `safeCallbackUrl` before redirecting, and Auth.js only redirects to the app's own origin; don't override the `redirect` callback to loosen that.

## Server checks

`requireUserId()` is the only way server code gets the current user's id.

```ts
// lib/auth/require-user-id.ts
import 'server-only'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'

export async function requireUserId() {
  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) redirect('/login')
  return userId
}
```

Server code reads the session through `getSession()` (`lib/auth/get-session.ts`), never `auth()` directly. It's `auth()` wrapped in `React.cache`, so the header, the page and `requireUserId()` decode the cookie once per request instead of once per caller.

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

Use the `signIn` and `signOut` exports from `lib/auth/auth.ts` inside Server Actions, called from a `<form>`. Sign-in and sign-up are the actions in `app/(auth)/actions.ts` ("Sign-up and sign-in flow" above). Sign-out is a menu item in the header's `UserMenu`:

```tsx
// components/auth/sign-out-form.tsx
export function SignOutForm() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/' })
      }}
    >
      <button type="submit" role="menuitem" tabIndex={-1} className={menuItemClassName}>
        <LogOut size={18} aria-hidden="true" />
        Sign out
      </button>
    </form>
  )
}
```

The header's account slot is `AccountNav` (`components/auth/account-nav.tsx`), a Server Component that reads the session with `getCurrentUser()`. It renders "Log in" / "Sign up free" when signed out, or `UserMenu` (a small Client Component that receives only `email`, and builds the avatar initial from it) with `SignOutForm` as its child. It always sits inside `<Suspense fallback={<AccountNavSkeleton />}>`, so pages that show it stay prerendered.

Don't build sign-in or sign-out with `fetch` calls from Client Components. Server Actions get Next.js's built-in Origin check, and Auth.js's own endpoints carry their CSRF token.

## Security defaults

Auth.js ships secure defaults. Don't override them:

- **Cookies** are `HttpOnly`, `SameSite=Lax`, and `Secure` with a `__Secure-` prefix in production. Don't set `cookies` in the config.
- **CSRF**: Auth.js endpoints use a double-submit token; Server Actions are POST-only and reject cross-origin requests.
- **Redirects** are limited to the app's own origin.
- **Session payload** stays small: `id` and `email`. Never put password hashes, roles from the client, or other secrets in the JWT or the session object; the session is readable by any Client Component it's passed to.
- **Errors** shown on `/login` are generic: "Email or password is incorrect" whether the email or the password was wrong, and unknown emails take as long to reject as wrong passwords. Don't echo Auth.js error details back to the user.
