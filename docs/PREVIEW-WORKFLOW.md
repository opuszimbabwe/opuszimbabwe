# Preview before production

All website changes must first be shared in a separate Cloudflare Pages preview. Apply them to the main site only after explicit user approval. Do not push to main or deploy to the opuszimbabwe project as part of preview work.

## Content loading fix

The static export previously painted built-in fallback content, then replaced it after fetching current D1 content. The API already uses no-store, so clearing browser caches does not fix this sequence. SiteContentBoundary now waits for the shared content request and self-hosted Poppins before exposing the page. It shows a neutral loading message while pending. An eight-second request timeout falls back once; the no-JavaScript path still shows the static content. useSyncExternalStore keeps first hydration and all content subscribers consistent.

Poppins is bundled through next/font/local from the pinned @fontsource/poppins package; no runtime Google Fonts request is needed. Home hero grid gutters are 40px and the text container top padding is 88px. Payment logos retain colour without hover. Current desktop navigation has a white pill, a left-hand icon and aria-current, including Services on nested service routes. The process timeline follows the supplied connected-circle reference while preserving the existing admin-managed step text and count.

## Review deployment

Use the separate opus-design-preview project and design-review branch. Build in /workspace/opuszimbabwe. Stage out/ and a preview-only Wrangler configuration outside the repository. Do not copy production D1/R2 bindings or admin-write Functions to the preview. A preview may proxy public content/media GET requests to opuszim.co.zw to display current content, but must never proxy admin endpoints or writes.

## Latest copy and spacing revision

Canonical requested homepage copy is in lib/homepage-copy.json. Migration 0012 updates only the two hero headline fields within home_sections and the process steps; apply it to production only after explicit approval. Other homepage settings are preserved. The preview's read-only public-content proxy overlays that same JSON to review the new copy without changing production D1.

The Chrome reference's content-grid gutters are 28px below 600px, 40px from 600px, 72px from 1024px and 74px from 1440px, with a 1440px maximum frame. These replace the earlier fixed 40px hero gutter. Hero text top padding remains 88px. The headline uses Poppins Bold (700) at 38/54/72px, replacing the previous 44/62/84px Black (900).

## Service cards, backgrounds and logo fixes

Service cards are now grouped into expanding image rails with 950ms width/image transitions, delayed copy reveal, keyboard controls, touch expansion and reduced-motion support. They use existing service images, no numbered labels, and per-card colour. Process icons use Opus orange with hover outlines; the pale background is also used for the default Projects and FAQ sections.

Admin → Hero & Sections → Final CTA controls the CTA image, base colour, solid/gradient overlay and opacity. Save using Save headlines & colours. Admin → Brand, Icons & Contact → Contact Page Hero Background provides the same controls and its own save button. Both editors include a live background preview. New settings are cta_design and contact_hero_design; they use existing D1 settings rows and need no new tables. Public settings reads now include both keys.

Payment-list validation is atomic: malformed logos or duplicate IDs reject the save instead of silently dropping rows. Empty payment/partner lists remain empty, without reverting to seed logos. Async payment/partner uploads follow record IDs instead of array positions, so removal/reordering during upload cannot target another logo. Public content refreshes on focus, visibility, save notifications across tabs and every 30 seconds while visible; failed refreshes preserve the last good content. A failed partner save no longer gets masked by a success message for the section heading.

Validation (local services only; scripts restore saved content):

- `npm run typecheck`, `npm run build`, `npm run db:migrate:local`, `npm run db:check`
- `node scripts/smoke-api.mjs` (112 existing checks)
- `node scripts/smoke-design-admin.mjs` (uploads seven replacement logos, checks public reads, atomic rejection, intentional empty lists, design persistence and validation)
- `node_modules/.bin/esbuild scripts/test-content-settings.ts --bundle --platform=node --outfile=/tmp/opus-content-tests.cjs` then `node --test /tmp/opus-content-tests.cjs`
- With Chromium and playwright-core available, `PLAYWRIGHT_MODULE_PATH=/workspace/.tools/browser/node_modules/playwright-core node scripts/test-design-interactions.cjs` tests real mouse/touch motion, live logo refresh, both admin editors and public background rendering. The browser package is a local QA tool outside the repository, not an application dependency.

