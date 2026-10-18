---
name: create-feature
description: Build a Linkbase feature from its approved plan in ./plans/<current-branch>.md, following the /docs conventions and live library docs from Context7. Writes code only — no tests, no QA, no commits — then stops with a 2–3 line report. Use whenever the user starts building or implementing a feature whose plan is approved — e.g. "build it", "implement the plan", "let's start coding", "go ahead", "plan approved, start", "create the feature", or right after plan-feature saves a plan.
---

# Build a feature

Run this after a plan is approved. The job is to turn the plan into code that follows the project conventions, then stop. It writes code only.

Out of scope for this skill, even if it seems helpful:

- No tests. Don't create test files or install a test runner. The user triggers `write-tests` separately.
- No QA. Don't walk through the plan's QA Scenarios, start a dev server to click through, or open a browser. The user triggers `run-qa-suite` separately.
- No commits, pushes, branches, or PRs.

## 1. Load the approved plan

1. Run `git branch --show-current` and read `./plans/<branch>.md` (a branch like `feat/link-crud` maps to `plans/feat/link-crud.md`).
2. If the file doesn't exist, check whether an approved plan is already in this conversation. If neither exists, stop and suggest running `plan-feature` first. Don't build from an unapproved or improvised plan.
3. Treat the plan's **Files** table as the scope. Building something it doesn't list is scope creep; skipping something it lists is an incomplete build.

## 2. Read the conventions

Read these on every feature:

- `docs/architecture.md`: directory layout, Server vs Client Components, naming.
- `docs/coding-standards.md`: TypeScript, imports, exports, error handling.
- The `vercel-react-best-practices` skill, whenever the feature adds or changes React components, pages, data loading, or Server Actions. Apply its rules within the project conventions (see "React performance rules" in `CLAUDE.md`).

Then read every doc listed under the plan's **Docs referenced**, plus any feature-area doc it touches that the plan missed:

| The feature involves… | Read |
| --- | --- |
| A collection, model, or query | `docs/database.md`, `docs/data-fetching.md` |
| Any write (create, update, delete) | `docs/data-mutations.md`, `docs/errors-and-validation.md` |
| A new page, route, layout, or Route Handler | `docs/routing.md` |
| Sessions, sign-in, ownership, or a public page | `docs/auth.md` |
| Components or page layout | `docs/ui.md`, `docs/design-system.md` |
| User content, outbound links, env vars, headers, or rate limits | `docs/security.md` |

Also read the existing files the plan changes before editing them, and any existing code nearby so new code matches it.

## 3. Pull live library docs

Before writing code against any library, check its installed version in `package.json` and pull current docs:

- **Next.js:** read the bundled page in `node_modules/next/dist/docs/01-app/` for every Next.js API you use (Cache Components, `"use cache"`, `cacheTag` / `updateTag`, `proxy.ts`, `params` behind `<Suspense>`, etc.). These match the installed version and take precedence. Use Context7 only to supplement.
- **Everything else** (React, Mongoose, Auth.js, Zod, Tailwind CSS, …): Context7 `resolve-library-id`, then `query-docs` for the specific APIs you're about to use, for the installed version.
- If Context7 has no entry for a library or version, say so and name the source used instead (bundled docs, the package README, or its type definitions in `node_modules`).
- If Context7 fails to connect, say so. Don't silently fall back to training data.

## 4. Build

Work through the plan's Files table in dependency order: types and validation schemas, then models and `lib/db` queries, then Server Actions, then components, then pages and routes.

Hold to the conventions the docs set, especially:

- Every Server Action follows the five steps in `docs/data-mutations.md`: session via `requireUserId()`, Zod validation, `userId`-scoped write, `updateTag` for the tags it clears, and an `ActionResult` return.
- Reads happen in Server Components through `lib/db`, never through internal API calls; caching uses `"use cache"` with `cacheTag` / `cacheLife` as `docs/data-fetching.md` describes.
- Uncached data access and `params` / `searchParams` reads sit behind `<Suspense>`.
- Colors, type, and spacing come from the theme tokens in `docs/design-system.md`; components follow the specs in `docs/ui.md`.
- User content is escaped, URLs are protocol-checked, and outbound links carry `rel="noopener noreferrer"` (`docs/security.md`).
- New env vars go in `.env.example`.

If the plan turns out to be wrong or incomplete (an API doesn't work as planned, a file it needs is missing, a convention conflicts with it), stop and ask before deviating. Small mechanical additions the plan clearly implies, like an import or a barrel export, are fine without asking.

Install a package only if the plan names it. Otherwise ask first.

## 5. Check it compiles

Run the static checks so you hand back code that builds, and fix what they report in the code you wrote:

```bash
npx next typegen && npx tsc --noEmit
npm run lint
```

These are compile checks, not QA. Don't run the QA Scenarios, start the dev server, or write tests.

If a failure comes from code outside this feature, leave it and mention it in the report.

## 6. Stop and report

Stop once the build is done. Report in 2–3 lines:

- What was built (the user-facing capability) and the main files created or changed.
- Any deviation from the plan, Context7 gap, or check that still fails. Omit this line if there's nothing to flag.

Then hand back. Don't offer to write tests, run QA, or commit. The user triggers `write-tests` and `run-qa-suite` when ready.
