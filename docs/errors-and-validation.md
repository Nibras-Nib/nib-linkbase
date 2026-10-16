# Linkbase Errors and Validation

How input is validated, how failures reach the user, and how unexpected errors are logged. Read `docs/routing.md` for where Server Actions and `error.tsx` files live, `docs/auth.md` for the session check every action starts with, and `docs/coding-standards.md` ("Errors") for how errors are thrown.

Zod is not installed yet. Add it with `npm install zod` when the first schema is written. The examples use Zod 4.

---

## Two kinds of failure

| | Expected failure | Unexpected error |
|---|---|---|
| **Examples** | Empty title, invalid URL, handle already taken, link already deleted | Database down, bug, broken invariant, failed third-party call |
| **Can the user fix it?** | Yes, by changing the input or retrying | No |
| **How it's handled** | **Returned** as a typed `ActionResult`, never thrown | **Thrown** as an `Error` |
| **What the user sees** | A message next to the field or at the top of the form | The nearest `error.tsx` |
| **Logged?** | No | Yes, with context |

If a failure needs a message the user can act on, return it. If it means something is broken, throw.

## Validation with Zod

**Every Server Action validates all of its input with Zod before touching the database.** That includes `FormData`, plain arguments (`deleteLink(linkId)`), and arguments bound with `.bind()`. TypeScript types on a Server Action's parameters are not checked at runtime: the action is a public POST endpoint and the client can send anything.

The order inside every action is fixed:

1. `requireUserId()`: who is calling (`docs/auth.md`).
2. `schema.safeParse(input)`: is the input valid. Return field errors if not.
3. Scoped database call with the parsed data only.
4. Invalidate cache tags, return success.

Use `safeParse`, never `parse`. `parse` throws, which would turn a user's typo into an unexpected error.

Zod checks input at the boundary; the Mongoose schema stays the final authority on what's stored (`docs/database.md`). Keep the two consistent: a Zod rule with no matching Mongoose rule can be bypassed by any code path that skips the action, and a Mongoose rule with no Zod rule surfaces as an unexpected error instead of a field message.

### Shared schemas: `lib/validation/`

```
lib/validation/
  action-result.ts       ActionResult type and helpers
  common.ts              Reusable fields: objectId, handle, url
  link.ts                Link input schemas
  profile.ts             Profile input schemas
```

Schemas live in `lib/validation/` so the Server Action, and the form when it wants client-side hints, use the same rules. Files are named after the entity, kebab-case. Export the schema and its inferred input type together.

```ts
// lib/validation/common.ts
import { z } from 'zod'

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, { error: 'Invalid id' })

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_-]{3,30}$/, {
    error: 'Use 3–30 letters, numbers, dashes or underscores',
  })

// Only http(s): blocks javascript: and data: URLs, which would run in visitors' browsers
export const linkUrlSchema = z.url({ protocol: /^https?$/, error: 'Enter a full URL starting with https://' })
```

```ts
// lib/validation/link.ts
import { z } from 'zod'

import { linkUrlSchema, objectIdSchema } from '@/lib/validation/common'

const linkTitleSchema = z
  .string()
  .trim()
  .min(1, { error: 'Add a title' })
  .max(100, { error: 'Keep it under 100 characters' })

export const linkInputSchema = z.object({
  title: linkTitleSchema,
  url: linkUrlSchema,
})

export const renameLinkSchema = z.object({
  linkId: objectIdSchema,
  title: linkTitleSchema,
})

export type LinkInput = z.infer<typeof linkInputSchema>
```

- `lib/validation/` contains schemas and the result type only. No database access and no `server-only`, so Client Components can import it.
- Error copy follows `docs/ui.md`: say how to fix it ("Add a title"), not what's wrong ("Invalid input").
- Parse `FormData` with `Object.fromEntries(formData)` for flat forms. Never pass the raw `FormData` or the unparsed object to `lib/db`.
- Schemas are strict about what they accept but never echo input back in messages.

## The result type

```ts
// lib/validation/action-result.ts
import { z } from 'zod'

export type FieldErrors<TFields extends string = string> = Partial<Record<TFields, string[]>>

export type ActionResult<TData = undefined, TFields extends string = string> =
  | { ok: true; data: TData }
  | {
      ok: false
      fieldErrors: FieldErrors<TFields>
      formError?: string
      values?: Partial<Record<TFields, string>>
    }

export function validationFailure<TFields extends string>(
  error: z.ZodError,
  values?: Partial<Record<TFields, string>>,
): ActionResult<never, TFields> {
  return {
    ok: false,
    fieldErrors: z.flattenError(error).fieldErrors as FieldErrors<TFields>,
    values,
  }
}

export function formFailure(formError: string): ActionResult<never> {
  return { ok: false, fieldErrors: {}, formError }
}
```

- `fieldErrors` is keyed by field name and rendered next to that field.
- `formError` is for failures that aren't about one field ("That link was already deleted"). It's always a fixed string written for the user, never `error.message`.
- `values` carries back what the user typed. React resets uncontrolled forms after an action, so the form uses `values` as `defaultValue` to keep input on failure.
- `data` is the minimum the UI needs. Never return a Mongoose document, internal ids the UI doesn't use, or `userId`.

## Server Actions

