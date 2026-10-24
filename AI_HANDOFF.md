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

### Current review: service-word hero and contact fields
Security commit 6bc343b is deployed on main: admin aliases redirect, sysadmin pages/data require verified Access, production APIs fail closed, dashboard rendering waits for verified session and rechecks on restoration. CI and production deployment succeeded. New selectable service-word hero/contact-field edits are pending visual approval; do not push those edits to main until approved. Current preset has left images + Work with Zimbabwe’s Best + six synchronized service words, editable cycle words/caption controls, and classic preset compatibility. Preview is read-only with proposed hero overlay; browser-only hero playground has no live write access. See docs/PREVIEW-WORKFLOW.md and scripts/test-rotating-hero.cjs.

The owner has now approved publishing the visual changes (0c567b6) to main, plus removal of the visible preloader. Keep the freshness gate and security. Transparent favicon original is reused unchanged; /api/favicon resolves the administrator-selected image and client branding synchronizes all icon links. The old uploaded favicon had a baked-in white background (all alpha=255); production selection is switched conditionally to the bundled transparent original.

Pending review after 29a697e: file-picker focus checks no longer mask verified visible admin pages; session denial/hidden/history protection remains. Uploads have an in-flight ref lock. Service/contact heroes share responsive outer gutters; contact fields use native legend notches with transparent labels and --field-fill. Verified locally with scripts/test-upload-focus-outline.cjs, test-admin-visibility.cjs and test-content-lifecycle.cjs. Preview first; no new main publication approval yet.

Additional pending preview work: payment logos now in admin-toggled Local Payments reason card; white/soft-shadow navbar with heavier default/current labels and red-orange Get Started; grey footer rule; shared modern project square screenshot/name-or-logo/description layout with whole screenshots and optional hover-video URL. Admin adds client logo (upload) and hover-video URL. Migration 0014_project_presentation is LOCAL ONLY: apply additive columns after production backup and explicit approval, before deploying the new project-save API. Main remains at 29a697e until approval. Local media/nav/payment integration passed; smoke API 113/113.

Owner now explicitly authorised direct main-site publication of all pending changes. New revision: pill-only header on scroll; full-width white/shadow at top; uploaded six-second expanding Why Choose Us rows (own admin content/fonts/colours, payments and editable CTA); selected blue textured Poppins headings with #0f0928; cover/no-padding project screenshots; real client logos above project titles with admin upload/change/clear. Migrations 0014+0015 required before new project API; backup retained in ignored backups/production-before-project-accordion-release.sql. Older project saves that omit optional media preserve stored values; explicit empty values clear them. Use scripts/test-main-accordion.cjs plus project/payment integration, content validators, API smoke and security/lifecycle checks.

Latest services request: services overview follows reference split hero/image grid/dark capabilities/process/CTA structure with six existing admin-managed services and Poppins; shared textured-accent changes globally from blue to orange/red (Live, Why, and all other uses). No schema changes. scripts/test-services-overview.cjs covers rendering, edits/visibility, custom dark colours, empty list, responsive fit, guidance/navigation and shared accent colour. Publish to main as requested and verify real live responses.

## 2026-10-25 — Services refresh and navigation speed
- User authorized direct main publication. Services overview uses six contrasting warm/brand-compatible surfaces, with AI and domains as full-image cards. Admin custom card colours and images remain the source.
- Shared service template uses a white editorial hero and own managed showcase. Website showcase includes visible live project screenshots; accessible five-second rotation pauses on hover/focus, hidden tabs, user pause and reduced motion.
- Web design adds conversion-oriented editorial copy, native expandable own service offerings, and design-to-development/testing process. Pricing/contact/service-specific managed content remain. Empty tool lists no longer render a placeholder section.
- Decorative eyebrow labels removed across public headings. Legacy eyebrow settings retained for compatibility and internal contact context, no longer displayed as redundant labels.
- White public canvas and white service item hover/rest. Migration 0016 updates only former neutral background presets and exact old web headline; preserves custom colours, images and campaigns. Clears only the exact old grey empty-image hero overlay.
- Performance: no global content mask on client route changes with a current in-memory snapshot; still fetches no-store in background. Fresh initial/history loads and save revision protection retained. Initial read no longer queues a duplicate. Waits three essential Poppins weights, other weights on demand; independent D1 reads concurrent.
- Read-only tests: test-services-refresh.cjs covers delayed navigation, initial request deduplication, palette/full images, showcase, admin fixtures, all six pages+domains at three widths. test-content-lifecycle.cjs updated for visible quiet navigation while keeping strict first/history gating. Admin protection remains unchanged.

