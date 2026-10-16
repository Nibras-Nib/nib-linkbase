# Linkbase Git Conventions

How commits, branches and pull requests are named and merged. These rules apply to everyone who commits, including AI coding agents.

The repository is on GitHub (`origin`); `main` is the default branch.

---

## Rules

1. **Never commit straight to `main`.** All work lands through a pull request.
2. **One feature or fix per branch**, named `<type>/<short-description>`.
3. **Commits follow Conventional Commits** with a short, imperative subject.
4. **Every PR needs an approving review from a human** before it's merged. Passing checks or an AI review don't replace it.

## Commits

Format:

```
<type>(<optional scope>): <subject>

<optional body>

<optional trailers>
```

### Types

| Type | Use for | Example |
|---|---|---|
| `feat` | A new feature or user-visible behaviour | `feat(links): add drag-to-reorder` |
| `fix` | A bug fix | `fix(auth): redirect to callback url after sign-in` |
| `docs` | Documentation only (`docs/`, `CLAUDE.md`, README, comments) | `docs: add security guidelines` |
| `refactor` | A code change that neither fixes a bug nor adds a feature | `refactor(db): extract scoped link queries` |
| `test` | Adding or fixing tests only | `test(validation): cover link url protocols` |
| `chore` | Tooling, config, dependencies, build, CI, formatting | `chore: add prettier config` |

Use only these six types. A change that fits more than one is probably two commits.

### Subject

- **Imperative mood**: "add", "fix", "remove", as in "this commit will *add* …". Not "added" or "adds".
- **Lowercase, no trailing period**, 72 characters or fewer including the type.
- **Say what changes, not how**: `fix(auth): keep callback url on sign-in redirect`, not `fix: update proxy.ts`.
- **Scope is optional** and names the area: `auth`, `links`, `profile`, `db`, `validation`, `ui`. Leave it out when the change is app-wide.

### Body and trailers

- Add a body when the *why* isn't obvious from the subject: the problem, the reason for the approach, anything a reviewer or a future reader would ask. Wrap at 72 characters.
- **Breaking changes**: add `!` after the type or scope (`feat(db)!: rename links collection`) and a `BREAKING CHANGE:` trailer that says what breaks and how to migrate.
- Reference issues with a trailer: `Closes #12`.
- AI-assisted commits keep the tool's `Co-Authored-By:` trailer.

```
fix(auth): keep callback url on sign-in redirect

Proxy dropped the query string when building the callback url, so
users returning to /dashboard?tab=links landed on the default tab.

Closes #18
```

### What goes in a commit

- One logical change per commit. It should build, lint and type-check on its own.
- Never commit secrets, `.env.local`, or generated output (`.next/`). See `docs/security.md`.
- Don't mix formatting-only changes with behaviour changes; put reformatting in its own `chore` commit.

## Branches

Name branches `<type>/<short-description>`, using the commit types:

```
feat/add-links
feat/public-profile
fix/session-redirect
refactor/scoped-link-queries
docs/security-guidelines
chore/prettier-setup
```

- **Lowercase kebab-case**, a few words, no issue numbers or personal names.
- **One feature or fix per branch.** Unrelated work gets its own branch, even when it's small.
- **Branch from an up-to-date `main`**: `git switch main && git pull && git switch -c feat/add-links`.
- **Keep branches short-lived.** Rebase on `main` when it moves (`git fetch && git rebase origin/main`) rather than merging `main` into the branch.
- Delete the branch after its PR is merged.

## Pull requests

### Opening a PR

- **Title** follows the commit format (`feat(links): add drag-to-reorder`). It becomes the commit message on `main` when squashed.
- **Description** covers what changed, why, how it was tested, and anything the reviewer should look at closely (a security-sensitive path, a migration, a CSP change). Include screenshots for UI changes.
- **Before requesting review**, run `npm run lint`, `npx next typegen && npx tsc --noEmit`, and `npm run build` locally. Run tests too, once a test runner exists.
- **Keep PRs small** enough to review in one sitting. Split large features into stacked PRs or behind a flag.
- Open a **draft PR** for early feedback; mark it ready when it meets the points above.

### Review

- **A human approves every PR before it merges.** AI agents may write code, open PRs and leave review comments, but never approve or merge.
- The author doesn't approve their own PR.
- Reviewers check the change against the docs it touches, especially the checklists in `docs/data-mutations.md` (Server Actions) and `docs/auth.md`.
- Address every comment with a change or a reply. Push fixes as new commits during review so the reviewer can see what changed; they're squashed on merge.
- New commits after approval need a fresh look from the reviewer.

### Merging

- **Squash and merge**, so each PR becomes one Conventional Commit on `main` and `main` reads as a list of features and fixes. The squash commit uses the PR title as its subject.
- Merge only when checks pass, the branch is up to date with `main`, and every conversation is resolved.
- **Never force-push `main`.** Force-pushing your own feature branch after a rebase is fine (`git push --force-with-lease`), but not while someone else is working on it.
- If a merged change has to be undone, revert it with a new PR (`git revert`), never by rewriting `main`.

## Protecting `main`

Set these in GitHub (Settings → Branches → branch protection rule for `main`) so the rules above are enforced, not just written down:

- Require a pull request before merging, with at least **1 approving review**.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution before merging.
- Require status checks to pass (lint, type-check, build) once CI is set up.
- Require branches to be up to date before merging.
- Block force pushes and deletions.
- Allow squash merging only (Settings → General → Pull Requests).