Run database checks, API smoke tests and browser mutation tests sequentially, since they all temporarily modify local content. Hosted design preview remains read-only; admin writes are verified locally and require the approved production release before taking effect on the main site.

## Home Hero Design Studio

Admin → Home Hero Design provides current-split, campaign-banner, full-bleed-centred and inset-card presets. These are starting points, not copied McAfee assets or typography. The editor keeps Poppins and supports fixed text over background-only rotation, the original service-image/text rotation, or a static hero.

Controls cover headline/emphasis/description/eyebrow, primary and secondary actions, desktop/phone font sizes, weight and colours, text alignment and position, hero/content widths, responsive or custom gutters, card edge distance and corners, height and vertical padding, optional text-panel colour/opacity/padding, foreground image/fit/height, background image uploads/slides/order/focal point, solid/gradient overlay colours/angle/opacity/placement/width, animation style/duration/interval and hover pause. Reduced-motion visitors get a static slide, and other visitors have a pause button. Blank text/image overrides retain the existing homepage/service settings, and the original layout remains the default.

The hero_design JSON setting uses the existing settings table and is validated server-side; invalid URLs, dimensions or intervals are rejected. No new database tables or production changes are required to review the feature. Phone layouts constrain excessive custom spacing and keep the text and actions inside the viewport. Uploaded background slides are targeted by stable IDs.

Test locally with `PLAYWRIGHT_MODULE_PATH=/workspace/.tools/browser/node_modules/playwright-core node scripts/test-hero-studio.cjs`. It checks preset editing and saving, public rendering, overlay/focal point, independent background rotation with unchanged copy, pause, reduced motion, mobile sizing and the original split layout with a background. It restores the previous hero settings. Run after other tests that mutate D1.

### Preview-only hero playground

The isolated preview also has `/hero-playground.html`, built with `node scripts/build-hero-playground.cjs` after staging the normal out/ assets. It is a browser-only sandbox: presets and settings preview immediately, Save hero design stores the draft in that browser's localStorage, and the full-width view can demonstrate animation. It neither publishes nor calls admin write APIs. Real uploads and site-wide saves remain in the authenticated admin. This file/bundle is generated only into preview staging and adds no production editor route. Rebuild it after replacing the staging out/ directory.

## Admin consolidation and reference-guided solution finder

Home Hero Design now owns the hero editor and original service-carousel content. Homepage Sections owns section headings, colours and the final CTA. The existing grouped sticky sidebar is retained and can scroll on shorter screens. Hero controls are grouped into collapsible sections, and copy/typography controls start collapsed to reduce clutter.

Hero corners support layout defaults, a uniform radius, or four independent radii on every layout. Campaign and full-bleed presets use square top corners with 64px bottom corners. Legacy saved hero configurations are upgraded by adding missing fields while preserving existing layout, copy and typography.

The secondary hero action can open Help Me Choose or link to a page. The Opus-specific bottom-sheet wizard asks about the visitor's goal, organisation and starting point, recommends an available service and passes the answers into a contact enquiry. It does not submit anything or send a message automatically. It uses a native modal dialog for keyboard trapping/Escape, returns focus on close, supports touch and reduced motion, and does not copy McAfee's products or marketing text.

Confirmed audit fixes: explicit empty FAQ/social/contact/approach/Why Us lists no longer resurrect seed content; invalid list saves reject atomically; new Why Us cards reveal correctly beyond the original count; partners/projects added after an empty list are observed and displayed; service visibility is reflected in navigation, footer and contact options; the footer uses the managed brand logo; saved section colours are no longer overridden in rendering; cleared partner subheadings and service tool images stay cleared; and saves during an in-flight public-content read queue a fresh read. Admin editing cannot initialize from seed content when the current-content request fails. Working save flows remain in place. Index-based upload lists prevent structural edits while busy, while ID-based logo/project uploads retain their record targets.

