# Linkbase Security

App-wide security rules: secrets, HTTP headers, rate limiting, and rendering user content safely. Access control (who can read and write what) is in `docs/auth.md` and `docs/data-mutations.md`; input validation is in `docs/errors-and-validation.md`.

---

## Secrets

**Secrets live in environment variables only.** Never in code, config files, docs, tests, or commit history.

| File | Committed | Contains |
|---|---|---|
| `.env.example` | **Yes** | Every variable the app reads, with empty or placeholder values and a comment on where to get each one |
| `.env.local` | **No** | Real values for local development |
| Hosting provider's env settings | n/a | Real values for preview and production |

`.gitignore` ignores `.env*`, which also ignores the template. Add an exception so it can be committed:

```gitignore
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

```bash
# .env.example — copy to .env.local and fill in. Never put real values in this file.

# MongoDB connection string (Atlas: Database → Connect → Drivers)
MONGODB_URI=

# Session encryption key, at least 32 random bytes: npx auth secret
AUTH_SECRET=

# Only when the canonical URL can't be inferred, e.g. self-hosted behind a reverse proxy
# AUTH_URL=https://linkbase.me
```

Rules:

- **Add a variable to `.env.example` in the same change that first reads it.**
- **Server code reads secrets; client code never does.** Only `NEXT_PUBLIC_` variables reach the browser, and they're inlined into the JavaScript bundle at build time. Never give a secret a `NEXT_PUBLIC_` prefix.
- **Fail fast when a variable is missing.** Code that needs a secret throws at startup if it isn't set (as `lib/db/connect.ts` does for `MONGODB_URI`), instead of failing on the first request.
- **Use separate values per environment.** Development, preview and production each get their own database user and `AUTH_SECRET` (and their own OAuth app, if one is added).
- **A leaked secret is rotated, not just deleted.** Removing it from the repo doesn't remove it from git history, forks or caches. Rotate it with the provider first, then clean up.
- **Running more than one server instance?** Set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` so all instances encrypt Server Action closures with the same key (`01-app/02-guides/data-security.md`).

## Security headers

