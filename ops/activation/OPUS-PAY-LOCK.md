# Opus Pay restoration and deployment lock

Restored 23 November 2026. The restoration overlays the last verified Opus Pay
assets onto the actual live manifest, retaining every existing non-payment
asset hash, including the actual current protected admin hashes.

The backend is restored from the verified 21 November release. This restores
USD-only initiation, all nine method mappings, direct wallet flows and the
previously tested WhatsApp safeguards. The uncommitted legacy backend from
the replaced deployment was not recoverable; it was not represented as retained.
No database migration, credential change, payment or WhatsApp test was made.

`opus-pay-lock.json` pins 19 payment assets and the verified backend bundle.
The shared deployment helper rejects uploads with missing/changed locked files
or a different backend. Automatic GitHub deployments remain disabled. CI tests
positive and negative lock cases. Future backend edits need explicit review,
mocked payment regressions and a deliberate lock refresh.

This guards repository deployment tools; it cannot prevent a Cloudflare account
administrator uploading directly or deleting the guard. Do not describe it as
an account-level immutable lock.

The restoration archive records the actual previous-live manifest and current
manifest. Retained non-payment files are identified by hashes; their protected
contents are not exported. The archive stores the restored payment/dependency
files and exact backend bundle. Live verification confirmed the full manifest,
all nine configured methods, Paynow enabled and USD-only availability. The live
Chromium check was blocked by the environment browser's CA trust; TLS checking
was not bypassed. Local preserved-checkout tests had passed with providers mocked.

## Approved payment-notification extension

The 23 November backend lock refresh adds verified-success notifications to
admin@opuszim.co.zw. All 19 checkout asset pins stay unchanged. Migration 0031
adds the private notification outbox; PAYMENT_ADMIN_NOTIFY_TO enables it only
for the configured admin address. New successes enqueue atomically with the
verified payment update. Repeated callbacks do not resend; historical successes
are not backfilled. The maintenance tick recovers unsent pending jobs. Rejected
or uncertain email attempts remain for operator review; an accepted provider
response does not itself establish inbox delivery. No live test email/payment
is required for this release.

## Grouped hosted-card handoff

The reviewed grouped-card release replaces the three card selectors with one
International cards & Zimswitch row. Visa, Mastercard and Zimswitch logos are
decorative, not individual choices. Continue opens the existing amount/reference
form; Continue to Pesepay initiates hosted BASIC without paymentMethodCode,
customer card details or method-required fields. Legacy card-code requests
also omit the method code, so stale clients cannot reintroduce preselection.
Wallet flows, verified admin notifications and non-payment assets are preserved.
`test:checkout:cards` verifies desktop/mobile and the mocked generic handoff.