Migration 0013 establishes the already-reviewed pale section defaults once, preserving other custom colours; later admin colour choices are rendered exactly as saved. Apply production migrations only after release approval.

Additional local audits: `node scripts/test-admin-audit.cjs` (all save groups, six service editors, empty/addition/visibility cases, branding/colours, independent corners and concurrent refresh), and `node scripts/test-solution-finder.cjs` (all recommendations, contextual handoff, dialog keyboard/touch behaviour). Both use the same PLAYWRIGHT_MODULE_PATH setting as the other browser checks and restore local data. Run mutation suites sequentially.

## Approved production release and content freshness

The owner explicitly approved applying all changes to the main site. Production deploys from GitHub main through the existing Cloudflare Pages Git integration. A production D1 SQL export is retained in ignored backups/ before applying migrations 0012 and 0013. Do not overwrite existing production bindings or Cloudflare Access configuration.

Documents and dynamic API responses now carry browser/CDN no-store headers via Pages middleware; immutable hashed assets and random-key R2 media retain their cache policy. The current content request is required before revealing a new client route. Page-exit/hidden state masks the old DOM, and history/visibility restoration requests fresh content before revealing it. Fresh-read failures show a neutral retry screen instead of a previous design. A successful admin save waits for the queued post-save content read before reporting success, and other same-origin tabs are notified immediately. Other visible sessions poll every five seconds; no networked application can promise simultaneous zero-latency updates across disconnected browsers.

Additional check: `PLAYWRIGHT_MODULE_PATH=/workspace/.tools/browser/node_modules/playwright-core node scripts/test-content-lifecycle.cjs` verifies response headers, delayed first paint, client navigation, exit/history restoration and retry without an old snapshot.

Hero/settings saves additionally return a committed public settings snapshot in the save response. The client applies it immediately instead of making a second content GET. A private settings revision counter advances in the same D1 transaction; delayed older save responses cannot replace newer settings already loaded in that browser. Existing service/project/pricing state is retained while applying a settings-only snapshot. If a snapshot cannot be read after a successful write, the client falls back to a required fresh read and never reveals an old snapshot on failure.

Local check: `PLAYWRIGHT_MODULE_PATH=/workspace/.tools/browser/node_modules/playwright-core node scripts/test-hero-save-consistency.cjs` verifies delayed-save ordering and a successful save when a subsequent content GET is unavailable. It restores original settings and must run sequentially with other mutation tests.

## Admin access hardening

The owner authorised the security fix separately from pending visual changes. `/admin/` and its static/data variants redirect to the canonical `/sysadmin/`. Production middleware authenticates every sysadmin page/data request before serving it, including deployment hostnames. Production API authentication fails closed without cryptographic Access verification; header simulation is localhost-only. The static document contains no dashboard controls; AdminAccessBoundary verifies the session before rendering and rechecks on tab/history restoration. Existing Access application policies and bindings remain in place.

Checks: bundle/run `scripts/test-admin-access.ts` with esbuild and node --test; run `scripts/test-admin-visibility.cjs` against the local Pages emulator for initial, denied, authenticated and restored sessions.

## Selectable service-word hero and contact fields (preview)

The new default/current preset uses “Work with Zimbabwe’s Best”, Poppins Bold, synchronized service words and service images on the left. All six existing services, images, descriptions and destination links remain editable. Classic split, campaign, full-bleed and card presets remain available; older saved hero designs upgrade to static headline mode so a custom monthly campaign is preserved. Foreground controls now include caption gap, size and Poppins weight. The existing transparent artwork is cropped at render time to remove internal padding; uploaded/custom images retain their normal fit controls.

Word entry/exit uses a 500ms vertical spring transition, clears the previous word after exit and reserves space for the longest phrase. The accessible heading exposes one service phrase; reduced-motion and pause controls stop cycling. The same active index drives the image, description, headline word and destination. Service headline words round-trip through the admin API and content normalization.

Contact fields strip textarea-only props, provide connected labels and reserve separate label/text space for typed, autofilled and prefilled content. Phone fields use tel; service selection has an accessible name. Test with `scripts/test-rotating-hero.cjs` against local Pages; it restores settings.

