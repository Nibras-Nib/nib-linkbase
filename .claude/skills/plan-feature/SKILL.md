---
name: plan-feature
description: Plan a new Linkbase feature before any code is written. Enters Plan Mode, produces a short technical plan (files to create or change, grounded in the /docs conventions) ending in QA scenarios, waits for explicit approval, then saves the plan to ./plans/<current-branch>.md. Use whenever the user starts planning, scoping, designing, or kicking off a new feature, page, route, model, Server Action, or component — e.g. "let's build…", "I want to add…", "plan out…", "how should we implement…", "new feature:", or a feature request with no plan yet.
---

# Plan a feature

Run this at the start of every new feature, before any code is written. The output is a short technical plan the user approves. No code, no file edits, and no installs until that approval.

## 1. Enter Plan Mode

Call `EnterPlanMode` before doing anything else. Plan Mode is read-only, so everything until approval is reading and thinking.

If the request is too vague to plan (unclear what the feature does or who uses it), ask one round of focused questions with `AskUserQuestion`, then continue.

## 2. Read the conventions

Read these on every feature:

- `docs/architecture.md`: directory layout, Server vs Client Components, naming.
- `docs/coding-standards.md`: TypeScript, imports, exports, error handling.
- The `vercel-react-best-practices` skill, whenever the feature adds or changes React components, pages, data loading, or Server Actions. Plan Suspense boundaries, parallel data loading, and the client/server split with its rules in mind (see "React performance rules" in `CLAUDE.md`).

Then read the feature-area docs the feature touches:

| The feature involves… | Read |
| --- | --- |
| A collection, model, or query | `docs/database.md`, `docs/data-fetching.md` |
| Any write (create, update, delete) | `docs/data-mutations.md`, `docs/errors-and-validation.md` |
| A new page, route, layout, or Route Handler | `docs/routing.md` |
| Sessions, sign-in, ownership, or a public page | `docs/auth.md` |
| Components or page layout | `docs/ui.md`, `docs/design-system.md` |
| User content, outbound links, env vars, headers, or rate limits | `docs/security.md` |

Also read the existing code the feature will touch, and the bundled Next.js page for any Next.js API the plan uses (`node_modules/next/dist/docs/01-app/`). Don't plan around APIs you haven't checked.

## 3. Write the plan

Keep it short, about one screen. Use this structure:

```markdown
# <Feature name>

**Branch:** <output of `git branch --show-current`>
**Goal:** <one or two sentences: what the user can do when this ships>

## Docs referenced
- `docs/architecture.md`: <the convention that shapes this plan>
- `docs/database.md`: <…>
- `docs/<feature-area>.md`: <…>

## Files
| File | Action | Purpose |
| --- | --- | --- |
| `lib/db/models/link.ts` | create | Link schema + indexes |
| `app/(dashboard)/links/page.tsx` | change | … |

## Approach
<A few bullets on data flow, the Server/Client split, cache tags, and any decision a reviewer should check. Cite the doc that dictates each non-obvious choice.>

## Open questions
<Only if any remain. Otherwise omit this section.>

## QA Scenarios
1. **Happy path:** <what the user does> → <what should happen>
2. **Auth boundary:** <signed out, or acting on another user's data> → <what should happen>
3. **Validation:** <invalid or missing input> → <what should happen>
4. **Edge case:** <empty state, duplicate, limit, slow network…> → <what should happen>
```

QA Scenarios rules:

- Write 3–6 scenarios, one line each: what the user does, then what should happen.
- Always cover at least one each of happy path, auth boundary, validation, and edge case.
- Be concrete: name the page, the input, and the visible result or error message. Write "Submitting an empty URL shows 'URL is required' under the field", not "validation works".

## 4. Wait for explicit approval

Present the plan with `ExitPlanMode`. The user must explicitly approve it.

- If they ask for changes, revise the plan and present it again.
- Don't treat silence, a question, or partial agreement as approval.
- Until approval: no code, no file writes, no package installs, no branch changes.

## 5. Save the approved plan

Once approved, and before writing any feature code:

1. Run `git branch --show-current` to get the branch name. If it prints nothing (detached HEAD), ask the user what to name the file.
2. Write the approved plan, exactly as approved, to `./plans/<branch>.md`. A branch like `feat/link-crud` becomes `plans/feat/link-crud.md`. Create any missing parent folders.
3. If that file already exists, read it first and ask whether to overwrite it or add the new plan as a dated section.
4. Tell the user the path, then hand off to implementation.
