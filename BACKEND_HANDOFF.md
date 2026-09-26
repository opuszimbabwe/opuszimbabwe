# Opus Zimbabwe — Backend Handoff

## Current phase
The public site is a static Next.js export for Cloudflare Pages. An admin
content layer now exists: `/admin` dashboard (Cloudflare Access protected,
allow-listed to info.opuszim@gmail.com), Cloudflare D1 for content
(services, pricing, hero background), and R2 for uploaded images via Pages
Functions in `functions/`. The public site falls back to baked-in static
content whenever the API is unavailable. No live payment or domain APIs are
connected.

Setup and deployment: docs/ADMIN.md.

## Public routes
/, /services, /domains, /projects, /faq, /contact, plus the six standalone service pages under /services/.

## Remaining backend work
The future backend should still add:

- Admin authentication and role-based access beyond the single allow-listed admin
- Private admin deployment at admin.opuszim.co.zw
- Partner records: logo, name, description, URL, visible, featured, order
- Project records: name, URL, description, screenshot, thumbnail, visible, featured, order
- Contact/enquiry submissions
- Checkout and payment integration after payment requirements are confirmed
- Domain-registration enquiry workflow
- Email notifications
- Audit logging and validation

## Important constraints

- Do not expose admin routes in the public navigation or sitemap.
- Do not hardcode secrets.
- Use environment variables for database, authentication, payment and Cloudflare credentials.
- Do not enable live payment or domain APIs until their exact providers and credentials are confirmed.
- Keep the existing public visual system and route structure.
- The static frontend can later be migrated from `output: 'export'` to OpenNext/Cloudflare Workers when server-side functionality is ready.