Headers are set for every route in `next.config.ts` (the project's config is TypeScript, not `next.config.js`).

```ts
// next.config.ts
import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  // …existing options
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default nextConfig
```

| Header | What it stops |
|---|---|
| `Content-Security-Policy` | Loading scripts, styles, images, frames and form targets from origins we didn't list. Limits what injected markup can do. |
| `X-Frame-Options: DENY` | Other sites framing Linkbase (clickjacking). `frame-ancestors 'none'` does the same for modern browsers; keep both for older ones. |
| `Referrer-Policy: strict-origin-when-cross-origin` | Leaking full URLs (paths, query strings) to other sites. |
| `X-Content-Type-Options: nosniff` | Browsers guessing a file's type and running it as script. |
| `Permissions-Policy` | Pages using camera, microphone or location. Linkbase needs none. |
| `Strict-Transport-Security` | Downgrades to plain HTTP after the first visit. Skip it if the host already sends it; only add `preload` once the whole domain is HTTPS-only. |

### Why the CSP allows `'unsafe-inline'` scripts

Next.js puts inline scripts in every page. A CSP without `'unsafe-inline'` needs a fresh nonce per request, and nonces require every page to render dynamically. That doesn't work with Partial Prerendering, which Cache Components uses for every route (`01-app/02-guides/content-security-policy.md`). So the policy allows inline scripts and relies on the other layers below to keep injected scripts out: React escaping, no `dangerouslySetInnerHTML`, and URL validation. Experimental Subresource Integrity (`experimental.sri`) can tighten this later.

### Changing the policy

- **Adding an OAuth provider** means adding its authorization origin to `form-action`. Some browsers apply `form-action` to the redirect after a form posts, which would otherwise block sign-in.
- **Loading anything from another origin** (images, analytics, embeds) means adding that origin to the matching directive, narrowly: `img-src https://avatars.githubusercontent.com`, not `img-src https:`.
- Profile images from OAuth providers go through `next/image` with `images.remotePatterns`, so the browser loads them from `'self'`.
- Test changes in a production build (`npm run build && npm run start`); the dev policy is looser. Check the browser console for CSP violations on every route.

## Rate limiting

Rate limits stop brute force, spam and runaway clients. Sign-in attempts and link creation are limited from the start; sign-up is limited too, since it's an unauthenticated write:

| Operation | Key | Limit | Where it's enforced |
|---|---|---|---|
| Sign-in attempts | Client IP | 10 per 15 minutes | The sign-in Server Action in `app/(auth)/actions.ts`, and `POST` in `app/api/auth/[...nextauth]/route.ts` |
| Sign-up | Client IP | 5 per hour | The sign-up Server Action in `app/(auth)/actions.ts` |
| Link creation | `userId` | 30 per hour, and 100 links per user in total | `createLink` Server Action |

Limits are defined once in the `rateLimits` map in `lib/security/rate-limit.ts`; actions pass `rateLimits.<name>` rather than inline numbers.

Limits are counted in MongoDB, so they hold across server restarts and instances without new infrastructure:

```
lib/security/
  rate-limit.ts          rateLimit(key, { limit, windowSeconds }): { ok, retryAfterSeconds }
lib/db/models/
  rate-limit.ts          { key, windowStart, count, expiresAt } with a TTL index on expiresAt
```

`rateLimit` increments a per-window counter atomically (`findOneAndUpdate` with `$inc` and `upsert`) and reports whether the count is over the limit. MongoDB's TTL index deletes expired windows.

In Server Actions, a limit hit is an **expected failure**, so it's returned, not thrown:

```ts
// in createLink, after requireUserId() and before validation
const limit = await rateLimit(`create-link:${userId}`, rateLimits.createLink)
if (!limit.ok) return formFailure("You're adding links quickly. Try again in a few minutes.")
```

In the Auth.js Route Handler, wrap `POST` and return `429 Too Many Requests` with a `Retry-After` header. `GET` stays unwrapped, because OAuth providers call back with `GET`.

- **Client IP** comes from `x-forwarded-for`, which only the hosting provider's proxy may set. Take the address the provider documents as trustworthy (usually the first entry), and never trust the header when the app isn't behind a known proxy.
- **Store IPs hashed** (SHA-256 with a fixed prefix) in rate-limit keys. Counting doesn't need the raw address.
- **Limit messages are generic** and don't say how close the caller is to the limit.
- Add a limit to any new action that sends email, creates public content, or is cheap to call and expensive to serve.

## User-generated content

Link titles, URLs, display names and bios come from users and are shown to everyone on `/user/[handle]`. Treat them as untrusted every time they're rendered.

### Escape on render

- **Render user text as JSX children or attributes** (`{link.title}`). React escapes it, so `<script>` shows up as text.
- **Never `dangerouslySetInnerHTML` with user content.** Not for bios, not with "sanitized" input. If rich text is ever needed, it gets its own decision and an allowlist sanitizer.
- **No user content in `<script>` tags, inline event handlers, `style` strings or `eval`.**
- **Metadata** (`generateMetadata`, Open Graph images) goes through Next.js APIs, which escape it. Never build `<head>` markup by hand.

### URLs

React escapes a URL in `href` but doesn't make it safe: `javascript:alert(1)` is a valid string that runs code when clicked. URLs are checked twice:

1. **On write**: the Zod schema accepts only `http:` and `https:` (`linkUrlSchema` in `lib/validation/common.ts`), and the Mongoose schema enforces the same rule.
2. **On render**: `LinkButton` parses the stored URL and renders it only if the protocol is still `http:` or `https:`. A bad value from old data or a missed code path renders as a disabled item, not a link.

### Outbound links

Every link to another site, which includes every user link, opens in a new tab with `rel="noopener noreferrer"`:

```tsx
<a href={safeUrl} target="_blank" rel="noopener noreferrer">
  {link.title}
</a>
```

- `noopener` stops the opened page from controlling the Linkbase tab through `window.opener`.
- `noreferrer` stops the browser from telling the destination which profile the visitor came from.
- Use `LinkButton` (`docs/ui.md`) for user links instead of writing `<a>` by hand, so both rules live in one component.
- Internal navigation uses `next/link` without `target="_blank"`.

## Dependencies

- Commit `package-lock.json` and install with `npm ci` in CI and deploys.
- Run `npm audit` before releases. Fix high and critical advisories in runtime dependencies before shipping.
- Add a dependency only when it's maintained and needed. Every package runs with full access to the server's secrets.
