# Cloudflare logo in live domain search

Use the unchanged SVG from Cloudflare's official public documentation repository:
https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/assets/logo.svg

The credit reads “International domains via Cloudflare”. It accompanies the
international domain registration flow; Zimbabwean domains retain the existing
assisted-registration explanation. It does not claim partnership or endorsement.
The icon is served locally, sized explicitly and has adjacent accessible text.

The actual published widget source predates the root workspace component. The
release therefore patches only its exact shared client component and matching
server-rendered markup on home, /domains/, and the two existing hosting routes.
Other public HTML/RSC files receive only the new shared chunk filename. This
avoids a full Next rebuild, hydration differences and stale immutable JS caches.

```sh
node scripts/build-cloudflare-domains-release.cjs
npm run typecheck
python ops/site/deploy-cloudflare-domains.py
# Commit/push reviewed source to main, then:
python ops/site/deploy-cloudflare-domains.py --activate
```

Verify the logo at 320/390/1440px, image decoding, hydration, client navigation
and mocked domain-search results. Do not purchase a domain or submit a real
registration. Check the served pages after activation. The exact backend bundle,
checkout assets, protected admin shells, automatic deployment protection and
all supporting Worker versions must remain unchanged. No database migration.
Rollback targets the recorded immediate baseline if a material check fails.
