# Recovered workspace source

These 199 source, app and brand files were outside the Git checkout. They are
now versioned so they are not lost with the workspace.

The sibling layout preserves relative imports and app builders. The directories
hold available website enhancements, inbox UI, notifications and native apps.
The source inventory records every copied file and its SHA-256 hash.

Some files predate the active bundles: Android source is 1.0.3 while the live
download is 1.0.5. Historical READMEs and upload scripts describe earlier work;
they are recovery references, not current deployment instructions. The unsafe
original first-paint deploy script and superseded Worker backups were excluded.

Use `production/workers/*/deployment.json` to identify authoritative active
bundles. Review differences before rebuilding or deploying these workspace
copies. Credentials, signing keys, private data, customer screenshots,
dependency caches and installer outputs are absent.
