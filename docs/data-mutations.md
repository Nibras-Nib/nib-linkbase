# Linkbase Data Mutations

How every write works, from the form to the database and back. This is the full pipeline in one place; the pieces it builds on are in `docs/auth.md` (session), `docs/errors-and-validation.md` (Zod and `ActionResult`), `docs/database.md` (scoped queries), and `docs/data-fetching.md` (cache tags).

---

## Rules

1. **All writes go through Server Actions.** Never a Route Handler, never `fetch` from the client. `app/api` is for webhooks and third-party callbacks only (`docs/routing.md`).
2. **Every action runs the same five steps, in order**: session, validate, scoped write, refresh, return.
3. **Expected failures are returned**, as an `ActionResult`. Unexpected errors are thrown.

## The five steps

```ts
// app/(dashboard)/dashboard/actions.ts
'use server'
import { updateTag } from 'next/cache'

import { requireUserId } from '@/lib/auth/require-user-id'
import { cacheTags } from '@/lib/db/cache-tags'
import { updateLinkForUser } from '@/lib/db/links'
import { type ActionResult, formFailure, validationFailure } from '@/lib/validation/action-result'
import { updateLinkSchema, type UpdateLinkInput } from '@/lib/validation/link'

export async function updateLink(
  _previous: ActionResult<null, keyof UpdateLinkInput> | null,
  formData: FormData,
): Promise<ActionResult<null, keyof UpdateLinkInput>> {
  // 1. Session: who is calling. Redirects to /login if signed out.
  const userId = await requireUserId()

  // 2. Validate: every input, with the matching schema from lib/validation.
  const parsed = updateLinkSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return validationFailure(parsed.error)

  // 3. Scoped write: userId from step 1, data from step 2 only.
  const { linkId, ...changes } = parsed.data
  const updated = await updateLinkForUser(userId, linkId, changes)
  if (!updated) return formFailure('That link no longer exists')

  // 4. Refresh: clear the cache tags of every view that shows this data.
  updateTag(cacheTags.links(userId))

  // 5. Return: a typed result the form can render.
  return { ok: true, data: null }
}
```

### 1. Session

`requireUserId()` is the first line of every action, before anything else runs. The action is a public POST endpoint; neither the page it's used on nor Proxy protects it. See `docs/auth.md`, "Server Actions".

### 2. Validate

Parse **all** input with the matching schema from `lib/validation/` using `safeParse`: `FormData` fields, plain arguments, and arguments bound with `.bind()`. TypeScript parameter types aren't checked at runtime. A failed parse returns `validationFailure(error)`, which the form renders next to each field. See `docs/errors-and-validation.md`.

Each action has one schema, named after the action: `createLink` → `createLinkSchema` (or a shared one like `linkInputSchema` when the input is identical).

### 3. Scoped write

The action calls a write function in `lib/db/`; it never imports a Mongoose model. Write functions follow `docs/database.md`, "User scoping":

| Operation | Pattern |
|---|---|
| Create | `Link.create({ ...data, userId })`, with `userId` set **after** the spread so input can't override it |
| Update | `findOneAndUpdate({ _id, userId }, { $set: pick(data, allowedFields) }, { new: true, runValidators: true })` |
| Delete | `deleteOne({ _id, userId })`, then check `deletedCount` |
| Bulk (reorder) | `bulkWrite` where **every** operation's filter includes `userId`, then check `matchedCount` equals the number of ids |

- Write functions take `userId` first and return `null` / `false` when nothing matched. The action turns that into `formFailure('That link no longer exists')`. A document owned by someone else is "not found", never "forbidden".
- Never `findById`, `findByIdAndUpdate`, or `findByIdAndDelete`.
- Never spread raw input into an update. `$set` only fields the schema validated and the operation allows. `userId`, `_id`, `createdAt` are never in that list.
- A write that touches several documents that must change together (moving a link between collections, deleting a profile and its links) uses a MongoDB transaction. Most Linkbase writes touch one collection and don't need one.

```ts
// lib/db/links.ts
export async function updateLinkForUser(
  userId: string,
  linkId: string,
  changes: Pick<LinkInput, 'title' | 'url'>,
): Promise<boolean> {
  await connectToDatabase()
  const link = await Link.findOneAndUpdate(
    { _id: linkId, userId },
    { $set: { title: changes.title, url: changes.url } },
    { new: true, runValidators: true },
  ).lean()
  return link !== null
}
```

### 4. Refresh

After the write succeeds, clear the cache tags of every view that shows the changed data. The tag table is in `docs/data-fetching.md`, "Clearing the cache after writes". Because the public profile read is tagged with its owner's tags, one call refreshes the dashboard **and** `/user/[handle]`.

