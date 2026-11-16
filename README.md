# Opus Zimbabwe

This repository preserves recoverable files from the working Cloudflare website,
its supporting Workers and OpusChat apps, captured 15 November 2026.

**All 16 missing API handlers now have reconstructed, tested implementations.**
They implement the recorded route methods and live database/UI contracts; they
are not recovered originals. See [implementation and validation notes](docs/RECONSTRUCTED-PAGES-FUNCTIONS.md).
The root frontend and some supporting code remain an older baseline, so release
parity is not yet verified. Production builds stay guarded and automatic GitHub
deployment stays paused. The working site remains on its existing deployment.

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

The original paths in
[missing-pages-functions.json](production/state/missing-pages-functions.json)
are retained as provenance: reconstructed files now exist at all 16 paths.
Four protected admin shell assets and the latest Android 1.0.5 native source
remain unrecovered. Validate the replacements and supporting legacy code
against a staging copy of the working site before release.

Reconcile reconstructed source with deployed versions and run the application,
payment and security checks before marking release parity verified or re-enabling
automatic deployment. Do not use `npm run build:legacy` to deploy over production.
The pending Mastercard checkout patch remains separately in the original
workspace; it is not mixed into this current-version snapshot.
