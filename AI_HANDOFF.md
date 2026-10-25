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

## 2026-10-25 — Method-first checkout, supplied wordmarks and mobile payments
- User requested supplied wordmark logos without repeated text, centred Opus, method before details, and method-specific mobile validation. Checkout now requires explicit method selection before revealing required amount/reference; name/email are optional receipt details. InnBucks/Zimswitch/Omari use hosted Pesepay with no local phone field. Anonymous receipts omit empty payer-name rows; admin ledger handles optional identity.
- Reused the user's current R2 uploads for InnBucks/OneMoney/Zimswitch as unchanged static assets in public/images/payments; existing EcoCash matches the supplied image. Matching green Omari artwork copied unchanged from https://omari.co.zw/images/logo.webp. Transparent margins excluded at render-time, no artwork edits/generation. Original provided assets/sizes documented in MethodLogo bounds.
- Shared phone policy in lib/payments: normalize +263/00263/263 into national form; OneMoney071, EcoCash077/078/079, exact10digits. Client gives immediate prefix feedback and disables continuation; server derives network from the fresh actual gateway method and independently validates before reserving/charging. Omari has no operator-prefix restriction. OneMoney remains conditional on actual Pesepay availability; no fabricated active method added.
- Supported mobile methods use official SDK makeSeamlessPayment with normalized phone in customer and gateway-required phone field. Customer approves via trusted provider prompt, never enters PIN here. Hosted methods still use initiateTransaction. Immediate mobile success is not trusted until independent checkPayment verifies exact amount/currency.
- Mobile initiation timeout cannot replay a charge. Authenticated callback may recover a missing gateway reference only through independently verified paymentId metadata + amount/currency. UNCONFIRMED keeps bounded polling; after2min UI asks for explicit status check/support, never a blind retry. Reversal/idempotency protections retained.
- Tests extended with encrypted fake mobile requests, provider-prefix rejections before initiation, canonical-format idempotency, optional hosted identity, immediate-success verification and callback recovery after accepted-but-timed-out requests. Browser fixture test covers logos/no repeated names, centred logo, explicit method-first order, currency reset, hosted details omitted, prefix/length restrictions, mobile/hosted handoffs, widths and safe receipts. No real payment requests in tests.
- Fixed a nested focus-scroll visual defect: decorative payment page/card now use overflow:clip, preventing focused fields/radio controls from scrolling/clipping the card while resizing.
- DNS still resolves to opuszim.pages.dev, which is not the actual assigned project address opuszimbabwe.pages.dev (confirmed through project API). User repeatedly says done but public resolvers still show the shorter incorrect target. Latest async question explicitly requests entire longer target. Keep main /payments/ working and do not point footer to an unverified hostname.

- DNS finally corrected and independently verified: payments CNAME now targets opuszimbabwe.pages.dev. Pages hostname active; HTTPS /payments/ and /api/payments/config both200, configured=true with real USD methods. Footer payment link now uses https://payments.opuszim.co.zw/. User also requested registrar registration; async question pending whether selling/managing customer domains via partner (recommended from prior context) or full ICANN accreditation. Official Cloudflare Registrar docs downloaded to /tmp/cloudflare-registrar-docs.txt for research; do not claim accreditation or submit paid/legal applications without the needed concrete business details/terms.

## 2026-10-25 — Registrar access verified
- User confirmed Cloudflare billing/contact/agreement prerequisites and edited existing token to include Registrar: Domains: Admin, retaining DNS Settings Edit, D1 Read/Edit, Pages Edit, Zero Trust Edit and Account Settings Edit. No secret values were supplied in chat.
- Read-only live checks now succeed HTTP200: /registrar/extensions/com, /registrar/registrations (zero records), legacy /registrar/domains (zero records), and non-billable POST /registrar/domain-check. Check correctly returns cloudflare.com unavailable and opuszim.co.zw extension_not_supported. Account-level Registrar access is working.
- Updated docs/DOMAIN-REGISTRATION-SETUP.md to remove obsolete403 blocker. Partner/service-provider route is confirmed: Cloudflare remains registrar of record, Opus registers/manages customer domains; no ICANN accreditation or formal reseller-program approval claimed. Owner billing/legal setup is attested, not tested by a charge. No domain bought/transferred. Existing public site still uses domain enquiries; automated supplier purchase/customer-order integration is not claimed or added by this verification. Exact domain/price confirmation remains required before a billable registration.

## Domain store / verified EcoCash — 2026-10-25
- Full Cloudflare API catalogue imported: 423 extensions, 407 priced, 16 enquiry.
- Approved default markup 25% of supplier cost, minimum USD5 gross markup/year;
  private admin Domains & Pricing changes future catalogue/quotes immediately.
- Customer legal ownership/eligibility and explicit exact-domain-price consent,
  fixed USD quote, local payment, automatic registration only after verified SUCCESS.
- Supplier purchase is once only. Ambiguous outcomes use read-only checks; paid
  support-resolution states retain the domain reservation. See domain setup docs.
- Runtime Registrar account/token saved encrypted in Pages, Access/Pesepay unchanged.
- Owner authorised ONE USD0.10 EcoCash test to number ending6530. Already sent,
  prompt confirmed by owner and independently verified SUCCESS. DO NOT send another.
