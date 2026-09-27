# AI handoff — Opus Zimbabwe

_Last checked: 2026-09-26 (UTC)_

## What is currently in the repository

The public site is a static Next.js export (`output: 'export'`) with the visual
system and route structure already in place. Service content is defined in
`lib/content.ts` as the built-in fallback. The six service cards currently use
admin/D1 data when available and fall back to the static copy and images:

- Website Design & Development — `/images/service-web-design.png`
- Software & Systems — `/images/service-software.jpg`
- AI & Automation — `/images/service-ai.jpg`
- Graphic Design & Branding — `/images/service-graphic.png`
- Domain & Hosting — `/images/service-hosting.png`
- API & Integrations — `/images/service-api.jpg`

The home “What We Do” design is implemented in `components/ServicesShowcase.tsx`
as a horizontal split carousel matching the provided reference: a large soft
mint copy panel on the left, the service's own image on the right, a partially
visible neighbouring card, centered arrow/dot controls underneath, rounded
corners on the inner image/card, and the Opus orange-to-gold gradient CTA. It
uses the service's own `name`, `tagline`, `description`, `image`, and slug, so it
remains compatible with D1/admin content. On mobile the split card stacks copy
above image. The `/services` list is separate (`components/ServicesList.tsx`).
The reusable older card component is `components/ServiceCard.tsx`; do not
assume it is the home carousel design.

The service page heroes in `components/ServiceHero.tsx` now sit inside rounded,
max-width containers with the same gradient CTA. Their image/gradient selection,
background image upload/path, gradient builder, and hero copy are already
editable per service in the Services tab.
Service page hero/Why Opus/related content is in `staticExtras` and the D1
`service_extras` table.

## Issue investigated: “Content API unreachable …”

The warning is produced by `components/admin/AdminDashboard.tsx` when
`useSiteContent()` cannot fetch `/api/content`. It is not a service-card content
error. The API is implemented as a Cloudflare Pages Function in
`functions/api/content.ts`, backed by the D1 binding `DB` in `wrangler.toml`.

### Root cause in local development

Running `npm run dev` starts only the Next.js static frontend. Next does not
serve the Pages Functions or the D1 binding, so `/api/content` is expected to
fail and the admin correctly switches to fallback content. Saving from that
Next-only server cannot work.

For a working local API, use the Pages dev server instead:

```bash
npm install
npm run build
npm run db:migrate:local
npm run pages:local       # serves out/ + functions + local D1/R2 on :8788
```

The API was verified during this handoff:

- `GET http://127.0.0.1:8788/api/content` returned `200` with all six services,
  extras, pricing, projects, partners and settings.
- `GET /api/admin/session` returned the expected `401` without Access headers.
  Local admin mutations require the simulated Access headers documented in
  `docs/ADMIN.md`.

Admin icon fields now accept either a Lucide icon name or an uploaded/static
image URL. `lib/icons.ts` renders uploaded image URLs as icons. Upload controls
are available for service icons, Opus Approach icons, footer social icons and
contact-card icons; trusted-partner logos already have an upload control. This
removes the previous restriction to the embedded icon dropdown.

The homepage services story keeps all six services together in one Services
section; the redundant Digital Presence and Digital Systems group headings were
removed. The service page template is a vertical editorial sequence with
numbered Introduction, What We Do, How It Works, Visual/Example, Who It Is For,
Related Services and CTA sections. The homepage has a rounded “Ready to get
your business going?” CTA. Homepage pricing was removed at the user's request.
The original pricing card design in `components/PricingCard.tsx` must not be
changed. Rounded pills were restored for the navbar active item and primary
buttons; do not replace them with rectangular buttons without an explicit
request.

Every service page's section 04 Visual / Example image is now admin-managed
through `service_extras.visual_background`. It has a seeded fallback for all six
services, an admin image/path/upload control, API validation, and the page reads
D1 content instead of relying only on the static page data. Migration
`0005_service_visuals.sql` adds and seeds the column; apply all five migrations
remotely before deploying this change.

In production, `/api/content` will remain unavailable until the Cloudflare
Pages project has the D1 binding named `DB`, R2 binding named `MEDIA`, and all
five migrations have been applied remotely. Migration 0005 was applied to local
D1 and verified. Remote application still needs to be run from an authenticated
Cloudflare environment; this checkout does not have a Cloudflare API token. Access must cover `/admin*` and
`/api/admin*`, but must **not** cover public `/api/content`.

### Verification already run

All passed after installing dependencies:

- `npm run typecheck`
- `npm run build`
- `npm run db:migrate:local`
- `npm run db:check`
- `curl http://127.0.0.1:8788/api/content`

No source changes were needed to fix the warning: it accurately identifies the
Next-only dev-server limitation. Do not remove the fallback; it is intentional
so the public static site remains usable if D1/API is down.

## If the service-card design still needs adjustment

Start with `components/ServicesShowcase.tsx` for the home-page card design and
`lib/content.ts` for fallback content/images. Check the live D1 data first: the
client upgrades from fallback to D1 after `/api/content` responds, so a visual
mismatch on the deployed site may be stale/incorrect D1 content rather than
React/CSS. Use the Services tab in `/admin` to edit card copy, image, gradient,
hero and visibility, then save against the Pages/Cloudflare-hosted site.

Keep image URLs as site paths (`/images/...`) or uploaded R2 paths
(`/api/media/...`); do not invent `/images` assets that are not present in
`public/` or configured in R2.

