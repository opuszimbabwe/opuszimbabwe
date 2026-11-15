# Opus Zimbabwe

This repository preserves recoverable files from the working Cloudflare website,
its supporting Workers and OpusChat apps, captured 15 November 2026.

**The original Pages server source is not fully recovered.** The root Next.js
application is an older baseline; deploying it would omit working chat,
WhatsApp, feedback and Paynow endpoints. Production builds are guarded and
GitHub automatic deployments are paused. The working website remains running
on its existing Cloudflare deployment.

| Location | Contents |
| --- | --- |
| [production/](production/README.md) | 455 assets verified against Cloudflare hashes, four exact active Worker bundles, route/configuration records and schema definitions. |
| [recovered-source/](recovered-source/README.md) | 199 source/app/brand files previously stored outside Git. Some predate the latest deployed bundles. |
| [ops/recovery/](ops/recovery/README.md) | Read-only export and integrity verification tools. |
| [Deployment audit](docs/LIVE-DEPLOYMENT-AUDIT.md) | Evidence explaining why production and GitHub diverged. |
| [Historical development notes](docs/LEGACY-README.md) | Instructions for the older Next.js baseline. |

Credentials, signing keys, customer conversations, private files, installer
binaries and dependency/build caches are deliberately excluded. Cloudflare
secrets, D1 data and private R2 objects remain in their existing services.

## Verify recovered files

```sh
npm ci --prefix ops/recovery --ignore-scripts
npm run verify --prefix ops/recovery
```

Verification checks original Pages asset hashes, SHA-256 hashes of every Worker
module and recovered source file, and that the database export is schema only.

## Restore deployment readiness

Recover the 16 Pages Functions listed in
[missing-pages-functions.json](production/state/missing-pages-functions.json),
with their matching libraries and build configuration. Four Access-protected
admin shell assets have not been exported. Native Android 1.0.5 source also
needs recovery; the available Android source predates it.

Reconcile recovered source with deployed versions and run the application,
payment and security checks before marking recovery complete or re-enabling
automatic deployment. Do not use `npm run build:legacy` to deploy over production.
The pending Mastercard checkout patch remains separately in the original
workspace; it is not mixed into this current-version snapshot.