- CTA/contact section saves canonicalise decimal gradient angles, transparent hex,
  whitespace and inactive blank controls; unsafe CSS is still rejected. No live
  customer design settings were overwritten by the release.

## Admin workspace, artwork and shareable receipts — 2026-10-25
- Admin is a standalone authenticated workspace with the same privileges: sidebar,
  real inventory shortcuts, searchable tools (Ctrl/Cmd K), a control finder that
  opens collapsed sections, and searchable payment/domain ledgers. No fake tasks,
  calendars, notifications, users or additional access privileges were introduced.
- Shared ValueSlider supports drag, numeric entry, double-click value reset and a
  keyboard-accessible restore button. Hero and overlay controls use it.
- Graphic design alone omits the immediate post-hero showcase. Each what_items
  entry can hold a validated design: uploaded artwork, container shape/proportions,
  overlay/gradient, text positioning, colour, size and weight, or text below artwork.
  Missing/failed images hide the public class. No invented client portfolio images
  were populated; admin must add their actual work. Old content remains compatible.
- Services overview has an inset white hero card. The dark capabilities block is
  white with #0f0928 text. Problem paragraphs are centred, navy and slightly smaller.
- Process icons are 80px containers/30px artwork, progressively morph on viewport
  entry, and respect reduced motion. Project screenshot containers are 16:9, cover.
- Successful payment receipts have a grey Opus Verified watermark. Download/share
  rechecks payment status, then creates a Poppins PNG locally. Native file sharing
  opens supported apps; unsupported browsers download for manual attachment.
  Existing print receipt also includes the watermark. No new live charge was sent.
- PNG generation loads the actual bundled Poppins face, excluding Next's optional
  system fallback; missing device fallback fonts must not block receipt export.
- New browser fixture script scripts/test-workspace-refresh.cjs covers controls,
  responsive layout, artwork visibility, receipts, native share and reversals.

## RGBA gradients / independent service media — 2026-10-25
- Shared strict colour/gradient parser supports RGBA alpha0–1, RGB0–255, transparent,
  hex3/4/6/8 and 2–12 gradient stops/positions. Common visual editor adds/removes/
  reorders stops with per-stop alpha, angle and raw CSS. Renderers canonicalize full
  linear-gradient wrappers for live previews too. No arbitrary CSS/URL functions.
- Hero background_rotation none/static/slides is independent of foreground rotation.
  Timers, pause, hover pause and reduced motion cover both layers. Legacy normalizer
  preserves the previously displayed first background and background-only rotation.
- All upload buttons use a browse/drop/paste dialog. Direct drop/paste image zones
  share existing target-aware, concurrent-safe R2 upload flow. Uploads remain drafts
  until saved; local files never navigate the editor away. Max5MB/one file per target.
- service_presentations settings namespace separates home/overview/detail hero/
  detail showcase/detail illustration media, colours/gradients, overlays and text.
  Individual service save validates first and commits a single D1 batch, merging
  only that service ID so other services' settings cannot be overwritten.
- Snapshot legacy media defaults before deployment with the initializer documented
  in docs/ADMIN-DESIGN-CONTROLS.md; existing placement settings win. This also freezes
  copied showcase slides so changing project screenshots cannot alter service pages.
- Graphic category uploads/styles remain separate. Its removed post-hero showcase
  remains hidden and has no ineffective editor option. No payment/registrar changes.
- Tests: strict RGBA/gradient safety and roundtrips; isolated SQLite atomicity and
  namespace preservation; browser fixtures for stop editing, simultaneous/static
  background modes, pause, drop/paste/direct/modal uploads and responsive controls.

## Admin verified receipts — 2026-10-25
- User authorised Resend for admin-issued receipt emails. Async setup request asks
  owner to verify sender and add encrypted RESEND_API_KEY + RECEIPT_FROM_EMAIL in
  Production. Do not claim live delivery until configured. Never paste/read keys.
- Migration0021 adds domain receipt email/optional WhatsApp and private receipt
  drafts/delivery records. Receipt contacts do not change registry legal contacts.
- Admin receipt composer available from successful payment rows and paid domains:
  fresh strict Pesepay verification, preview, recipient confirmation, explicit email
  send, PNG download/native sharing, optional WhatsApp draft, delivery/history.
- Strict receipt reconciliation validates current SUCCESS/ref/amount/currency and
  explicitly skips domain fulfilment. Default payment reconciliation is unchanged.
- Resend uses fixed HTTPS endpoints, redirect:manual, bounded timeouts, send lock,
  idempotency, acceptance/delivery distinction, no blind replay after uncertainty.
- Email contains branded HTML + private90day receipt link; customer receipt page
  verifies token hash + payment again, supports PNG/share/print PDF, no legal address,
  payer email, WhatsApp or payment capability exposed. Reply-to support@opuszim.co.zw.
- No real test emails or payment requests authorised/sent. All send/provider tests
  use mocks. Broader project logs/reports/automations must be discussed and questions
  asked AFTER receipt work, before implementation. Do not start that system yet.
