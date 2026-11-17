# Production source recovery

- Read `production/README.md`, `docs/RECONSTRUCTED-PAGES-FUNCTIONS.md` and
  `production/state/recovery-status.json` before deployment work. All 16 missing
  handlers now have reconstructed implementations, not recovered originals.
  The root frontend and some supporting code still predate the working site.
- The working Pages deployment is recorded in `production/current-release.json`
  (currently `f57e8218-4ccc-4acb-a529-21d180107b2c`). The original
  `18a7f56e-775d-4ac4-a15f-91083eebd122` remains the rollback baseline.
  Preserve the current frontend assets and all supporting Worker versions.
- Preserve the production build guard. Do not use `build:legacy` for production
  or re-enable automatic deployment while release parity remains unverified.
- Run `npm run typecheck` and `npm run test:reconstructed` for handler changes.
  Keep provider tests mocked. Additive migration 0027 was applied live during
  the reviewed Mastercard activation; do not apply the old migration backlog.
- Recovered workspace source may predate active bundles. Version metadata and
  hashes identify the actual snapshot. Script GET can return an inactive upload.
- Keep secrets, signing identities, customer records, private R2 files and
  conversation screenshots out of Git. Database exports here are schema only.
- The separate Mastercard Worker adapter was removed. Mastercard activation
  must use `ops/activation/README.md`: preserve the original frontend manifest,
  patch only checkout artifacts and retain all four supporting Worker versions.
  Do not run the old full Next build or re-enable automatic GitHub deployment.

- The Opus Pay checkout release uses `ops/activation/OPUS-PAY.md`. It preserves
  the existing frontend outside checkout, applies no database migration, and
  leaves the four supporting Workers and automatic deployment protection intact.