## 2026-10-25 — Requested service corrections
- Restored padded image/gradient ServiceHero banners on every service route and alias, preserving managed hero text, CTA and background. Removed the split editorial hero; showcase remains immediately below the restored hero.
- ServiceShowcase replaces ServiceEditorialHero. Media is edge-to-edge, object-fit cover, without an inner padded frame; rotation controls overlay the image. Uses custom managed visual first, otherwise current service image; own web project screenshots remain in rotation. Known transparent built-in artwork fills the frame through CSS cropping, with source files unchanged.
- Service processes reuse the connected-circle OpusApproach design with each page's own managed steps. Services use one horizontal row and an independently scrollable timeline on small screens; homepage behaviour unchanged. Explicit full-width centering on tools summary.
- DomainSearchBar no longer fabricates availability. Requires a complete valid domain, clears stale results when edited, and offers a correctly prefilled enquiry for team confirmation. No live registry availability integration is configured; do not claim this is an automatic availability check.
- Read-only test-services-refresh.cjs now covers restored heroes/admin controls, frame geometry, one-row timelines at all widths, centered tools notes, invalid 'bbb', normalized valid domain enquiries, and stale-result clearing, plus existing navigation/rotation checks.

## 2026-10-25 — Pesepay checkout and contact update
- User explicitly requested checkout based on uploaded processing/success designs, preferably payments.opuszim.co.zw. Standalone `/payments/` uses Poppins, owned logo, silver/white surfaces, orange/red ribbons, a processing view and verified receipt. Marketing navbar/footer are omitted only there via SiteShell; checkout does not depend on the marketing content freshness gate.
- Pinned official pesepay@2.0.0 is server-only, with Cloudflare fetch transport, strict TLS, fixed API host and no charge retries. GET config loads active USD/ZiG local methods. PayPal/Visa/Mastercard show the unavailable native dialog and are independently rejected server-side. Hosted provider receives the selected local method code.
- Backend: /api/payments/{config,create,status,webhook}; protected /api/admin/transactions GET/POST and Customer Payments tab. Initiation reserves D1 rows before gateway calls, checks amount/currency/method, binds idempotency to hashed 256-bit receipt capabilities and a normalized payload fingerprint, rate limits attempts. Status/notifications verify reference, amount/currency with checkPayment; partial/unknown/reversed states never show success. Verified customer payable amount is shown with invoice amount if different. Delayed success cannot overwrite a reversal. Uncertain initiation becomes UNCONFIRMED, no automatic charge replay. Admin can explicitly Verify with Pesepay (read-only gateway check) for missed notifications/reversals.
- Migration 0017 adds customer_payments/payment_rate_limits and updates public contact cards/social WhatsApp. Public primary email support@opuszim.co.zw; secondary opuszimbabwe@outlook.com; direct/WhatsApp 0710740387; support-only 0773979162. Admin Access identity/allowlist deliberately unchanged.
- Receipt access is capability guarded, excludes payer email/phone in public API, moves URL tokens into tab storage, and uses no-referrer, no-store and frame denial. Auth/header simulations remain localhost only. No card numbers/PIN/CVV collected.
- Added payments.opuszim.co.zw to the existing Pages project through API. At last check DNS/TLS validation is pending; available token cannot see/edit the zone. Required CNAME: payments → opuszimbabwe.pages.dev. Main /payments/ fallback works without that DNS change.
- Required encrypted Production variables PESEPAY_INTEGRATION_KEY / PESEPAY_ENCRYPTION_KEY were absent at initial checks. User has been asked via async tool to add them securely, and separately to add DNS. Check presence/types only, never print values. Redeploy after secrets change. Until configured, checkout disables payment initiation and shows support contact. Never claim live merchant acceptance/settlement until tested with an explicitly authorised real transaction.
- docs/PAYMENTS.md describes configuration and scope. Backend tests scripts/test-payments.cjs use in-memory Node SQLite and encrypted fake gateway, covering idempotency/races, forged callbacks, partial/incorrect amounts, reversals, bad redirects, timeouts/rate limits and local-only methods. Added to CI. Browser scripts/test-payment-checkout.cjs mocks financial APIs only and verifies design, overlays, mobile widths, processing/success, no forged-query success, token cleanup, missing-key disabled state and marketing shell.
- No real payments/charges made during implementation. Browser receipt screenshots contain test fixtures and are not payment evidence. Local network does not support direct Node fetch to the gateway (ECONNREFUSED); curl with normal TLS verification works. Production Workers fetch has its own network path; verify the deployed config API. Do not disable TLS to bypass local proxy limits.

- User replied that both merchant keys were added; metadata confirms both PESEPAY variable names now exist (no values exposed). Publish/redeploy to load them. User's DNS initially targets payments → www.opuszim.co.zw; requested correction to opuszimbabwe.pages.dev and awaiting response/validation.

- Live runtime correction: Cloudflare fetch rejects redirect:'error' (unsupported at the edge). Transport/public methods now use redirect:'manual' and explicitly reject 3xx; never follow an authenticated redirect. Added regression assertion to mocked gateway tests. Both Pesepay secrets are encrypted secret_text; Pages payment domain is now active after DNS correction.

- Dedicated hostname subsequently returned Cloudflare 1014 (cross-account proxied CNAME). Pages verification deactivated during DNS editing; PATCH domain revalidation restarted it. Available token's direct zone DNS read returns403. User has now been asked to switch only payments CNAME to DNS only; main apex /payments/ is already serving a configured=true live config with real USD local methods. Do not claim dedicated hostname is working until TLS/page/API checks return200. No real payment initiated.
