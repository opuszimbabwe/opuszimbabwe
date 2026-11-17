# Working production snapshot

Original approved Pages deployment: `18a7f56e-775d-4ac4-a15f-91083eebd122`. This directory
preserves its recoverable artifacts and the Workers serving the website.
Nothing was redeployed to create this original snapshot.

The current activation is recorded in `current-release.json`; the latest Opus Pay
checkout artifacts, complete deployed Pages worker bundle and resulting manifest
are in `releases/2026-11-17-opus-pay/`. The preceding Mastercard release remains
preserved in `releases/2026-11-16-mastercard/`. Original recovery files stay unchanged.

- `pages-assets/`: 455 exact files, 33,351,180 bytes. Each file's Cloudflare
  BLAKE3 hash matches the original deployment manifest.
- `workers/`: exact active compiled modules for `opus-content-first-paint`,
  `opus-inbox-notifications`, `opus-care-renderer` and `opus-care-scheduler`.
  Module hashes, active version IDs, compatibility settings and binding names
  accompany each module. Secret values are absent.
- `state/pages-asset-manifest.json`: all 459 original asset paths and hashes.
- `state/pages-asset-recovery.json`: per-file checks and the four protected
  admin HTML/RSC assets not exported.
- `state/pages-function-routes.json`: actual deployed Pages routing manifest.
- `state/missing-pages-functions.json`: the 16 unrecovered original module paths. Reconstructed replacements now exist;
  provenance and hashes are in `state/reconstructed-functions.json`.
- `state/database-schema.json`: schema definitions, without customer/content rows.
- `state/recovery-status.json`: explicit recovery completeness and exclusions.
- `state/source-recovery-search.json`: extended source search results; no
  original Pages handler files were recovered from the checked locations.

The original Pages Functions runtime remains available in the rollback deployment, but its
complete source/build bundle has not been recovered. This is a partial disaster
recovery backup, not a complete replacement deployment. Database content,
uploaded media, private app-download objects, signing identities and secrets
remain outside Git.

Worker script GET returns the newest uploaded bundle, even when an older
version is active. The root export uses the previously verified native-v25
bundle matching the active version, not the removed Mastercard adapter.
Version metadata is authoritative for compatibility flags.

Automatic GitHub deployments were paused before pushing this update. Prior
settings are recorded in `state/github-deployment-protection.json`. Keep them
paused until the complete Pages source is recovered and reconciled.

All 16 API replacements are now implemented and locally tested. See
`../docs/RECONSTRUCTED-PAGES-FUNCTIONS.md` for behavior, validation and remaining
release gates. Their implementation does not make the original source recovered
or establish full production parity. That reconstruction commit did not change live deployment or schema. The later
reviewed activation applied additive migration 0027 and deployed the preserved
frontend release; see `current-release.json` for actual checks and limitations.
