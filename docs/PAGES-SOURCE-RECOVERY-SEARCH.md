# Search for the 16 original Pages Functions

The owner requested a further search after the production snapshot was pushed.
The extended search on 15 November recovered **zero original function files**.
All 16 entries remain in the missing-source manifest and production builds
remain guarded. No running website deployment was changed.

The search covered the linked repository, its eight saved branches and all nine
pull-request head trees; default-branch trees and the recorded upload commit
across 14 accessible organization repositories; the other Opus repository's
autoconfiguration branch; local and ignored build folders; four source maps;
Git stashes/unreachable objects; and Wrangler logs. None supplied the originals.

Cloudflare storage checks inspected all 122 objects in `opus-inbox-private` and
113 objects in `opuszim-uploads`, without reading customer message bodies. No
source/build archive candidate was identified. Attachment metadata listed no
code/archive candidates. Own-site download/repository metadata did not identify
an alternate source. No source archive was present in the checked GitHub release
assets or listed Actions artifacts. The listed D1 backup was not downloaded,
since it is a database artifact rather than application source.

The original direct-upload deployment returned no build-log entries. Its
Functions endpoint returns the deployed routing manifest, not the original
TypeScript or full function bundle. The 16 routes continue running in the
published deployment; their absence from GitHub does not mean they were removed
from the working website.

The recorded upload commit cannot be fetched from the linked repository or
found in the checked organization repositories. Together with the direct
upload's `commit_dirty: true`, this supports a source-control gap. It does not
identify the author/session or prove that no other backup exists.

Recovery now requires the original working folder, a source map containing the
original sources, or the complete `_worker.bundle` from the 7–8 November upload.
If these cannot be recovered, rebuilding the missing handlers is a separate
implementation task and must be validated against the existing API behavior,
authentication, payment verification and database schema before deployment.

Full per-location results and limitations are recorded in
[`source-recovery-search.json`](../production/state/source-recovery-search.json).
Cloudflare KV listing was unavailable (HTTP 401); it is not represented as
searched. No placeholder handlers or guessed implementations were added.
