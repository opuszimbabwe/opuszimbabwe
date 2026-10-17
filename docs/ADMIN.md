# Opus Zimbabwe — Admin Dashboard, D1 & R2

The `/sysadmin` dashboard edits public site content stored in **Cloudflare D1**;
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
| `/sysadmin` dashboard | `app/sysadmin/page.tsx` + `components/admin/AdminDashboard.tsx` | Six tabs — Services, Pricing, Home, FAQ, Projects, Brand (noindex, not in nav/sitemap) |
| Public content API | `functions/api/content.ts` | `GET /api/content` — services (incl. per-service extras), pricing, projects, settings |
| Web app manifest | `functions/api/manifest.ts` | `GET /api/manifest` — `application/manifest+json` using the admin-set icon |
| Admin APIs | `functions/api/admin/*` | Session, service PATCH (card + hero/why/related), pricing PUT, projects PUT, partners PUT, settings PUT, R2 upload |
| Image serving | `functions/api/media/[key].ts` | Public immutable serving of R2 uploads |
| Auth enforcement | `functions/_lib/auth.ts` | Cloudflare Access email allowlist + optional strict JWT verification |
| D1 schema + seed | `migrations/0001_init.sql` through `migrations/0005_service_visuals.sql` | Tables: `services`, `pricing_cards`, `settings`, `service_extras`, `projects`, `partners`; `service_extras.visual_background` stores each service page's admin-managed visual/example image |
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

### 2. Apply migrations remotely (0006 → 0011)

```bash
npx wrangler login                 # once per machine — use the account that owns the D1 database
npx wrangler d1 list               # confirm opuszim-content matches database_id in wrangler.toml

npm run db:backup:remote           # writes backups/opuszim-content.sql
npm run db:migrations:list         # shows exactly which migrations are pending
npm run db:migrate:remote          # applies every pending migration, in order
npm run db:verify:remote           # read-only checks for 0006–0011
```

Equivalent raw commands (identical behaviour):

```bash
npx wrangler d1 export opuszim-content --remote --output=backups/opuszim-content.sql
npx wrangler d1 migrations list opuszim-content --remote
npx wrangler d1 migrations apply opuszim-content --remote
npx wrangler d1 execute opuszim-content --remote --file=scripts/remote-verify.sql
```

**Order matters:** deploy the new code first (step 3), then apply the
migrations. The new code tolerates the old schema (it falls back when
`card_bg_color`, `bg_color` or `screenshot` is absent), so there is no error
window, and the public site never renders half-migrated pricing.

What each migration does:

| File | Change | Data impact |
| --- | --- | --- |
| `0006_homepage_redesign.sql` | `services.card_bg_color`; seeds `hero_cycles`, `approach_items` | Deletes `zimtrade`/`agricom` and any `coming_soon` projects |
| `0007_admin_privileges_and_home_updates.sql` | `partners.bg_color`; seeds `payment_methods`, `why_choose_us`, `home_sections` | Overwrites those three settings keys |
| `0008_service_pages_full_content.sql` | seeds `service_pages`, `favicon_icon`, `browser_title`; replaces `pricing_cards`; refreshes `service_extras` heroes | **`DELETE FROM pricing_cards`**, then inserts the six price-range packages; overwrites `service_pages` and the six hero rows |
| `0009_transparent_navbar_logo.sql` | `navbar_logo` → `/images/logo-full.png` | Only when the value is still the old `/images/logo.png` |
| `0010_project_screenshots.sql` | `projects.screenshot` column | Additive, no data loss |
| `0011_confidence_copy_fixes.sql` | Trusted-By subheading, Projects/How It Works headings | Only rewrites the seeded/empty values |

If pricing, service heroes, hero cycles, How It Works copy, Local Payments,
Why Choose Us or partner details have already been edited in production, take
the export first and re-enter those edits in `/admin` afterwards — or copy
`backups/opuszim-content.sql` somewhere safe and restore individual rows from
it (`INSERT … ON CONFLICT DO UPDATE`) if you need the old values back.

If the database has drifted (a migration was pasted into the D1 dashboard SQL
console instead of being applied by Wrangler), `d1_migrations` will not record
it and the next `migrations apply` will fail with `duplicate column name`. Fix
that by recording the file as applied before re-running:

```bash
npx wrangler d1 execute opuszim-content --remote \
  --command "INSERT INTO d1_migrations (name) VALUES ('0006_homepage_redesign.sql');"
```

(Repeat for each file already applied by hand.) Always prefer the Wrangler
path so the ledger stays accurate.

### 2b. Alternative: apply from CI

If deployments run from GitHub Actions rather than a laptop, add a
`CLOUDFLARE_API_TOKEN` (scoped to **D1:Edit**) and `CLOUDFLARE_ACCOUNT_ID`
secret, then run:

```yaml
- run: npx wrangler d1 migrations apply opuszim-content --remote
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Trigger it manually (`workflow_dispatch`) for deploys like this one rather
than on every push, so production data changes stay deliberate.

### 3. Deploy

- **Git integration (recommended):** connect the GitHub repo to a Cloudflare
  Pages project (build output directory `out`, no build command needed beyond
  `npm run build`). Pushing this branch deploys automatically. Then add the
  bindings under Pages → *Settings* → *Functions* → *Bindings*:
  - D1: name `opuszim-content`, binding `DB`
  - R2: bucket `opuszim-uploads`, binding `MEDIA`
- **Or direct:** `npx wrangler pages deploy` (uses `pages_build_output_dir`
  from `wrangler.toml`, bindings come from the same file).

### 4. Protect /sysadmin with Cloudflare Access

Cloudflare Zero Trust dashboard (**dash.cloudflare.com** → Zero Trust →
*Access* → *Applications* → *Add an application* → **Self-hosted**):

1. **Application domain(s):** your production hostname with the paths
   `/sysadmin*` and `/api/admin*` (add both, or two applications).
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
- **Partners tab** — the “Organisations We Have Built For” logo row on the
  home page. Add, edit or remove partners: **name**, **logo** (paste a static
  path or *Upload* to R2), optional **website** (a partner with a URL renders
  as a link; without one the logo is shown unlinked) and **visibility**.
  Order follows the list order. One *Save partners* writes the whole list.
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

- `/sysadmin` is `noindex`, absent from the navbar and sitemap, and
  `robots.txt` disallows `/sysadmin/` and `/api/`.
- `/api/manifest` is public (the manifest is public site metadata) and is
  generated per request, so an icon change is live as soon as it is saved.
- Service pages pre-fill the enquiry form: CTAs link to
  `/contact?service=…`, and domain CTAs add `&domain=…` (the `/domains`
  cards pass the extension the visitor clicked).
- The “Why choose Opus Zimbabwe” list on the home page is built-in content
  (`app/page.tsx`, rendered by `components/WhyChooseUs.tsx`). Each reason is
  collapsed until it scrolls into view, then expands and **stays expanded** —
  a one-way reveal, so scrolling back up never re-collapses it.
- Uploaded files are validated: image types only (jpg/png/webp/gif/avif),
  5 MB max, random immutable keys (served with `immutable` cache headers).
- No secrets live in the repo. `.env*`, `.dev.vars` and `.wrangler/` are
  gitignored; `ALLOWED_ADMINS` / `CF_ACCESS_*` are deployment-time bindings.
