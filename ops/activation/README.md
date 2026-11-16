# Mastercard on the existing checkout

This manual release preserves the Nov 8 approved frontend. It does **not** run
Next build: the older root frontend is still guarded against production use.
All 459 original asset paths remain present; only the payments HTML/RSC change,
plus a new cache-busted checkout chunk and Mastercard SVG. The four protected
admin shells reuse their existing Cloudflare hashes. No supporting Worker is
uploaded or redeployed. The full Pages API router includes the 16 reconstructed
handlers, whose original source was not recovered.

Mastercard is enabled only for active USD Pesepay method PZW205 with valid
provider limits. The official BASIC hosted checkout collects card details.
Visa/PayPal remain unavailable. Existing same-project production secrets are
inherited without exporting their values or introducing a duplicate gateway.

The release also preserves the live footer/gallery/banner settings, null project
download metadata, disabled Paynow configuration and configured WhatsApp AI
behavior. Existing private downloads remain private and retain binary MIME for
non-ZIP files. These compatibility changes avoid regressions from older helpers.

## Validation and release

```sh
npm run typecheck
npm run test:reconstructed
# Run mocked payment/domain/receipt/care regressions from .github/workflows/ci.yml.
npm run release:prepare
python ops/activation/deploy-preserved.py
# Commit and push all reviewed source to origin/main, then rebuild release artifacts.
npm run release:prepare
python ops/activation/deploy-preserved.py --preview
# Inspect preview, compare /api/content, and confirm unauthorized admin access fails.
python ops/activation/deploy-preserved.py --activate --apply-migration
```

Default preflight is read-only. Preview uploads to a separate branch without
modifying production; its existing preview environment has no payment secrets.
Both upload actions require a clean commit already pushed to GitHub main.
Activation inherits production bindings and applies **only** additive migration
0027, never the old migration backlog. It stops if production, any supporting
Worker, automatic-deployment protection or protected asset availability changed.
It also stops if there is queued/sending WhatsApp work requiring reconciliation.
No real payment, WhatsApp message or notification is part of automated tests.

Before activation, isolated Chromium tests exercised the preserved checkout at
390px and 1440px, including SSR hydration, logos, currency/method selection,
submission and absence of PAN/CVV fields. Public content was compared structurally
with the original live response using private local CMS fixtures; no fixture or
customer data is committed. Provider settlement and physical-device notifications
are outside these tests.

After activation, verify the main domain and Pages origin content, USD/ZiG
configuration, responsive checkout, authentication and unchanged Worker versions.
If a release fails, restore the exact baseline immediately:

```sh
python ops/activation/deploy-preserved.py --rollback 18a7f56e-775d-4ac4-a15f-91083eebd122
```

The additive tables/indexes can remain after rollback; no existing customer rows
are altered. Record the actual release ID, source SHA and smoke checks separately
from the immutable source-recovery snapshot. Automatic legacy Next deployments
stay disabled.