```ts
// app/(dashboard)/add-links/actions.ts
'use server'
import { updateTag } from 'next/cache'

import { requireUserId } from '@/lib/auth/require-user-id'
import { cacheTags } from '@/lib/db/cache-tags'
import { createLinkForUser } from '@/lib/db/links'
import { type ActionResult, validationFailure } from '@/lib/validation/action-result'
import { linkInputSchema, type LinkInput } from '@/lib/validation/link'

export type CreateLinkResult = ActionResult<{ id: string }, keyof LinkInput>

export async function createLink(
  _previous: CreateLinkResult | null,
  formData: FormData,
): Promise<CreateLinkResult> {
  const userId = await requireUserId()

  const input = Object.fromEntries(formData)
  const parsed = linkInputSchema.safeParse(input)
  if (!parsed.success) {
    return validationFailure(parsed.error, { title: String(input.title ?? ''), url: String(input.url ?? '') })
  }

  const link = await createLinkForUser(userId, parsed.data)
  updateTag(cacheTags.links(userId))
  return { ok: true, data: { id: link.id } }
}
```

There's no `try` / `catch` around `createLinkForUser`. If the database fails, the error propagates to the error boundary and gets logged. Catch only to turn a **specific, known** error into an expected failure:

```ts
// lib/db/profiles.ts: duplicate handle is expected, everything else rethrows
try {
  await Profile.updateOne({ userId }, { $set: { handle } }, { runValidators: true })
} catch (error) {
  if (error instanceof mongo.MongoServerError && error.code === 11000) {
    return { ok: false, fieldErrors: { handle: ['That handle is taken. Try another.'] } }
  }
  throw error
}
```

Rules:

- Never `catch` and return a generic `formError` for every error. That hides bugs from the logs.
- Never return `String(error)`, `error.message`, or `error.stack`.
- A document that isn't found (or belongs to someone else, per `docs/database.md`) is an expected failure: `return formFailure('That link no longer exists')`.
- `redirect()` and `notFound()` throw on purpose. Keep them outside any `try` block.

## Forms

Forms that call an action are Client Components using `useActionState`. Each field shows its own error, connected with `aria-describedby` and `aria-invalid` (`docs/ui.md`, Accessibility).

```tsx
// components/links/add-link-form.tsx
'use client'

import { useActionState } from 'react'

import type { ActionResult } from '@/lib/validation/action-result'
import type { LinkInput } from '@/lib/validation/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CreateLinkResult = ActionResult<{ id: string }, keyof LinkInput>

type AddLinkFormProps = {
  action: (previous: CreateLinkResult | null, formData: FormData) => Promise<CreateLinkResult>
}

export function AddLinkForm({ action }: AddLinkFormProps) {
  const [state, formAction, pending] = useActionState(action, null)
  const failure = state?.ok === false ? state : undefined

  return (
    <form action={formAction} noValidate>
      {failure?.formError && <p role="alert">{failure.formError}</p>}

      <Input
        name="title"
        label="Title"
        defaultValue={failure?.values?.title}
        error={failure?.fieldErrors.title?.[0]}
      />
      <Input
        name="url"
        label="URL"
        type="url"
        defaultValue={failure?.values?.url}
        error={failure?.fieldErrors.url?.[0]}
      />

      <Button type="submit" disabled={pending}>Add link</Button>
    </form>
  )
}
```

The page passes the action in: `<AddLinkForm action={createLink} />`. Components don't import from `app/`, so the action stays with its route.

`Input` renders `error` as its hint in the error style and sets `aria-invalid` and `aria-describedby` when it's present.

Call actions through a form `action`, `useActionState`, or `startTransition`. An error thrown by an action called that way reaches the nearest `error.tsx`. An action awaited directly in an `onClick` handler doesn't: error boundaries don't catch errors in event handlers.

Client-side validation is optional, for faster feedback only. It may reuse the schema from `lib/validation/`, but the server check always runs.

## Unexpected errors

Throw an `Error` with a message that says what failed, and keep the original as `cause`:

```ts
throw new Error('Failed to reorder links', { cause: error })
```

The thrown error reaches the nearest `error.tsx` (`docs/routing.md`, "Per-route files"): `(dashboard)/error.tsx` for dashboard pages and actions, `global-error.tsx` if the root layout fails.

### What reaches the client

- In production, Next.js replaces the message of any error thrown on the server with a generic one, and adds a `digest`: a hash that matches the server log entry. `error.tsx` shows a fixed, friendly message and may show the digest as a reference code. It never renders `error.message` or `error.stack`.
- Route Handlers return a fixed body (`{ error: 'Internal error' }`) with status `500`. Never serialize the caught error into the response.
- Expected failures carry only strings written for the user.

### Logging

Server errors are logged in one place: `onRequestError` in `instrumentation.ts` at the repo root. Next.js calls it for every uncaught error in rendering, Server Actions, Route Handlers and Proxy, so actions don't log and rethrow (that logs everything twice).

```ts
// instrumentation.ts
import type { Instrumentation } from 'next'

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const err = error instanceof Error ? error : new Error(String(error))

  console.error(
    JSON.stringify({
      level: 'error',
      message: err.message,
      digest: 'digest' in err ? String(err.digest) : undefined,
      stack: err.stack,
      cause: err.cause instanceof Error ? { message: err.cause.message, stack: err.cause.stack } : err.cause,
      route: context.routePath, // e.g. /(dashboard)/add-links
      routeType: context.routeType, // render | route | action | proxy
      method: request.method,
      path: request.path,
    }),
  )
}
```

Logs are JSON, one object per line, so they can be searched by `digest` and route. Swap `console.error` for an error-tracking service later; keep the fields.

To make an error debuggable, put the context in the message or `cause` when throwing: what operation failed and on which ids (`linkId`, `userId`). Ids are fine to log. **Never log** request headers, cookies, session tokens, `AUTH_SECRET`, OAuth tokens, connection strings, or the full form payload.

Client-side errors (in event handlers or effects) go to `console.error` in the `error.tsx` `useEffect` for now. Wiring them to the same log destination is **TBD**.
