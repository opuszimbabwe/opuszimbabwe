# Opus Zimbabwe — Admin Dashboard, D1 & R2

The `/admin` dashboard edits public site content stored in **Cloudflare D1**;
uploaded images are stored in **Cloudflare R2**. Admin access is protected by
**Cloudflare Access**, allow-listed to `info.opuszim@gmail.com`.

The public site remains a **static export** (`output: 'export'`). It always
renders the built-in fallback content from `lib/content.ts` first, then
upgrades to D1 content when the API is reachable — so the site keeps working
even if the database or functions are unavailable.

## Architecture

| Piece | Where | Purpose |
| --- | --- | --- |
| `/admin` dashboard | `app/admin/page.tsx` + `components/admin/AdminDashboard.tsx` | Edit service cards, pricing cards, hero background (noindex, not in nav/sitemap) |
| Public content API | `functions/api/content.ts` | `GET /api/content` — D1 content for the public site |
| Admin APIs | `functions/api/admin/*` | Session, service PATCH, pricing PUT, settings PUT, R2 upload |
| Image serving | `functions/api/media/[key].ts` | Public immutable serving of R2 uploads |
| Auth enforcement | `functions/_lib/auth.ts` | Cloudflare Access email allowlist + optional strict JWT verification |
| D1 schema + seed | `migrations/0001_init.sql`, `migrations/0002_seed.sql` | Tables: `services`, `pricing_cards`, `settings` |
| Static fallback | `lib/content.ts` | Exact copy of the original static site content |

## Local development (no Cloudflare login required)

```bash
npm install
npm run build              # static export to out/
npm run db:migrate:local   # apply migrations to local D1
npm run db:check           # verify schema + seed content
npm run pages:local        # serve out/ + functions/ + local D1/R2 on :8788
node scripts/smoke-api.mjs # end-to-end API/auth/upload checks (server must run)
```

Or run everything at once: `npm run checks` (typecheck, build, migrations, db:check).

### Simulating Cloudflare Access locally

Local dev has no Access in front of it, so the admin APIs accept a simulated
Access identity via headers:

```bash
curl -H "Cf-Access-Authenticated-User-Email: info.opuszim@gmail.com" \
     -H "Cf-Access-Jwt-Assertion: local" \
     http://127.0.0.1:8788/api/admin/session
```

Without those headers every `/api/admin/*` request is rejected with **401**.

### Strict JWT verification test

Create `.dev.vars` (gitignored) with:

```
CF_ACCESS_TEAM_DOMAIN=http://127.0.0.1:8799
CF_ACCESS_AUD=local-test-aud
```

Restart `npm run pages:local`, then run `node scripts/test-access-jwt.mjs`.
It serves a mock Access JWKS and verifies that only correctly signed,
unexpired, right-audience, right-email JWTs are accepted.

## Production deployment

Everything below is code-complete in this repo; only the Cloudflare account
steps remain. The **only sign-in required** is Cloudflare itself
(`npx wrangler login` opens the browser — use your own Cloudflare account
credentials; never share passwords or tokens with anyone).

### 1. Create the resources (one-time)

```bash
npx wrangler login

npx wrangler d1 create opuszim-content
# → copy the printed database_id into wrangler.toml (database_id = "...")

npx wrangler r2 bucket create opuszim-uploads
```

### 2. Apply migrations remotely

```bash
npx wrangler d1 migrations apply opuszim-content --remote
```

This runs `migrations/0001_init.sql` and `migrations/0002_seed.sql`
(schema + seed content identical to the static site).

### 3. Deploy

- **Git integration (recommended):** connect the GitHub repo to a Cloudflare
  Pages project (build output directory `out`, no build command needed beyond
  `npm run build`). Pushing this branch deploys automatically. Then add the
  bindings under Pages → *Settings* → *Functions* → *Bindings*:
  - D1: name `opuszim-content`, binding `DB`
  - R2: bucket `opuszim-uploads`, binding `MEDIA`
- **Or direct:** `npx wrangler pages deploy` (uses `pages_build_output_dir`
  from `wrangler.toml`, bindings come from the same file).

### 4. Protect /admin with Cloudflare Access

Cloudflare Zero Trust dashboard (**dash.cloudflare.com** → Zero Trust →
*Access* → *Applications* → *Add an application* → **Self-hosted**):

1. **Application domain(s):** your production hostname with the paths
   `/admin*` and `/api/admin*` (add both, or two applications).
   Also add the same paths for the `<project>.pages.dev` hostname so the
   preview URL cannot bypass Access.
   Do **not** protect `/`, `/api/content`, or `/api/media/*` — the public
   site needs those.
2. **Policy:** *Include* → *Emails* → `info.opuszim@gmail.com`
   (this is the allowlist; add more emails there if needed later).
3. **Session duration:** your preference (e.g. 24 hours).

### 5. Turn on strict JWT verification (recommended)

Without it, the API checks Access headers only (fine as long as Access covers
all admin paths). Strict mode cryptographically verifies the Access JWT at the
origin, so even a hostname Access forgets to cover cannot be spoofed.

In Pages → *Settings* → *Environment variables* add:

| Variable | Value |
| --- | --- |
| `CF_ACCESS_TEAM_DOMAIN` | `https://<your-team>.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | The application's *Application Audience Tag* (copy from the Access app’s Overview/Advanced screen) |

(Optionally also `ALLOWED_ADMINS` — comma-separated emails, defaults to
`info.opuszim@gmail.com`.) Redeploy/restart for env changes to apply.

### 6. Verify

```bash
# unauthenticated → 401
curl -i https://your-domain/api/admin/session
# browser: open /admin → redirected to the Cloudflare Access login → dashboard
```

## Admin dashboard usage

- **Service cards tab** — edit name, tagline, home-card copy, `/services`
  list copy, feature chips, icon, order, visibility, and the card image
  (paste a path or *Upload* to R2). Save per card.
- **Pricing cards tab** — add, edit, remove pricing cards (plan name, monthly
  and annual price, features, visibility). One *Save pricing* writes the whole
  list to D1.
- **Hero background tab** — upload or paste an image URL, preview it, save.
  The home hero picks it up from `/api/content`.

All mutations require an Access session for an allow-listed email; otherwise
they fail with a clear 401 banner in the dashboard.

## Notes

- `/admin` is `noindex`, absent from the navbar and sitemap, and
  `robots.txt` disallows `/admin/` and `/api/`.
- Uploaded files are validated: image types only (jpg/png/webp/gif/avif),
  5 MB max, random immutable keys (served with `immutable` cache headers).
- No secrets live in the repo. `.env*`, `.dev.vars` and `.wrangler/` are
  gitignored; `ALLOWED_ADMINS` / `CF_ACCESS_*` are deployment-time bindings.
