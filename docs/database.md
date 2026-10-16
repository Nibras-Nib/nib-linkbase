# Linkbase Database

How the app stores and reads data: MongoDB through Mongoose. Read `docs/architecture.md` first for where `lib/` code lives and how Server Actions are named.

Mongoose is not installed yet. Add it with `npm install mongoose` when the first model is written.

---

## Responsibilities

Mongoose owns three things, and nothing else in the app duplicates them:

- **Schema**: every collection has a Mongoose schema that defines its fields and types.
- **Validation**: field rules (`required`, `minlength`, `match`, `enum`, custom validators) live on the schema. Server Actions validate input with Zod before calling the database (`docs/errors-and-validation.md`), but the schema is the final authority.
- **Connection pooling**: one connection, one pool. Code never opens its own `MongoClient` or calls `mongoose.connect` directly.

All database code is server-only. Mongoose needs the Node.js runtime, which this project always uses (Cache Components don't support `runtime = 'edge'`).

## Layout

```
lib/db/
  connect.ts             Connection helper: connectToDatabase()
  models/
    profile.ts           Profile model (one per user, owns the handle)
    link.ts              Link model (many per user)
```

Files are kebab-case and models are PascalCase, following `docs/architecture.md`. Each model file defines one schema and exports one model. Query functions for a model sit next to it or in `lib/db/`; they never live in components or route files.

## Connection

`lib/db/connect.ts` exposes one function, `connectToDatabase()`. Every query function awaits it before touching a model. It caches the connection on `globalThis`, so:

- **In development**, the connection survives hot reloads instead of a new pool being opened on every file save.
- **In production**, every Server Action and Server Component in a server process shares the same connection and pool.

Concurrent first calls share one in-flight promise, so a cold start opens one connection, not several.

```ts
// lib/db/connect.ts
import 'server-only'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) throw new Error('MONGODB_URI is not set')

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalForMongoose = globalThis as typeof globalThis & { mongoose?: MongooseCache }
const cache = (globalForMongoose.mongoose ??= { conn: null, promise: null })

export async function connectToDatabase() {
  if (cache.conn) return cache.conn

  cache.promise ??= mongoose.connect(MONGODB_URI!, { bufferCommands: false })

  try {
    cache.conn = await cache.promise
  } catch (error) {
    cache.promise = null // let the next call retry
    throw error
  }
  return cache.conn
}
```

`bufferCommands: false` makes a query fail immediately if there's no connection, instead of queuing silently. The connection string comes from the `MONGODB_URI` environment variable (`.env.local` in development) and is never committed.

## Schemas

Every schema sets the same options:

| Option | Value | Why |
|---|---|---|
| `strict` | `true` | Fields not in the schema are dropped on save, so client input can't add arbitrary fields. |
| `timestamps` | `true` | Mongoose sets `createdAt` and `updatedAt` automatically. Don't define them by hand. |

Every user-owned document has a required `userId` field with an index. The `handle` field (the user's public URL slug, on `Profile`) has a unique index, stored lowercase and trimmed.

```ts
// lib/db/models/profile.ts
import 'server-only'
import { Schema, model, models, type InferSchemaType } from 'mongoose'

const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    handle: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_-]{3,30}$/,
    },
    displayName: { type: String, trim: true, maxlength: 60 },
  },
  { strict: true, timestamps: true },
)

export type ProfileDocument = InferSchemaType<typeof profileSchema>

export const Profile = models.Profile ?? model('Profile', profileSchema)
```

`models.Profile ?? model(...)` reuses the compiled model after a hot reload. Without it, development throws `OverwriteModelError`.

Add compound indexes when a query filters or sorts on more than `userId`. For example, links listed in order use `linkSchema.index({ userId: 1, order: 1 })`. The `userId` prefix still serves `userId`-only queries.

## User scoping

**Every query is scoped to the signed-in user's id. A user can only ever read or change their own data.**

1. **The `userId` comes from the session, never from the client.** A Server Action or Server Component gets it from the auth helpers in `lib/auth/`. Never read `userId` from form data, URL params, search params, or a request body, even if the value looks right.
2. **Every query function takes `userId` as its first argument** and includes it in the filter. There are no unscoped helpers like `getLinkById(id)`.
3. **Look documents up by `_id` and `userId` together.** Use `findOne({ _id, userId })`, `findOneAndUpdate({ _id, userId }, …)`, and `deleteOne({ _id, userId })`, never `findById`, `findByIdAndUpdate`, or `findByIdAndDelete`. A document that exists but belongs to someone else is treated as not found.
4. **New documents get `userId` from the session**, set by the server after any client fields, so the client can't override it.
5. **Updates never change `userId`.** Build the update from an explicit list of allowed fields instead of spreading client input.

```ts
// lib/db/links.ts
import 'server-only'
import { connectToDatabase } from '@/lib/db/connect'
import { Link } from '@/lib/db/models/link'

export async function updateLinkTitle(userId: string, linkId: string, title: string) {
  await connectToDatabase()
  return Link.findOneAndUpdate(
    { _id: linkId, userId },
    { $set: { title } },
    { new: true, runValidators: true },
  ).lean()
}
```

```ts
// app/(dashboard)/dashboard/actions.ts
'use server'

import { requireUserId } from '@/lib/auth/require-user-id'
import { updateLinkTitle } from '@/lib/db/links'
import { type ActionResult, formFailure, validationFailure } from '@/lib/validation/action-result'
import { renameLinkSchema } from '@/lib/validation/link'

export async function renameLink(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId() // from the session; redirects if signed out
  const parsed = renameLinkSchema.safeParse(input) // { linkId, title }; see docs/errors-and-validation.md
  if (!parsed.success) return validationFailure(parsed.error)

  const link = await updateLinkTitle(userId, parsed.data.linkId, parsed.data.title)
  if (!link) return formFailure('That link no longer exists')
  return { ok: true, data: undefined }
}
```

Pass `runValidators: true` on every update. Mongoose runs schema validators on `save()` by default but not on update queries.

### Public profile pages

The public page at `/user/[handle]` shows a user's profile to visitors who aren't signed in, so it can't be scoped to a session. It is the one exception: a read-only lookup by `handle` that selects only public fields and never writes. Keep it in its own clearly named function (for example `getPublicProfileByHandle`) so it isn't reused for dashboard reads.

## Passing data to components

Mongoose documents aren't serializable, so they can't be passed to Client Components.

- Use `.lean()` on reads that only display data. It returns plain objects and is faster.
- Convert `_id` and `userId` to strings and drop internal fields (`__v`) before data leaves `lib/db`. Return the plain shapes defined in `lib/types/`.
- Never send `userId` or other internal ids to the client unless the UI needs them.

## Caching

With Cache Components on, database reads are dynamic by default. A component that awaits a query must sit inside a `<Suspense>` boundary or the prerender fails.

To cache a user's data, read the session outside the cached function and pass `userId` in as an argument. A plain `'use cache'` function can't call `cookies()`, and `userId` becomes part of the cache key so users never share entries. Tag the entry with a tag from `lib/db/cache-tags.ts` and clear it with `updateTag` in the Server Action after a write. Full rules, tag names, and examples are in `docs/data-fetching.md`. See `01-app/02-guides/authentication-with-cache-components.md` and `01-app/01-getting-started/09-revalidating.md`.
