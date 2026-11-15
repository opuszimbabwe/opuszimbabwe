# Live website and repository deployment audit

Verified 15 November 2026. This audit made no production changes and did not
modify credentials, DNS, deployment selection, or saved repository selection.

## Finding

The working website is not a clean build of the current GitHub repository.
Cloudflare's active Pages deployment was a direct upload containing local
changes outside its recorded Git commit. Subsequent Worker enhancements were
also deployed independently of this repository. Publishing and saving source
to GitHub were separate operations; the evidence shows they diverged.

## Deployment evidence

| Time (UTC) | Event | Evidence |
| --- | --- | --- |
| 28 October, 11:59 | Main reached `5c9e13e` | GitHub activity and Git history; last main push before 13 November. |
| 7–8 November | Repeated direct Pages uploads | Cloudflare reports `deployment_trigger.type: ad_hoc`, `commit_dirty: true`, recorded SHA `5baa5e9aad8d54c8d69f625f5c612761b778ef80`. |
| 8 November, 09:50 | Currently approved working deployment created | Pages deployment `18a7f56e-775d-4ac4-a15f-91083eebd122`. |
| 13 November, 20:42–20:51 | GitHub pushes built and deployed older repository-based source | Deployments `279cea47-18cb-4e1b-8882-1d4ac3e367cf`, `5eaed3ae-5c30-42ef-bcc5-c2668d6179a3`, `50ff17e1-5bac-4297-8450-5b32c99b3ce6`; trigger `github:push`, clean commits `ef3154d`, `dde8404`, `c3762a0`. |
| Current | Pages serves the earlier working upload | Canonical deployment remains `18a7f56e-775d-4ac4-a15f-91083eebd122`, rather than those newer GitHub deployments. Its metadata was modified on 13 November at 21:17. |

The direct-upload commit message is “Enable text-only WhatsApp AI when Gemini is
configured.” That SHA is absent from this local repository and from all other
selected local checkouts. A direct fetch of that exact SHA from the linked
GitHub origin returns `not our ref`. Public commit search also found no match.
Direct-upload commit metadata is supplied by the uploader; it does not prove
that the commit was ever pushed to this GitHub repository.

## Repository checks

Cloudflare's linked repository and the local origin both identify
`opuszimbabwe/opuszimbabwe`. GitHub repository ID `1327234980` matches Cloudflare,
so this is not simply a similarly named repository pointing somewhere else.

The audit fetched current main and all eight saved `arena/*` branches without
checking out a different branch or altering local work. Those saved branches
date from September/October and contain neither the live website chat nor
Paynow webhook code. GitHub's main-history query for
`functions/api/chat/messages.ts` returns no commits. Local stash and unreachable
object checks did not recover the missing source. The returned GitHub activity
contains pushes, branch creations and PR merges, with no force-push event; there
is no evidence here to attribute the gap to a force push or deletion.

The live Pages route manifest references these source files absent from this
checkout:

- `functions/api/admin/domain-applications.ts`
- `functions/api/admin/feedback.ts`
- `functions/api/admin/project-download.ts`
- `functions/api/admin/push.ts`
- `functions/api/admin/website-chat.ts`
- `functions/api/admin/whatsapp-assets.ts`
- `functions/api/admin/whatsapp.ts`
- `functions/api/assistant.ts`
- `functions/api/chat/attachment.ts`
- `functions/api/chat/messages.ts`
- `functions/api/chat/session.ts`
- `functions/api/domains/applications.ts`
- `functions/api/downloads/[id].ts`
- `functions/api/feedback.ts`
- `functions/api/payments/paynow-webhook.ts`
- `functions/api/whatsapp.ts`

## Cloudflare-only enhancements

The main-domain route `opuszim.co.zw/*` uses `opus-content-first-paint` in front
of the original Pages website. Inbox/notification/native-app changes also use
independent Worker services and private storage. Many enhancement source files
are currently under `/workspace/scratch/opus-first-paint`, `opus-inbox-app`,
`opus-notifications`, and `opus-native`, outside this Git repository. A saved
bundle of the original active Worker exists in the workspace, but those
enhancement files and bundles do not replace the missing original Pages
Functions source.

The separate Mastercard adapter was removed before this audit; the original
native-v25 Worker version `2ddd36f5-0fb5-4693-b665-78c50ceadf81` remains active.
The existing-checkout Mastercard patch is local and tested, not deployed.

## Payment credentials and recovery

Both Pesepay secrets already exist as encrypted production settings on the
original `opuszimbabwe` Pages project. Updating that checkout in the same
project should reuse those settings. Duplicating them into an unrelated
Worker is not required for the intended direct checkout update.

The checked Cloudflare APIs provide deployed asset hashes, route metadata and
configuration. They have not provided the original Pages Functions source.
The static files can be preserved from the manifest, but rebuilding this older
checkout's complete Functions would omit the live endpoints listed above.

Recover the complete source/build bundle from the workspace or backup used for
the 7–8 November direct uploads, or another saved project containing those
files. Bring the live Pages source and later Worker sources into tracked paths
with a reproducible deployment procedure, then merge and deploy the narrow
checkout change using the existing Pages credentials.

GitHub production deployment is currently enabled. Until source and production
are reconciled, a push to main can deploy the older repository-based website
over the approved working upload. No push, merge, deployment or auto-deploy
configuration change was made during this audit.

Cloudflare metadata establishes the upload method, but does not identify which
AI session or person authored the uncommitted files. The audit-log request for
the relevant 13 November window returned no entries; authorship cannot be
assigned from that response.

## Repository synchronization after this audit

The owner subsequently requested a GitHub synchronization. Automatic GitHub
Pages deployments were paused before pushing the recovery commit; the previous
configuration is preserved in `production/state/github-deployment-protection.json`.
This does not stop the currently running website. The repository now captures
455 hash-verified public assets, all four active Worker bundles, 199 available
source/app files, public binding topology and database schema definitions.
The missing original Pages server source and four protected admin shell assets
are explicitly listed rather than represented as recovered. A build guard and
recovery CI checks prevent deploying the older Next.js baseline by accident.

An additional owner-requested source search checked organization repositories,
pull-request trees, ignored build/source-map caches, all Opus R2 objects and
archive metadata. It did not recover the 16 original Pages handler files. See
`PAGES-SOURCE-RECOVERY-SEARCH.md` for the checked locations and limitations.
