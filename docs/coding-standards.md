# Linkbase Coding Standards

How code is written in this repo. `docs/architecture.md` covers where code goes and how files are named; this file covers what goes inside them.

Tooling is the source of truth. A rule enforced by TypeScript, ESLint, or Prettier doesn't need defending in review. The rest are checked in review.

---

## TypeScript

All code is TypeScript (`.ts`, `.tsx`). Don't add `.js` or `.jsx` files to `app/`, `components/`, or `lib/`. Config files may stay `.mjs` where the tool expects it.

`strict` is on in `tsconfig.json` and stays on. Don't loosen it per file or per folder.

Type-check with:

```bash
npx next typegen && npx tsc --noEmit
```

### No `any`

`any` switches type checking off and spreads to everything it touches. `@typescript-eslint/no-explicit-any` reports it as an error.

| Instead of `any` | Use |
|---|---|
| Value of unknown shape (parsed JSON, `catch` error, third-party input) | `unknown`, then narrow with `typeof`, `instanceof`, or a schema |
| Function that works on any type | A generic: `function first<T>(items: T[]): T \| undefined` |
| Object with arbitrary keys | `Record<string, unknown>` |
| Library type that's wrong or missing | A typed wrapper or a module augmentation in `lib/types/` |

```ts
// Bad
function parse(input: any) {
  return input.title
}

// Good
function parse(input: unknown): string {
  if (typeof input === 'object' && input !== null && 'title' in input && typeof input.title === 'string') {
    return input.title
  }
  throw new Error('Invalid input: missing title')
}
```

### Type assertions

Prefer narrowing to `as`. An `as` tells the compiler to stop checking, so it needs the same justification as a suppression comment. Never use `as unknown as T` to force an incompatible type through.

### Suppression comments

Prefer `@ts-expect-error` over `@ts-ignore`: it fails the build once the error it suppresses goes away, so stale suppressions don't pile up. Either one must be followed by a description of why the error is wrong or unavoidable, and a link to the upstream issue if there is one.

```ts
// Bad
// @ts-ignore
widget.render(node)

// Good
// @ts-expect-error -- widget-lib@2.1 types omit render(); fixed upstream in #482
widget.render(node)
```

The same applies to `eslint-disable` comments: disable one rule on one line (`eslint-disable-next-line <rule> -- reason`), never a whole file.

## Formatting

Prettier formats every file. Don't hand-format, and don't argue about formatting in review.

Prettier is not installed yet. Add it with `npm install -D prettier eslint-config-prettier` and this config, which matches the code samples in `docs/`:

```json
// .prettierrc.json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

`eslint-config-prettier` goes last in `eslint.config.mjs` so ESLint's stylistic rules don't fight Prettier. Add a `format` script (`prettier --write .`) and set your editor to format on save.

## Linting

ESLint uses the Next.js config (`eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`) in `eslint.config.mjs`. Run `npm run lint` before committing. Lint errors are fixed, not suppressed.

The Next.js config doesn't cover every rule in this file. These additions enforce the rest:

```js
// eslint.config.mjs (additions)
{
  rules: {
    'import/order': ['error', {
      groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
      pathGroups: [
        { pattern: '@/lib/**', group: 'internal', position: 'before' },
        { pattern: '@/components/**', group: 'internal' },
        { pattern: '@/**', group: 'internal', position: 'after' },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
      distinctGroup: false, // no blank line between @/lib and @/components
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    }],
    'import/no-default-export': 'error',
    '@typescript-eslint/ban-ts-comment': ['error', {
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': 'allow-with-description',
    }],
    'no-throw-literal': 'error',
    'no-restricted-syntax': ['error', {
      selector: "CallExpression[callee.property.name='then']",
      message: 'Use async/await instead of .then().',
    }],
  },
},
{
  // Next.js requires default exports from these files
  files: [
    'app/**/{page,layout,template,default,loading,error,global-error,not-found,forbidden,unauthorized}.tsx',
    'app/**/{opengraph-image,twitter-image,icon,apple-icon}.tsx',
    'app/**/{sitemap,robots,manifest}.ts',
    'proxy.ts',
    '*.config.{ts,mjs}',
  ],
  rules: { 'import/no-default-export': 'off' },
},
```

## Imports

Imports come in three groups, separated by a blank line, alphabetized within each group:

1. **External packages**: Node built-ins, `react`, `next`, and anything from `node_modules`.
2. **Internal aliases**: `@/lib/...`, then `@/components/...`, then other `@/` paths.
3. **Relative imports**: `./` and `../`.

```ts
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { requireUserId } from '@/lib/auth/require-user-id'
import { getLinksForUser } from '@/lib/db/links'
import { Card } from '@/components/ui/card'

import { LinkList } from './link-list'
```

- Use `@/` for anything outside the current feature folder. Use relative imports only for files in the same folder or a direct child; never climb more than one level (`../../`).
- Use `import type` for imports used only as types.
- `'use client'`, `'use server'`, and `import 'server-only'` go at the very top, above all other imports.

## Components

Components are **function declarations** with a named export and typed props.

```tsx
// components/links/link-row.tsx
import { Badge } from '@/components/ui/badge'

type LinkRowProps = {
  title: string
  url: string
  isActive: boolean
}

export function LinkRow({ title, url, isActive }: LinkRowProps) {
  return (
    <li>
      <a href={url}>{title}</a>
      {!isActive && <Badge>Hidden</Badge>}
    </li>
  )
}
```

- Use `function`, not `const LinkRow = () => …` and not `React.FC`.
- Props are a `type` named `<Component>Props`, declared above the component. Export it only when another file needs it.
- Destructure props in the parameter list.
- `children` is typed as `React.ReactNode` (`import type { ReactNode } from 'react'`).
- Return types are inferred for components. Annotate the return type of exported non-component functions in `lib/`.

### Default exports

**Named exports only**, except where Next.js requires a default export: `page.tsx`, `layout.tsx`, `template.tsx`, `default.tsx`, `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, metadata image and file routes, `proxy.ts`, and config files. Route Handlers (`route.ts`) use named `GET` / `POST` exports.

A route file's default export is still a named function declaration:

```tsx
// app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  // …
}
```

## Async code

Use `async` / `await`. Never chain `.then()`, `.catch()`, or `.finally()`.

```ts
// Bad
export function getMongoClient() {
  return connectToDatabase().then((mongoose) => mongoose.connection.getClient())
}

// Good
export async function getMongoClient() {
  const mongoose = await connectToDatabase()
  return mongoose.connection.getClient()
}
```

- Run independent work in parallel with `await Promise.all([...])`, not sequential `await`s.
- Don't leave promises floating. Either `await` them or, for deliberate fire-and-forget work, use `after()` from `next/server`.
- Handle errors with `try` / `catch` around the `await`, not `.catch()`.

## Errors

Throw `Error` objects (or subclasses), never strings or plain objects. Only `Error` carries a stack trace, and `catch` blocks can rely on `instanceof Error`.

```ts
// Bad
throw 'Link not found'
throw { code: 404 }

// Good
throw new Error('Link not found')
```

- Messages say what failed, in plain words: `'Link not found'`, `'MONGODB_URI is not set'`.
- When rethrowing, keep the original as the cause: `throw new Error('Failed to save link', { cause: error })`.
- Caught errors are `unknown`. Narrow before reading them: `if (error instanceof Error) …`.
- Don't put secrets, tokens, or another user's data in error messages; they can reach logs and, in development, the browser.
- `redirect()` and `notFound()` work by throwing. Don't wrap them in a `try` / `catch` that swallows the throw; call them outside the `try` block.
