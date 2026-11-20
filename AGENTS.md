# Production source recovery

- Read `production/README.md`, `docs/RECONSTRUCTED-PAGES-FUNCTIONS.md` and
  `production/state/recovery-status.json` before deployment work. All 16 missing
  handlers now have reconstructed implementations, not recovered originals.
  The root frontend and some supporting code still predate the working site.
- The working Pages deployment is recorded in `production/current-release.json`
  (currently `31e58f94-d25a-4ec0-8c55-95a774eeb02f`). The original
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
  the existing frontend outside checkout, uses only the explicit additive 0028 wallet migration when activating direct wallet flows, and
  leaves the four supporting Workers and automatic deployment protection intact.

- A shared-cookie-choice release may add the versioned shared preference script
  to public HTML and a factual /cookie-policy/ notice. Keep existing page bodies,
  protected admin HTML, payment storage and backend modules unchanged. The
  dedicated opus-www-redirect Worker is scoped only to www.opuszim.co.zw/*;
  it does not replace any of the four preserved supporting Workers.

- The reviewed SEO repair uses `ops/site/deploy-seo.py` and `seo-routes.json`.
  Preserve the active snapshot; allow only canonical public metadata, sitemap,
  three service aliases, correct 404 status and the preserved Care component
  fallback. Keep private/checkout exclusions and all supporting Workers intact.

- Confirmed public-content updates use `ops/site/deploy-public-content.py`: About,
  Privacy, Terms, their RSC payloads and dated policy PDFs only. Preserve all
  other assets, Loaners noindex, the backend and supporting Worker versions.

- The authorised WhatsApp tracker uses `ops/site/deploy-whatsapp-tracker.py` and
  additive migration 0029 only. Preserve every frontend hash and supporting Worker.
  Keep diagnostics behind strict Access auth; no live test sends, secret export,
  old-message replays, or Meta account/subscription changes during deployment.

- Service-reply safeguards use `ops/site/deploy-whatsapp-service-policy.py` and
  additive migration 0030 only. Keep outside-window/template sends disabled until
  approved templates and documented opt-in exist. No live test sends or billing changes.

- AI isolation uses `ops/site/deploy-ai-diagnostics.py`: backend only, no schema or
  secret changes, preserve every frontend hash and supporting Worker. Provider
  diagnostics contain metadata only. User-authorised controlled test is separate
  from deployment and must wait for a successful no-delivery AI probe.

- WhatsApp text-format releases use `ops/site/deploy-whatsapp-format.py`, with
  unchanged frontend hashes, no migrations and mocked providers only.
