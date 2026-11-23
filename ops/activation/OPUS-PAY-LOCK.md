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
