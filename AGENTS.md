# Production source recovery

- Read `production/README.md` and `production/state/recovery-status.json` before
  deployment work. The root Next.js app is older than the working site; 16 live
  Pages Functions remain missing.
- The working Pages deployment is `18a7f56e-775d-4ac4-a15f-91083eebd122`.
  Preserve it and its supporting Workers during source recovery.
- Preserve the production build guard. Do not use `build:legacy` for production
  or re-enable automatic deployment while source recovery is incomplete.
- Recovered workspace source may predate active bundles. Version metadata and
  hashes identify the actual snapshot. Script GET can return an inactive upload.
- Keep secrets, signing identities, customer records, private R2 files and
  conversation screenshots out of Git. Database exports here are schema only.
- The separate Mastercard Worker adapter was removed. The pending checkout
  feature patch is separate from this current-version recovery snapshot.
