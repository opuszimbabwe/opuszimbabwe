# Production recovery tools

These tools export or verify files. None publishes a site or sends a payment.

```sh
npm ci --ignore-scripts
npm run verify
```

`export-cloudflare.py` requires a Cloudflare token in the environment and a
previously verified active root-Worker bundle. It exports route/configuration
metadata, active Worker modules and D1 schema. Secret values and database rows
are never exported. It stops on unexpected deployment identities; update those
assertions only after reviewing a new production baseline.

`export-pages-assets.cjs` requires Chromium and reads the public production
Pages hostname. Only files matching original asset hashes are stored. Protected
admin assets are skipped. TLS verification is retained; if the managed proxy
provides a CA, Chromium trusts that exact SPKI. Access is not bypassed.

`import-workspace.py --scratch /path/to/source-folders` imports available source
while excluding keys, customer screenshots/data, installers, caches and obsolete
bundles. Recovery copies may predate their latest deployed runtime.

The unrelated redesign preview and pending Mastercard feature are not included.
