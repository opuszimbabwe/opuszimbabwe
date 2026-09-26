# Opus Zimbabwe

Next.js 14 App Router site for Opus Zimbabwe, deployed to Cloudflare Pages
(static export + Pages Functions).

## Development

```bash
npm install
npm run dev
```

## Production check

```bash
npm run build
npm start
```

## Admin dashboard & content API

`/admin` (private, Cloudflare Access protected) edits site content stored in
Cloudflare D1 — service cards and images, pricing cards, hero background —
with images uploaded to R2. The public site keeps rendering the built-in
static fallback content when the API is unavailable.

```bash
npm run checks            # typecheck + build + local D1 migrations + db checks
npm run pages:local       # serve site + API locally on :8788
node scripts/smoke-api.mjs  # end-to-end API/auth/upload tests
```

Deployment and Cloudflare Access setup: see **[docs/ADMIN.md](docs/ADMIN.md)**.

Public routes include Home, Services, Domains, FAQ, Contact, and the six service landing pages. Payments and third-party API integrations are not connected.
