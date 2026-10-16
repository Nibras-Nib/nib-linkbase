# Linkbase Data Fetching

How pages read data, how reads are scoped, and how cached reads are cleared after a write. Read `docs/database.md` for models and query rules, `docs/auth.md` for `requireUserId()`, and `docs/errors-and-validation.md` for the write side.

For the Next.js APIs, see `01-app/01-getting-started/08-caching.md`, `09-revalidating.md`, and `01-app/03-api-reference/01-directives/use-cache.md`.

---

## Rules

1. **Reads happen in Server Components**, which call query functions in `lib/db/` directly.
2. **No internal HTTP.** Never `fetch('/api/...')` from the app to itself. It adds a network hop, loses types, and creates an endpoint that has to be secured on its own. `app/api` is for webhooks and third-party callbacks only (`docs/routing.md`).
3. **Every query is scoped**: to the signed-in user's `userId` for private data, to the `handle` for the public profile.
4. **Client Components never touch the database.** They get data as props from a Server Component.
5. **Cache where it helps**, with `'use cache'`, and tag every cached read so writes can clear it.

## Where reads live

```
lib/db/
  links.ts               getLinksForUser(userId), …
  profiles.ts            getProfileForUser(userId), getPublicProfileByHandle(handle)
  cache-tags.ts          Tag names shared by reads and writes
```

Query functions are the only code that calls Mongoose. Pages and components call query functions; they never import a model. Every file in `lib/db/` starts with `import 'server-only'`, so importing it into a Client Component fails the build.

Query functions return plain, serializable objects with string ids, typed in `lib/types/`. Never return a Mongoose document, an `ObjectId`, or `userId` unless the caller needs it (`docs/database.md`, "Passing data to components").

## Scoping

| Data | Scoped by | Comes from | Example |
|---|---|---|---|
| Dashboard data (links, profile, settings) | `userId` | `requireUserId()` (the session) | `getLinksForUser(userId)` |
| Public profile | `handle` | The URL param, normalized to lowercase | `getPublicProfileByHandle(handle)` |

- Private query functions take `userId` as their first argument and filter on it. There's no unscoped `getLinkById(id)`.
- `userId` is never read from params, search params, or props passed from the client.
- `getPublicProfileByHandle` is the only read that isn't scoped to a session. It selects public fields only, returns active links only, and doesn't return `userId`. Don't call it from the dashboard; the dashboard reads by `userId`.

## Reading in Server Components

Read the session and the data in the component that renders it, inside `<Suspense>`. Pages stay thin; the static parts of the page prerender into the shell and the data streams in (Cache Components, `docs/architecture.md`).

```tsx
// app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react'

import { requireUserId } from '@/lib/auth/require-user-id'
import { getLinksForUser } from '@/lib/db/links'
import { LinkList } from '@/components/links/link-list'
import { LinkListSkeleton } from '@/components/links/link-list-skeleton'

export default function DashboardPage() {
  return (
    <main>
      <h1>Your links</h1>
      <Suspense fallback={<LinkListSkeleton />}>
        <DashboardLinks />
      </Suspense>
    </main>
  )
}

async function DashboardLinks() {
  const userId = await requireUserId()
  const links = await getLinksForUser(userId)
  return <LinkList links={links} />
}
```

- Run independent reads in parallel: `const [profile, links] = await Promise.all([...])`.
- Don't `await` data at the top of a layout. It blocks every page below it (`docs/routing.md`).
- Several components needing the same uncached value in one request (such as the current user) can share it by wrapping the function in React's `cache()`, which dedupes per request.

## Client Components get props

A Client Component that displays data receives it from the nearest Server Component:

```tsx
// components/links/link-list.tsx
'use client'

import type { LinkSummary } from '@/lib/types/link'

type LinkListProps = {
  links: LinkSummary[]
}

export function LinkList({ links }: LinkListProps) {
  // interactive list: reorder, toggle, delete via Server Actions
}
```

- Pass only the fields the component renders. Everything passed to a Client Component is sent to the browser.
- To change data, a Client Component calls a Server Action. When the action calls `updateTag`, Next.js re-renders the affected Server Components and sends fresh props in the same response. No refetch code is needed on the client.
- No `useEffect` + `fetch` for app data, and no client-side data libraries for reading our own database.
- Reads that genuinely need to start from the client (typeahead search, polling) aren't covered yet: **TBD**.

## Caching

With Cache Components on, every read is dynamic unless it's cached. Cache a read when it runs often and its data changes less often than it's read.

