# Opus Zimbabwe — Backend Handoff

## Current phase
The repository is a static Next.js frontend for Cloudflare Pages. No live payment, domain, database, authentication, admin, or external API calls are connected.

## Public routes
/, /services, /domains, /projects, /faq, /contact, plus the six standalone service pages under /services/.

## Backend phase to be designed
The future backend should support:

- Admin authentication and role-based access
- Private admin deployment at admin.opuszim.co.zw
- Partner records: logo, name, description, URL, visible, featured, order
- Project records: name, URL, description, screenshot, thumbnail, visible, featured, order
- Image uploads using object storage
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
