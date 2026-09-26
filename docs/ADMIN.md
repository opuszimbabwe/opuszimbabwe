# Opus Zimbabwe — Admin Dashboard, D1 & R2

The `/admin` dashboard edits public site content stored in **Cloudflare D1**;
uploaded images are stored in **Cloudflare R2**. Admin access is protected by
**Cloudflare Access**, allow-listed to `info.opuszim@gmail.com`.

Managed content: service cards, **service page heroes (image or gradient),
Why Opus cards and related links**, pricing cards, **projects**, the home page
hero background, **The Opus Approach**, **Built for Zimbabwe**, **two FAQ
lists** and **branding** (navbar logo, web-app manifest icon, footer socials,
contact cards).

The public site remains a **static export** (`output: 'export'`). It always
renders the built-in fallback content from `lib/content.ts` first, then
upgrades to D1 content when the API is reachable — so the site keeps working
even if the database or functions are unavailable.

## Architecture

| Piece | Where | Purpose |
| --- | --- | --- |
| `/admin` dashboard | `app/admin/page.tsx` + `components/admin/AdminDashboard.tsx` | Six tabs — Services, Pricing, Home, FAQ, Projects, Brand (noindex, not in nav/sitemap) |
| Public content API | `functions/api/content.ts` | `GET /api/content` — services (incl. per-service extras), pricing, projects, settings |
| Web app manifest | `functions/api/manifest.ts` | `GET /api/manifest` — `application/manifest+json` using the admin-set icon |
| Admin APIs | `functions/api/admin/*` | Session, service PATCH (card + hero/why/related), pricing PUT, projects PUT, settings PUT, R2 upload |
| Image serving | `functions/api/media/[key].ts` | Public immutable serving of R2 uploads |
| Auth enforcement | `functions/_lib/auth.ts` | Cloudflare Access email allowlist + optional strict JWT verification |
| D1 schema + seed | `migrations/0001_init.sql`, `migrations/0002_seed.sql`, `migrations/0003_service_extras_projects.sql` | Tables: `services`, `pricing_cards`, `settings`, `service_extras`, `projects` |
| Static fallback | `lib/content.ts` | Exact copy of the original static site content (services, pricing, projects, extras, settings) |

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
# → copy ONLY the database_id value into the existing database_id line in
#   wrangler.toml. Keep binding = "DB" — do not paste the snippet's binding
#   name (it suggests "opuszim_content", but the code reads env.DB).

npx wrangler r2 bucket create opuszim-uploads
```

> **R2 not enabled yet?** `r2 bucket create` fails with `code: 10042`
> ("Please enable R2 through the Cloudflare Dashboard") until R2 is switched
> on for your account: open **dash.cloudflare.com → R2**, enable it (the free
> tier is more than enough; Cloudflare may ask for a payment method inside
> its own dashboard — that's its normal signup flow, handled entirely there),
> then re-run the command. Local development does not need the remote bucket —
> `npm run pages:local` uses a simulated local R2.

Verify the ID took effect with `npx wrangler d1 list` (it should match the
`database_id` in `wrangler.toml`).

### 2. Apply migrations remotely

```bash
npx wrangler d1 migrations apply opuszim-content --remote
```

This runs `migrations/0001_init.sql`, `migrations/0002_seed.sql` and
`migrations/0003_service_extras_projects.sql` (schema + seed content identical
to the static site, plus service heroes/Why Opus/related links and the projects
table). Migration 0003 is **additive** — it only creates new tables and
`INSERT OR IGNORE`s rows, so it is safe on top of the current production data.
Apply it before or together with deploying the new code: the public site keeps
rendering its built-in fallback content, but `/api/content` needs the new
tables.

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

- **Services tab** — per service: card content (name, tagline, home-card copy,
  `/services` list copy, feature chips, icon, order, visibility, card image) and
  the **service page hero**: eyebrow, headline, intro, button label and a
  background that is either an **image** (paste a path or *Upload* to R2) or a
  **gradient** built with the colour/angle picker (presets included, live
  preview). Below that, the **Why Opus** cards and **Related services** links
  shown on that service page. *Save service* writes card + hero + why +
  related in one request.
- **Pricing tab** — add, edit, remove pricing cards (plan name, monthly and
  annual price, features, visibility). One *Save pricing* writes the whole
  list to D1.
- **Home tab** — the home hero background, the five **The Opus Approach**
  cards (title, body, icon) and the **Built for Zimbabwe** section
  (eyebrow, heading, body, background image). Each block saves on its own.
- **FAQ tab** — two independent lists: the short **home page** FAQ and the
  full **`/faq` page** FAQ. Add, edit, remove and reorder questions.
- **Projects tab** — add, edit, remove projects (name, link, tag, location,
  description, visibility). **Status** decides how a project renders:
  `active` → a link to the live site (a URL is required),
  `coming_soon` → a “Coming soon” badge with no link.
- **Brand tab** — navbar logo, the icon served by `/api/manifest` (512×512 PNG
  works best; takes effect immediately, no rebuild), the footer social links
  and the three contact cards on `/contact` (icon, title, line, note, link).

All mutations require an Access session for an allow-listed email; otherwise
they fail with a clear 401 banner in the dashboard.

### Where each setting is used

| Setting key | Renders on |
| --- | --- |
| `hero_background` | home hero |
| `navbar_logo` | site header |
| `manifest_icon` | `/api/manifest` (installable app icon) |
| `footer_socials` | footer icon row |
| `contact_cards` | `/contact` contact cards |
| `faq_home` | home page FAQ accordion |
| `faq_page` | `/faq` accordion |
| `approach_items` | home “The Opus Approach” cards |
| `built_for_zimbabwe` | home “Built for Zimbabwe” section |

Missing or empty settings fall back to the built-in values in
`lib/content.ts`, so the site never renders empty sections.

## Notes

- `/admin` is `noindex`, absent from the navbar and sitemap, and
  `robots.txt` disallows `/admin/` and `/api/`.
- `/api/manifest` is public (the manifest is public site metadata) and is
  generated per request, so an icon change is live as soon as it is saved.
- Service pages pre-fill the enquiry form: CTAs link to
  `/contact?service=…`, and domain CTAs add `&domain=…` (the `/domains`
  cards pass the extension the visitor clicked).
- Uploaded files are validated: image types only (jpg/png/webp/gif/avif),
  5 MB max, random immutable keys (served with `immutable` cache headers).
- No secrets live in the repo. `.env*`, `.dev.vars` and `.wrangler/` are
  gitignored; `ALLOWED_ADMINS` / `CF_ACCESS_*` are deployment-time bindings.
