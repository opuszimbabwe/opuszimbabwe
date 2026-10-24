# AI handoff — Opus Zimbabwe

_Last checked: 2026-10-17 (UTC)_

## What is currently in the repository

The public site is a static Next.js export (`output: 'export'`) served by
Cloudflare Pages with Pages Functions for the API. Content lives in the D1
database and is mirrored as static fallbacks in `lib/content.ts` so the site
still renders if `/api/content` is unreachable.

### Design system

- **Fonts:** Self-hosted Poppins only, bundled through next/font/local. Hero typography is admin-controlled; default weight 700.
- **Backgrounds:** alternating `#f8f8f6` and `#ffffff` homepage sections.
  Primary text `#0d0d0d`.
- **Orange `#E85D2A`:** buttons, hover states and the active CTA only
  (plus the subtle orange left border on service card hover). Never on
  eyebrows, section numbers, decorative elements or static borders.
- **Red:** only the phrase “The results should show it.” in the homepage hero.
- No eyebrow labels or section numbers on homepage lists/grids.

### Homepage

Section order (all headings/backgrounds editable in `/admin` → Hero & Sections):

1. `components/HomeHero.tsx` — admin-driven split, full-bleed and card layouts; service or background-only rotation; optional Help Me Choose bottom sheet. Defaults preserve the split layout.
2. `components/PaymentTrustStrip.tsx` — local payment logos from
   `settings.payment_methods`, greyscale until hover.
3. `components/HomeServicesGrid.tsx` + `components/ServiceCard.tsx` — two expanding image rails, 950 ms motion, no numbers; larger copy at the bottom and button links; per-card colour (`services.card_bg_color`).
4. `components/TrustedPartners.tsx` — “Partners who trust us” with per-partner
   tile background (`partners.bg_color`; Killing Giants is `#000000`).
5. `components/OpusApproach.tsx` — connected-circle process timeline; admin-owned copy and icons, Opus orange hover outline.
6. `components/HomeProjects.tsx` — all active live-work projects, each with an
   admin-uploaded screenshot (`projects.screenshot`). Until a screenshot is
   uploaded the card shows a neutral browser-frame placeholder with the
   project's domain (never a fabricated screenshot).
7. `components/WhyChooseUs.tsx` — six inverted-corner cards.
8. `components/FaqAccordion.tsx` — three homepage FAQs.
9. Final CTA — “Ready to get your business going?” → `/contact/`.
10. `components/Footer.tsx` — unchanged structure.

### Individual service pages

`components/ServicePageTemplate.tsx` renders the full content spec for each of
the six pages in this order:

1. Hero (`components/ServiceHero.tsx`) — headline, intro and CTA from
   `service_extras` (admin-editable); CTA anchors to `#pricing` for
   “View Packages” / “View Pricing”, goes to `/projects/` for “See Our Work”
   and to `/contact` otherwise.
2. **The problem** — `service_pages[id].problem_text`.
3. **What we build / design / provide / integrate** — `what_heading`,
   `what_intro`, `what_items[]`, plus the admin-managed supporting image
   (`service_extras.visual_background`).
4. **Pricing** — `price_range`, `price_summary`, `price_note`:
   - `/services/web-design/` renders the six website packages using the
     original `components/PricingCard.tsx` card design. `monthly_price` is the
     plan **price range** (e.g. `$30 – $59.99`) and `yearly_price` is
     **what it covers**.
   - `/services/domains-hosting/` renders the domain table
     (`domain_prices[]`), the hosting price card and the three email plans
     (`email_plans[]`) in the same card style.
   - Every other service renders one price-range card.
5. **Process** — `process_steps[]`.
6. **Tools we use** — `tools_items[]` logos (uploadable) + `tools_note`.
   Logo assets live in `public/images/tools/`.
7. **WhatsApp CTA** — `cta_heading`, `cta_body`, `cta_button`, `cta_url`
   (defaults to `https://wa.me/263710740387`).

All of this is stored in the `settings.service_pages` JSON key. Admin edits it
in `/admin` → **Service Page Content** (one tab per service, price ranges,
tables, tools logos, CTA). Migration
`0008_service_pages_full_content.sql` seeds it and refreshes the six
`service_extras` hero rows.

Duplicate legacy URLs (`/services/web-design-development/`,
`/services/software-systems/`, `/services/graphic-design-branding/`,
`/services/domain-hosting/`) simply re-export the canonical pages.

### Admin dashboard (`components/admin/AdminDashboard.tsx`)

Sidebar groups:

- **Homepage & Design** — Home Hero Design (layout, copy, carousel, typography, corner controls, backgrounds, animation); Homepage Sections (headline, hero cycles + image
  upload, every section heading and `#ffffff` / `#f8f8f6` background), Local
  Payments (label, methods, logo upload), Trusted Partners (logos, tile
  background, URLs, add/remove), How It Works & Why Us (copy + icons).