Preview proxy overlays only the proposed hero design on public GET content. It has no production database bindings or admin-write proxy. Visual changes await approval; security commit 6bc343b was authorised and deployed separately.

## Approved hero release, loader removal and transparent tab icon

The owner approved the service-word hero/contact release. The visible Loading Opus Zimbabwe and history-return loading messages are removed; the fresh-content gate, retry-on-error and admin authentication remain. The original transparent `uploads/favicon-96x96.png` is copied unchanged to `public/images/opus-favicon-transparent.png`. The prior built-in and selected uploaded favicons were fully opaque white squares. Static metadata now resolves the current admin icon through no-store `/api/favicon`, and BrandHeadSync updates every competing icon link and clears obsolete size/type hints. Future administrator favicon uploads remain supported.

Validation: typecheck/build, `scripts/test-favicon.ts` and `scripts/test-content-lifecycle.cjs` (no visible loader, fresh first load/history/navigation, retry and favicon consistency). Production icon selection is updated conditionally from the inspected opaque asset; the original R2 asset is preserved.

## Pending review: upload focus, hero gutters and notched contact fields

Returning from a native file picker previously invoked both public-content and session focus checks in blocking mode. Verified, still-visible admin pages now refresh content and revalidate the session quietly on focus; denied sessions still unmount the dashboard, and hidden/history returns still require verification. An upload ref lock prevents simultaneous duplicate selections, while uploaded images remain drafts until their existing Save action.

The shared inner-hero-frame applies the responsive page gutters to all six service heroes and the contact hero. The services index also uses the shared text frame. Contact fields now use native fieldset/legend notches: empty fields have a complete outline; focused/filled labels sit on the top border, with no painted background patch. Field fill is controlled by --field-fill and remains independent of the surrounding page.

Local checks passed: typecheck/build, test-upload-focus-outline.cjs (two actual local uploads, delayed focus checks, draft retention, native notch/transparent label, all six service heroes/contact at phone/tablet/desktop), test-admin-visibility.cjs and test-content-lifecycle.cjs. Tests never upload to production. These edits await visual review in the isolated preview; do not push main before approval.

## Pending review: payments, navigation and project showcase

Payment logos moved from the standalone under-hero strip into the Local Payments Why Choose Us card. Existing payment-method add/edit/remove/upload/visibility controls still supply that list. Each reason card has a Show managed payment logos toggle; legacy Local Payments titles enable it automatically, and the persisted flag survives later title changes. The payment label is now the accessible name of the logo group. Known transparent padding in the bundled Paynow asset is cropped at render time; the file and admin-uploaded replacements are preserved.

Navigation keeps its route icons/pills, links, spacing and scroll behaviour, with white surfaces, near grey shadows, semibold default text, bold current pages, and red-to-orange Get Started buttons on desktop/mobile. Footer’s orange rule is replaced by a 1px soft grey divider.

Home and Projects share ProjectCard: a rounded square canvas with inset, object-contain screenshots (no content cropping), client logo/name beneath (38px logo, 32px/24px spacing), full 16px description and project metadata. Optional admin-managed logo and hover-video URL support the supplied reference. Video loads/plays only on hover or keyboard focus; reduced-motion users keep the screenshot, and failed/blocked playback retains it. Uploaded screenshot, name, URL, location, visibility and description controls remain.

Migration 0014_project_presentation adds optional logo/preview_video columns with empty defaults; applied locally only. After main-site approval, back up production and apply this additive migration before deploying the new project-save endpoint. Public reads tolerate pre-migration rows. Do not publish main or apply remote migration before approval.

Checks: typecheck/build, test-projects-payments-navbar.cjs (local API writes/restoration, hidden logos/card toggle/renaming, actual generated WebM hover/focus playback, reduced motion, screenshot containment and mobile layout), and smoke-api.mjs (113 checks). Updated stale smoke expectations for the already-approved secure admin redirect and new service-word hero rather than retaining old public-admin/old-headline assumptions.