**In Server Actions, use `updateTag`.** It clears the entries immediately, and Next.js sends the re-rendered Server Components back in the same response, so the user sees their change as soon as the action returns.

Don't use the other refresh APIs in actions:

- **`revalidateTag`** marks data stale and serves the old value while it refreshes in the background. Right after a save, the user would see the old data. It's for writes that come from outside a Server Action (webhooks), with a second argument: `revalidateTag(tag, { expire: 0 })` or `revalidateTag(tag, 'max')`. The one-argument form is deprecated.
- **`revalidatePath`** refreshes by URL, so the action has to know every URL that shows the data (including `/user/<handle>` for the public page), and it breaks silently when a route moves. In a Server Action it currently also refreshes every page the user visited before. Tags describe the data instead of the pages, so they don't have those problems.
- **`refresh()`** re-renders the current page but doesn't clear cached data, so cached reads still return the old value.

Only refresh after a successful write, and only tags built from the session's `userId` and validated data.

### 5. Return

Return `ActionResult` (`lib/validation/action-result.ts`):

- **Success**: `{ ok: true, data }`, where `data` is the minimum the UI needs (often `null`, or the new id after a create). Never a Mongoose document, never `userId`.
- **Expected failure**: `{ ok: false, fieldErrors, formError?, values? }` for invalid input, a taken handle, or a missing document.
- **Unexpected error**: thrown, not returned. Don't wrap the write in a `try` / `catch` that converts every error into a `formError`; catch only specific, known errors such as a duplicate key (`docs/errors-and-validation.md`, "Server Actions").

Annotate the return type, `Promise<ActionResult<…>>`, so a missing branch is a type error.

### Redirecting after a write

Some actions end on another page (create, then go to `/dashboard`). Call `redirect()` **after** `updateTag`, as the last line: it throws to stop the action, so nothing after it runs, and it must stay outside any `try` block.

```ts
updateTag(cacheTags.links(userId))
redirect('/dashboard')
```

## Common mutations

| Action | Input schema | Clears |
|---|---|---|
| `createLink` | `linkInputSchema` | `links(userId)` |
| `updateLink` | `updateLinkSchema` | `links(userId)` |
| `deleteLink` | `objectIdSchema` | `links(userId)` |
| `toggleLink` | `toggleLinkSchema` (`linkId`, `isActive`) | `links(userId)` |
| `reorderLinks` | `z.array(objectIdSchema).min(1).max(200)` | `links(userId)` |
| `updateProfile` | `profileInputSchema` | `profile(userId)` |
| `updateHandle` | `handleSchema` | `profile(userId)`, `handle(old)`, `handle(new)` |

`updateHandle` reads the current handle (scoped by `userId`) before the write so it can clear the old handle's tag. A duplicate key error on the unique index is returned as a field error on `handle`.

## Calling actions from the UI

| Interaction | How to call it |
|---|---|
| Form with fields | `<form action={formAction}>` with `useActionState` (`docs/errors-and-validation.md`, "Forms") |
| Single button (delete, toggle) | `startTransition(async () => setResult(await deleteLink(link.id)))` in a Client Component, then render `result.formError` if it failed |
| Drag to reorder | `startTransition(async () => setResult(await reorderLinks(ids)))` |

Don't pass an action that returns an `ActionResult` straight to `<form action>` without `useActionState`: the result is discarded, so a "That link no longer exists" message never reaches the user.

- Always go through a form action, `useActionState`, or `startTransition`. An action awaited directly in an `onClick` outside a transition doesn't show pending state, and its thrown errors skip `error.tsx`.
- Use the `pending` flag from `useActionState` or `useTransition` to disable the submit control while the action runs, so double clicks don't send two writes.
- `useOptimistic` is fine for toggles and reordering where the result is predictable. The server response replaces the optimistic state either way, including on failure.
- Pages pass actions to Client Components as props; components don't import from `app/` (`docs/architecture.md`).

## Security checklist

Before merging an action, check that:

- [ ] `requireUserId()` is the first call.
- [ ] Every argument, including bound ones, is parsed with a Zod schema from `lib/validation/`.
- [ ] `userId` comes only from the session.
- [ ] Every database filter includes `userId`; updates `$set` explicit fields only, with `runValidators: true`.
- [ ] `updateTag` clears every tag in the "Clears" column, after the write succeeds.
- [ ] The return type is `Promise<ActionResult<…>>`, and expected failures return rather than throw.
- [ ] Nothing returned or thrown includes raw error messages, stack traces, or other users' data.
- [ ] The action isn't defined inline in a component with secrets in scope. Closed-over values are encrypted and sent to the client and back; keep actions in `actions.ts` files.

Rate limiting for actions is **TBD**.