- **Services & Work** — Services (6 cards: copy, images, icon upload, card
  background, hero copy/background), Service Page Content (all six pages),
  Live Work (add/edit/remove unlimited projects, upload a screenshot per
  project), Pricing & Price Ranges, FAQs (home + page).
- **Identity & Contact** — navbar logo (transparent), browser tab icon
  (favicon upload: SVG/ICO/PNG/WebP/JPG/GIF/AVIF), browser title, manifest
  icon, footer socials, contact cards.

`components/BrandHeadSync.tsx` applies the admin `browser_title` and
`favicon_icon` to the live document (re-applied on navigation).
`/api/manifest` reads `manifest_icon` and `browser_title`.

### Database and API

- Migrations `0001`–`0011` in `migrations/`; all applied locally.
  `0010` adds `projects.screenshot`; `0011` corrects home-page copy
  (Trusted By subheading, Projects/How It Works headings).
- `functions/_lib/db.ts` — `readAllContent`, `sanitizeSetting`, validators.
- `functions/api/content.ts` — public read.
- `functions/api/admin/{services,pricing,projects,partners,settings,upload}.ts`
  — Access-protected writes.
- `functions/api/media/[key].ts` — public R2 reads.
- `functions/api/manifest.ts` — dynamic manifest.

`service_pages` is validated server-side: text lengths, safe `cta_url`,
`what_items`/`process_steps` arrays, `tools_items` logos restricted to site
paths or `https://`, and domain/email tables for the domains page.

## Local verification

```bash
npm install
npm run build
npm run db:migrate:local
npm run db:check
node scripts/smoke-api.mjs http://127.0.0.1:8788
```

The smoke suite covers static HTML, `/api/content`, Access control, service
card editing, price-range editing/restore, `service_pages` editing, brand
title/favicon, R2 uploads, service heroes, projects, partners, FAQs and the
individual service-page HTML. It currently passes 112/112 locally.

## Preview server notes

`wrangler pages dev` must be started without CLI `--d1`/`--r2` flags so it uses
`wrangler.toml`:

```bash
npx wrangler pages dev --port 8788 --ip 127.0.0.1
```

To expose it on `0.0.0.0:35211` (Arena preview), run a small reverse proxy on
`35211` and keep Wrangler bound to loopback. Binding Wrangler itself to
`0.0.0.0` makes Miniflare claim port `35211` for an internal socket.

## Production checklist

- Apply all eleven migrations (0001–0011) to the remote D1 database before deploying.
  No terminal is required: **Actions → D1 (remote) → Run workflow** (`.github/workflows/d1-remote.yml`)
  runs `verify` / `list` / `backup` / `migrate` against the remote database. `migrate`
  needs the `confirm` input set to `MIGRATE`, exports a SQL backup first (uploaded as a
  `d1-backup-<run>` artifact), then applies pending files and runs
  `scripts/remote-verify.sql`, printing everything to the run summary. It requires the
  `CLOUDFLARE_API_TOKEN` (Account → D1 → Edit, Account Settings → Read) and
  `CLOUDFLARE_ACCOUNT_ID` repo secrets. The workflow only becomes dispatchable once
  the file is on `main`, so merge before running it.
- D1 binding `DB` and R2 binding `MEDIA` must exist on the Pages project.
- Cloudflare Access must protect `/admin*` and `/api/admin*` but **not**
  `/api/content` or `/api/manifest`.
- The admin UI sends `Cf-Access-*` headers only because Access is expected to
  inject them in production; local testing simulates them.


## Approved release and freshness contract

The owner approved releasing all reviewed changes to main in this conversation. Subsequent changes still go to the separate opus-design-preview project first, then production only after approval. See docs/PREVIEW-WORKFLOW.md for the full feature/editor/test map.

Migrations 0012 and 0013 contain the approved homepage/process copy and pale section defaults. New hero_design, cta_design and contact_hero_design JSON settings use the existing settings table. Legacy hero settings are upgraded without losing existing button/link behavior. Production bindings and Cloudflare Access settings must be preserved.

HTML and dynamic API responses are no-store at browser/CDN level. SiteContentBoundary requests current data before a route is revealed; page exit/history restoration masks cached DOM until a fresh read finishes. Failed fresh reads show a retry screen, not old static content. Admin saves await their post-save refresh; same-origin tabs are notified and other visible pages poll every five seconds. Hashed assets and random-key R2 media remain cacheable. No-JavaScript users retain the built-in static HTML.

All existing admin save groups and all six service editors have local browser/API coverage. Explicitly emptied lists must never resurrect seeded content. Maintain ID-based upload targets, atomic validation, visibility across nav/footer/contact, and new-item reveal behavior. Do not restore obsolete designs, Inter, static card avatars, or hard-coded colours that ignore admin settings.