| Read | Cache? | Why |
|---|---|---|
| `getPublicProfileByHandle` | Yes | Hit by every visitor; changes only when the owner edits. |
| `getLinksForUser`, `getProfileForUser` | Yes | Read on every dashboard visit; writes clear them. |
| `requireUserId()` / the session | No | Request data (cookies) can't be read inside `'use cache'`. |

### How to cache

**Use the `'use cache'` directive with `cacheTag` and `cacheLife`.** `unstable_cache` is replaced by `'use cache'` in Next.js 16, and the `fetch` cache doesn't apply here because reads call MongoDB directly rather than over HTTP. Don't use either.

```ts
// lib/db/cache-tags.ts
import 'server-only'

export const cacheTags = {
  links: (userId: string) => `links:${userId}`,
  profile: (userId: string) => `profile:${userId}`,
  handle: (handle: string) => `handle:${handle}`,
}
```

```ts
// lib/db/links.ts
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'

import { cacheTags } from '@/lib/db/cache-tags'
import { connectToDatabase } from '@/lib/db/connect'
import { Link } from '@/lib/db/models/link'
import type { LinkSummary } from '@/lib/types/link'

export async function getLinksForUser(userId: string): Promise<LinkSummary[]> {
  'use cache'
  cacheTag(cacheTags.links(userId))
  cacheLife('hours')

  await connectToDatabase()
  const links = await Link.find({ userId }).sort({ order: 1 }).select('title url isActive').lean()
  return links.map((link) => ({
    id: link._id.toString(),
    title: link.title,
    url: link.url,
    isActive: link.isActive,
  }))
}
```

```ts
// lib/db/profiles.ts
export async function getPublicProfileByHandle(handle: string): Promise<PublicProfile | null> {
  'use cache'
  cacheTag(cacheTags.handle(handle)) // also caches "no such handle"
  cacheLife('hours')

  await connectToDatabase()
  const profile = await Profile.findOne({ handle }).select('userId handle displayName').lean()
  if (!profile) return null

  const userId = profile.userId.toString()
  cacheTag(cacheTags.profile(userId), cacheTags.links(userId)) // owner's edits clear this page too

  const links = await Link.find({ userId, isActive: true }).sort({ order: 1 }).select('title url').lean()
  return {
    handle: profile.handle,
    displayName: profile.displayName ?? null,
    links: links.map((link) => ({ id: link._id.toString(), title: link.title, url: link.url })),
  }
}
```

Rules for cached reads:

- **The session is read outside, `userId` is passed in.** A `'use cache'` function can't call `cookies()` or `auth()`, directly or through a helper. The arguments become the cache key, so each user gets their own entry.
- **Arguments and return values must be serializable.** Return plain objects with string ids; an `ObjectId` or Mongoose document fails.
- **Cache keys and tags are stored in plain text.** Key and tag on ids and handles only, never emails, tokens, or other personal data.
- **Every cached read has at least one tag**, built with `cacheTags`, never a hand-typed string.
- `cacheLife('hours')` is the default for Linkbase data. Tags do the real invalidation; the lifetime is a safety net.

## Clearing the cache after writes

Every Server Action that writes clears the tags of every read that shows that data. With the tags above, one call covers both the dashboard and the public page.

| Write | Clear |
|---|---|
| Create, edit, delete, reorder, or toggle a link | `links(userId)` |
| Edit display name or bio | `profile(userId)` |
| Change handle | `profile(userId)`, `handle(oldHandle)`, `handle(newHandle)` |

**In Server Actions, use `updateTag`, not `revalidateTag`.** `updateTag` expires the entry immediately, so the user sees their own change in the response to the action. `revalidateTag` serves stale data while it refreshes in the background, which looks like the save didn't work.

```ts
// app/(dashboard)/dashboard/actions.ts (after the write succeeds)
updateTag(cacheTags.links(userId))
```

**Outside Server Actions** (a webhook Route Handler), `updateTag` isn't available. Use `revalidateTag(tag, { expire: 0 })` when the data must be fresh on the next request, or `revalidateTag(tag, 'max')` when serving stale data briefly is fine. The one-argument `revalidateTag(tag)` is deprecated.

Clear tags **after** the write succeeds, and only for the user who made it. Never clear tags based on ids from client input.

## What the default cache is

`'use cache'` stores entries in memory in each server process. Entries don't survive a restart and aren't shared between instances. That's fine for a single server; running several instances needs a shared cache handler (**TBD**, see `use-cache-remote.md` in the Next.js docs).
